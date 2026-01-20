"""
Filter Service - Filters useful vs noise messages.
"""

from typing import List, Optional

from app.schemas.input import ChatMessage
from app.services.base import LLMClient
from app.utils.confidence import normalize_confidence


class FilterResult:
    """Result of filtering a message"""
    def __init__(self, useful: bool, reason: str, confidence: float, text: str):
        self.useful = useful
        self.reason = reason
        self.confidence = confidence
        self.text = text
    
    def to_dict(self) -> dict:
        return {
            "useful": self.useful,
            "reason": self.reason,
            "confidence": self.confidence,
            "text": self.text
        }


class FilterService(LLMClient[FilterResult]):
    """Service for filtering useful messages from noise"""
    
    def __init__(self):
        super().__init__(
            prompt_file="nano_filter.txt",
            temperature=0.1,
            max_tokens=256
        )
    
    def build_user_prompt(self, messages: List[ChatMessage]) -> str:
        """Build filter prompt"""
        
        messages_json = []
        for i, msg in enumerate(messages):
            messages_json.append({
                "index": i,
                "user": msg.user,
                "message": msg.message
            })
        
        import json
        messages_str = json.dumps(messages_json, indent=2)
        
        return f"""
MESSAGES TO FILTER:
{messages_str}

For each message, determine if it contains useful signal or is just noise.
Useful = Contains decisions, actions, constraints, questions, or substantive discussion
Noise = Greetings, acknowledgments, filler, off-topic chatter

Return a JSON object:
{{
  "results": [
    {{
      "index": 0,
      "useful": true,
      "reason": "Contains a decision about technology choice",
      "confidence": 0.90
    }}
  ]
}}
"""
    
    def parse_response(self, response: dict) -> List[dict]:
        """Parse LLM response into filter results"""
        text = response.get("response", "{}")
        parsed = self.parse_json(text)
        
        if parsed and "results" in parsed:
            return parsed["results"]
        return []
    
    async def filter_messages(
        self,
        messages: List[ChatMessage]
    ) -> List[FilterResult]:
        """Filter messages to identify useful vs noise"""
        
        # Build prompt and query LLM
        user_prompt = self.build_user_prompt(messages)
        response = await self.query(user_prompt)
        
        # Parse response
        results = self.parse_response(response)
        
        # Build output
        filter_results = []
        for i, msg in enumerate(messages):
            # Find matching result
            result = next(
                (r for r in results if r.get("index") == i),
                None
            )
            
            if result:
                useful = result.get("useful", True)
                reason = result.get("reason", "LLM classification")
                confidence = float(result.get("confidence", 0.7))
            else:
                # Fallback
                useful, reason, confidence = self._fallback_filter(msg.message)
            
            filter_results.append(
                FilterResult(
                    useful=useful,
                    reason=reason,
                    confidence=normalize_confidence(confidence),
                    text=msg.message
                )
            )
        
        return filter_results
    
    async def filter_single(self, text: str) -> FilterResult:
        """Filter a single text message"""
        msg = ChatMessage(user="user", message=text)
        results = await self.filter_messages([msg])
        return results[0] if results else FilterResult(True, "default", 0.5, text)
    
    def _fallback_filter(self, text: str) -> tuple:
        """Fallback keyword-based filtering"""
        text_lower = text.lower().strip()
        
        # Noise patterns
        noise_patterns = [
            "ok", "okay", "thanks", "thank you", "thx", "ty",
            "hi", "hello", "hey", "bye", "later",
            "lol", "haha", "😀", "👍", "sure", "yep", "yeah",
            "got it", "sounds good", "makes sense", "agreed"
        ]
        
        # Check if message is just noise
        if text_lower in noise_patterns or len(text_lower) < 3:
            return False, "Short acknowledgment or greeting", 0.8
        
        # Check for substantive content
        substantive_markers = [
            "decide", "action", "must", "should", "will", "need",
            "deadline", "by", "complete", "build", "implement",
            "assume", "think", "suggest", "consider", "constraint"
        ]
        
        if any(marker in text_lower for marker in substantive_markers):
            return True, "Contains substantive keywords", 0.75
        
        # Default to useful if not obvious noise
        return True, "Default classification", 0.5


# Singleton instance
filter_service = FilterService()
