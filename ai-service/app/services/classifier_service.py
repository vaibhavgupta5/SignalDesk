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
            temperature=0.2,
            max_tokens=2048
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
        parsed = self.parse_json(text)
        
        if parsed and "classifications" in parsed:
            return parsed["classifications"]
        return []
    
    async def classify(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> ClassifyOut:
        """Classify messages into signal categories"""
        
        # Build prompt and query LLM
        user_prompt = self.build_user_prompt(messages, context)
        response = await self.query(user_prompt)
        
        # Parse response
        classifications = self.parse_response(response)
        
        # Build output with fallback
        classified_messages = []
        for i, msg in enumerate(messages):
            # Find matching classification
            classification = next(
                (c for c in classifications if c.get("index") == i),
                None
            )
            
            if classification:
                types = classification.get("types", ["SUGGESTION"])
                confidence = float(classification.get("confidence", 0.7))
                reason = classification.get("reason", "LLM classification")
            else:
                # Fallback to keyword-based
                types, confidence = self._fallback_classify(msg.message)
                reason = "Fallback keyword classification"
            
            # Convert to MessageType enums
            message_types = []
            for t in types:
                try:
                    message_types.append(MessageType[t.upper()])
                except KeyError:
                    pass
            
            if not message_types:
                message_types = [MessageType.SUGGESTION]
            
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
        
        return ClassifyOut(
            messages=classified_messages,
            explanation=f"Classified {len(classified_messages)} message(s)"
        )
    
    def _fallback_classify(self, text: str) -> tuple:
        """Fallback keyword-based classification"""
        text_lower = text.lower()
        types = []
        
        if any(w in text_lower for w in ["must", "should", "have to", "need to", "required", "cannot", "can't"]):
            types.append("CONSTRAINT")
        
        if any(w in text_lower for w in ["decide", "decided", "decision", "chose", "chosen", "agreed", "confirmed"]):
            types.append("DECISION")
        
        if any(w in text_lower for w in ["will do", "implement", "build", "create", "complete", "finish", "by tomorrow", "deliver", "ship"]):
            types.append("ACTION")
        
        if any(w in text_lower for w in ["assume", "assuming", "probably", "think", "believe", "expect", "likely"]):
            types.append("ASSUMPTION")
        
        if any(w in text_lower for w in ["suggest", "maybe", "consider", "could", "might", "try", "what if", "how about"]):
            types.append("SUGGESTION")
        
        return (types if types else ["SUGGESTION"], 0.6)


# Singleton instance
classifier_service = ClassifierService()
