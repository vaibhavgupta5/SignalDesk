"""
Classifier Service - Classifies chat messages into signal categories.
"""

from typing import List, Optional

from app.schemas.input import ChatMessage, ContextIn
from app.schemas.output import ClassifyOut, ClassifiedMessage, MessageType, ConfidenceScore
from app.services.base import LLMClient
from app.utils.confidence import normalize_confidence


class ClassifierService(LLMClient[ClassifyOut]):
    """Service for classifying chat messages into DECISION, ACTION, ASSUMPTION, SUGGESTION, CONSTRAINT"""
    
    def __init__(self):
        super().__init__(
            prompt_file="classifier.txt",
            temperature=0.1,
            max_tokens=4096
        )
    
    def build_user_prompt(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> str:
        """Build classification prompt for batch of messages"""
        
        # Format messages as JSON-like structure
        messages_json = []
        for i, msg in enumerate(messages):
            messages_json.append({
                "index": i,
                "user": msg.user,
                "message": msg.message,
                "timestamp": msg.timestamp or ""
            })
        
        import json
        messages_str = json.dumps(messages_json, indent=2)
        
        # Build context string
        context_str = ""
        if context:
            context_parts = []
            if context.prior_decisions:
                context_parts.append(f"Prior Decisions: {json.dumps(context.prior_decisions)}")
            if context.prior_actions:
                context_parts.append(f"Prior Actions: {json.dumps(context.prior_actions)}")
            if context.prior_assumptions:
                context_parts.append(f"Prior Assumptions: {json.dumps(context.prior_assumptions)}")
            if context.prior_constraints:
                context_parts.append(f"Prior Constraints: {json.dumps(context.prior_constraints)}")
            if context_parts:
                context_str = "\n\nHISTORICAL CONTEXT:\n" + "\n".join(context_parts)
        
        return f"""
INPUT MESSAGES:
{messages_str}
{context_str}

Classify each message. A single message can have MULTIPLE types.
Return a JSON array with one object per message:
{{
  "classifications": [
    {{
      "index": 0,
      "types": ["DECISION", "ACTION"],
      "confidence": 0.85,
      "reason": "Message contains a committed decision and implies action"
    }}
  ]
}}
"""
    
    def parse_response(self, response: dict) -> List[dict]:
        """Parse LLM response into classification results"""
        text = response.get("response", "{}")
        from app.services.base import logger
        logger.debug(f"Parsing classifier response text: {text}")
        parsed = self.parse_json(text)
        
        if not parsed:
            logger.warning("LLM response could not be parsed as JSON")
            return []

        # Robust extraction: handle both {"classifications": [...]} and [...]
        results = []
        if isinstance(parsed, dict):
            results = parsed.get("classifications", [])
            if not results and "extracted" in parsed: # Sometimes LLM confuses keys
                results = parsed.get("extracted", [])
        elif isinstance(parsed, list):
            results = parsed

        if results:
            logger.info(f"Successfully parsed {len(results)} classifications from LLM")
            return results
        
        logger.warning(f"No valid classification list found in parsed result: {parsed}")
        return []
    
    async def classify(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> ClassifyOut:
        """Classify messages into signal categories"""
        from app.services.base import logger
        logger.info(f"Classifying batch of {len(messages)} messages")
        
        # Build prompt and query LLM
        user_prompt = self.build_user_prompt(messages, context)
        response = await self.query(user_prompt)
        
        # Parse response
        classifications = self.parse_response(response)
        
        # Build output with fallback
        classified_messages = []
        llm_error = response.get("error") if not response.get("success") else None
        
        for i, msg in enumerate(messages):
            # Find matching classification (robust to string vs int index)
            classification = None
            if isinstance(classifications, list):
                # Search by index field
                classification = next(
                    (c for c in classifications if str(c.get("index")) == str(i)),
                    None
                )
            
            if classification:
                # Support multiple key names commonly used by LLMs
                raw_types = classification.get("types", classification.get("type", classification.get("category", [])))
                if isinstance(raw_types, str):
                    raw_types = [raw_types]
                
                confidence = float(classification.get("confidence", 0.7))
                reason = classification.get("reason", "LLM classification")
                logger.debug(f"Msg {i} matched LLM result: {raw_types}")
            else:
                # Fallback to keyword-based
                raw_types, confidence = self._fallback_classify(msg.message)
                reason = "Fallback keyword classification"
                if llm_error:
                    reason += f" (LLM failure: {llm_error})"
                else:
                    reason += " (No LLM match for index)"
                logger.info(f"Msg {i} using fallback. LLM Error: {llm_error}")
            
            # Convert to MessageType enums
            message_types = []
            for t in raw_types:
                try:
                    t_clean = str(t).upper().strip().replace(" ", "_")
                    # Handle common synonyms
                    if t_clean == "RESOLVED": t_clean = "DECISION"
                    if t_clean == "TASK": t_clean = "ACTION"
                    
                    message_types.append(MessageType[t_clean])
                except (KeyError, AttributeError):
                    logger.warning(f"Unknown type '{t}' for Msg {i}")
                    pass
            
            if not message_types:
                # If conversion failed, try mapping or default to OTHER
                message_types = [MessageType.OTHER]
            
            classified_messages.append(
                ClassifiedMessage(
                    user=msg.user,
                    message=msg.message,
                    timestamp=msg.timestamp,
                    type=message_types,
                    confidence=ConfidenceScore(
                        score=normalize_confidence(confidence),
                        reason=reason
                    )
                )
            )
        
        explanation = f"Classified {len(classified_messages)} message(s)"
        if llm_error:
            explanation += f" [LLM Note: {llm_error}]"
        
        logger.info(f"Final Batch Consistency Check: {len(classified_messages)}/{len(messages)}")
        return ClassifyOut(
            messages=classified_messages,
            explanation=explanation
        )
    
    def _fallback_classify(self, text: str) -> tuple:
        """Fallback keyword-based classification"""
        text_lower = text.lower()
        types = []
        
        # Decision Markers
        if any(w in text_lower for w in ["decided", "choose", "go with", "confirmed", "agreed", "settled on", "final", "approved", "decision", "resolv", "finalize"]):
            types.append("DECISION")
        
        # Action Markers
        if any(w in text_lower for w in ["will do", "implement", "build", "create", "complete", "finish", "deliver", "ship", "send", "deploy", "by tomorrow", "task", "follow up"]):
            types.append("ACTION")
        
        # Assumption Markers
        if any(w in text_lower for w in ["assume", "assuming", "probably", "think", "believe", "expect", "likely", "should be", "guess", "trust"]):
            types.append("ASSUMPTION")
        
        # Suggestion Markers
        if any(w in text_lower for w in ["suggest", "maybe", "consider", "could", "might", "try", "what if", "how about", "perhaps", "proposal", "idea"]):
            types.append("SUGGESTION")
        
        # Constraint Markers
        if any(w in text_lower for w in ["must", "should", "have to", "need to", "required", "cannot", "can't", "limit", "restriction", "mandatory", "never", "only"]):
            types.append("CONSTRAINT")

        # Question Markers
        if "?" in text_lower or any(w in text_lower for w in ["how", "why", "when", "who", "what", "where", "whether", "if "]):
            types.append("QUESTION")
        
        if not types:
            types = ["OTHER"]
            
        return (types, 0.4)


# Singleton instance
classifier_service = ClassifierService()
