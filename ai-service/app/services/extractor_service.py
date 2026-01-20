"""
Extractor Service - Extracts structured key-value pairs from chat messages.
"""

from typing import List, Optional

from app.schemas.input import ChatMessage, ContextIn
from app.schemas.output import ExtractOut, ExtractedField, ConfidenceScore
from app.services.base import LLMClient
from app.utils.confidence import normalize_confidence


class ExtractorService(LLMClient[ExtractOut]):
    """Service for extracting structured data from conversation messages"""
    
    def __init__(self):
        super().__init__(
            prompt_file="extractor.txt",
            temperature=0.1,  # Low temperature for precise extraction
            max_tokens=2048
        )
    
    def build_user_prompt(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> str:
        """Build extraction prompt"""
        
        # Format conversation
        conversation = "\n".join([
            f"[{msg.timestamp or 'N/A'}] {msg.user}: {msg.message}"
            for msg in messages
        ])
        
        # Build context
        context_str = ""
        if context:
            context_parts = []
            if context.prior_decisions:
                context_parts.append(f"Known Decisions: {', '.join(context.prior_decisions)}")
            if context.prior_actions:
                context_parts.append(f"Known Actions: {', '.join(context.prior_actions)}")
            if context_parts:
                context_str = "\n\nKNOWN CONTEXT:\n" + "\n".join(context_parts)
        
        return f"""
CONVERSATION:
{conversation}
{context_str}

Extract all structured information from this conversation.
Return a JSON object with extracted fields:
{{
  "extracted": [
    {{
      "key": "deadline",
      "value": "2024-01-20",
      "confidence": 0.95,
      "source": "Complete this by tomorrow",
      "reason": "Explicit deadline mentioned"
    }},
    {{
      "key": "assignee",
      "value": "Bob",
      "confidence": 0.90,
      "source": "Bob will handle the API",
      "reason": "Direct assignment"
    }}
  ]
}}
"""
    
    def parse_response(self, response: dict) -> List[dict]:
        """Parse LLM response into extraction results"""
        text = response.get("response", "{}")
        from app.services.base import logger
        logger.debug(f"Parsing extractor response: {text}")
        parsed = self.parse_json(text)
        
        if parsed and "extracted" in parsed:
            logger.info(f"Successfully parsed {len(parsed['extracted'])} entities from LLM")
            return parsed["extracted"]
        
        logger.warning(f"No 'extracted' key found in response: {parsed}")
        return []
    
    async def extract(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> ExtractOut:
        """Extract structured data from messages"""
        from app.services.base import logger
        logger.info(f"Extracting entities from {len(messages)} messages")
        
        # Build prompt and query LLM
        user_prompt = self.build_user_prompt(messages, context)
        response = await self.query(user_prompt)
        
        # Parse response
        extractions = self.parse_response(response)
        
        # Build output
        items = []
        for i, ext in enumerate(extractions):
            try:
                score = normalize_confidence(float(ext.get("confidence", 0.5)))
                key = ext.get("key", "unknown")
                val = ext.get("value", "")
                
                logger.debug(f"Entity {i} extracted: {key}={val} (score {score})")
                
                items.append(
                    ExtractedField(
                        key=key,
                        value=val,
                        confidence=ConfidenceScore(
                            score=score,
                            reason=ext.get("reason", "LLM extraction")
                        )
                    )
                )
            except Exception as e:
                logger.error(f"Error parsing single extraction {i}: {e}")
                continue
        
        # If no extractions, try fallback
        if not items:
            logger.info("LLM returned no entities, triggering keyword-based fallback extraction")
            combined = " ".join([m.message for m in messages])
            items = self._fallback_extract(combined)
            logger.info(f"Fallback extraction found {len(items)} entities")
        
        return ExtractOut(
            items=items,
            raw_text="\n".join([f"{m.user}: {m.message}" for m in messages])
        )
    
    def _fallback_extract(self, text: str) -> List[ExtractedField]:
        """Fallback pattern-based extraction"""
        items = []
        text_lower = text.lower()
        
        # Temporal detection
        if any(w in text_lower for w in ["by", "due", "deadline", "tomorrow", "friday", "monday", "next week", "at", "on", "untill", "within"]):
            items.append(
                ExtractedField(
                    key="temporal",
                    value=text,
                    confidence=ConfidenceScore(score=0.4, reason="Temporal keyword detected (fallback)")
                )
            )
        
        # People detection
        if any(w in text_lower for w in ["will handle", "responsible", "for review", "approval from", "assigned to", "owner", "lead", "contact"]):
            items.append(
                ExtractedField(
                    key="people",
                    value=text,
                    confidence=ConfidenceScore(score=0.4, reason="People keyword detected (fallback)")
                )
            )
        
        # Deliverables detection
        if any(w in text_lower for w in ["create", "update", "generate", "build", "deliver", "ship", "send", "write", "design"]):
            items.append(
                ExtractedField(
                    key="deliverable",
                    value=text,
                    confidence=ConfidenceScore(score=0.4, reason="Deliverable keyword detected (fallback)")
                )
            )

        # Resources detection
        if any(w in text_lower for w in ["budget", "cost", "price", "use", "with", "requires", "depends on", "tool", "software", "database"]):
             items.append(
                ExtractedField(
                    key="resource",
                    value=text,
                    confidence=ConfidenceScore(score=0.4, reason="Resource keyword detected (fallback)")
                )
            )

        # Priority & Status detection
        if any(w in text_lower for w in ["urgent", "asap", "priority", "critical", "p0", "blocked", "waiting", "pending", "risk", "delay", "issue"]):
             items.append(
                ExtractedField(
                    key="priority_status",
                    value=text,
                    confidence=ConfidenceScore(score=0.5, reason="Priority/Status keyword detected (fallback)")
                )
            )
        
        return items


# Singleton instance
extractor_service = ExtractorService()
