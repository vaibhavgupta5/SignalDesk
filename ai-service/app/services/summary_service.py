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
            temperature=0.3,
            max_tokens=512
        )
    
    def build_user_prompt(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> str:
        """Build summary prompt"""
        
        # Format conversation with metadata
        conversation_lines = []
        for msg in messages:
            timestamp = f"[{msg.timestamp}] " if msg.timestamp else ""
            conversation_lines.append(f"{timestamp}{msg.user}: {msg.message}")
        
        conversation = "\n".join(conversation_lines)
        
        # Build context
        context_str = ""
        if context:
            context_parts = []
            if context.prior_decisions:
                context_parts.append(f"Prior decisions: {len(context.prior_decisions)} items")
            if context.prior_actions:
                context_parts.append(f"Prior actions: {len(context.prior_actions)} items")
            if context_parts:
                context_str = f"\n\nContext: {', '.join(context_parts)}"
        
        return f"""
CONVERSATION ({len(messages)} messages):
{conversation}
{context_str}

Generate a concise summary (1-3 sentences) capturing:
1. Key decisions made
2. Actions assigned
3. Critical constraints or blockers

Return a JSON object:
{{
  "summary": "Your concise summary here",
  "key_points": ["point1", "point2"],
  "confidence": 0.85
}}
"""
    
    def parse_response(self, response: dict) -> dict:
        """Parse LLM response into summary result"""
        text = response.get("response", "{}")
        parsed = self.parse_json(text)
        
        if parsed:
            return {
                "summary": parsed.get("summary", ""),
                "key_points": parsed.get("key_points", []),
                "confidence": parsed.get("confidence", 0.7)
            }
        
        return {}
    
    async def summarize(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> SummarizeOut:
        """Generate summary of messages"""
        
        # Build prompt and query LLM
        user_prompt = self.build_user_prompt(messages, context)
        response = await self.query(user_prompt)
        
        # Parse response
        result = self.parse_response(response)
        
        if result and result.get("summary"):
            summary = result["summary"]
            key_points = result.get("key_points", [])
            confidence = float(result.get("confidence", 0.75))
            reason = "LLM-generated summary"
        else:
            # Fallback
            result = self._fallback_summarize(messages)
            summary = result["summary"]
            key_points = result["key_points"]
            confidence = result["confidence"]
            reason = "Fallback keyword summary"
        
        return SummarizeOut(
            summary=summary,
            key_points=key_points,
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
