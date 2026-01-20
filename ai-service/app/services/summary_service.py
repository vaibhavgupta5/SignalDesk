"""
Summary Service - Generates concise summaries of conversations.
"""

from typing import List, Optional

from app.schemas.input import ChatMessage, ContextIn
from app.schemas.output import SummarizeOut, ConfidenceScore
from app.services.base import LLMClient
from app.utils.confidence import normalize_confidence


class SummaryService(LLMClient[SummarizeOut]):
    """Service for generating concise conversation summaries"""
    
    def __init__(self):
        super().__init__(
            prompt_file="summary.txt",
            temperature=0.2,
            max_tokens=2048
        )
    
    def build_user_prompt(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> str:
        """Build summary prompt with data"""
        
        # Format conversation with metadata
        conversation_lines = []
        for msg in messages:
            timestamp = f"[{msg.timestamp}] " if msg.timestamp else ""
            conversation_lines.append(f"{timestamp}{msg.user}: {msg.message}")
        
        conversation = "\n".join(conversation_lines)
        
        # Build context
        context_str = "None"
        if context:
            parts = []
            if context.prior_decisions: parts.append(f"Decisions: {context.prior_decisions}")
            if context.prior_actions: parts.append(f"Actions: {context.prior_actions}")
            if parts:
                context_str = "\n".join(parts)
        
        return f"""
CONVERSATION DATA:
{conversation}

PRIOR CONTEXT:
{context_str}

Please generate the detailed summary and high-fidelity sequential timeline now.
"""
    
    def parse_response(self, response: dict) -> dict:
        """Parse LLM response into summary result"""
        text = response.get("response", "{}")
        from app.services.base import logger
        logger.debug(f"Parsing summary response: {text}")
        parsed = self.parse_json(text)
        
        if not parsed:
            logger.warning(f"Failed to parse summary JSON from: {text}")
            return {}

        # If it's a list, take the first item if it's a dict
        if isinstance(parsed, list) and len(parsed) > 0:
            parsed = parsed[0]
            
        if isinstance(parsed, dict):
            # Try potential keys
            summary = parsed.get("summary", parsed.get("text", ""))
            key_points = parsed.get("key_points", parsed.get("points", []))
            timeline = parsed.get("timeline", [])
            confidence = parsed.get("confidence", 0.7)
            
            result = {
                "summary": summary,
                "key_points": key_points,
                "timeline": timeline,
                "confidence": confidence
            }
            logger.info("Successfully parsed advanced summary result from LLM")
            return result
        
        logger.warning(f"Parsed JSON is not a dict: {type(parsed)}")
        return {}
    
    async def summarize(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> SummarizeOut:
        """Generate high-fidelity summary of messages"""
        from app.services.base import logger
        logger.info(f"Generating advanced summary for {len(messages)} messages")
        
        # Build prompt and query LLM
        user_prompt = self.build_user_prompt(messages, context)
        response = await self.query(user_prompt)
        
        # Parse response
        result = self.parse_response(response)
        
        from app.schemas.output import TimelineItem
        
        if result and result.get("summary"):
            summary = result["summary"]
            key_points = result.get("key_points", [])
            raw_timeline = result.get("timeline", [])
            confidence = float(result.get("confidence", 0.75))
            reason = "LLM-generated detailed summary"
            
            # Map raw timeline to objects
            timeline = []
            for item in raw_timeline:
                try:
                    timeline.append(TimelineItem(**item))
                except Exception:
                    continue
            
            logger.debug(f"LLM Summary Length: {len(summary)} chars")
        else:
            # Fallback
            logger.info("LLM advanced summary failed, using keyword fallback")
            result = self._fallback_summarize(messages)
            summary = result["summary"]
            key_points = result["key_points"]
            timeline = [] # Fallback doesn't support complex timelines yet
            confidence = result["confidence"]
            reason = "Fallback summary (LLM failure)"
        
        return SummarizeOut(
            summary=summary,
            key_points=key_points,
            timeline=timeline,
            confidence=ConfidenceScore(
                score=normalize_confidence(confidence),
                reason=reason
            )
        )
    
    def _fallback_summarize(self, messages: List[ChatMessage]) -> dict:
        """Fallback simple summarization with key point extraction"""
        if not messages:
            return {"summary": "No messages to summarize.", "key_points": [], "confidence": 0.4}
        
        combined = " ".join([m.message for m in messages])
        text_lower = combined.lower()
        
        # Extract potential key points using markers
        key_points = []
        
        # Decision markers
        if any(w in text_lower for w in ["decided", "chose", "agreed", "confirmed"]):
            key_points.append("DECISION: Potentially made (keyword detected)")
            
        # Action markers
        if any(w in text_lower for w in ["investigate", "implement", "build", "send", "deliver"]):
             key_points.append("ACTION: Work item mentioned")
             
        # Blocker markers
        if any(w in text_lower for w in ["must", "should", "blocked", "waiting", "cannot"]):
             key_points.append("BLOCKER/CONSTRAINT: Limitation identified")
             
        # Question markers
        if "?" in text_lower:
             key_points.append("QUESTION: Open item remaining")

        summary = combined[:197] + "..." if len(combined) > 200 else combined
        
        return {
            "summary": summary,
            "key_points": key_points,
            "confidence": 0.4
        }


# Singleton instance
summary_service = SummaryService()
