"""
Ask Service - Queries specific categories from conversation history.
"""

from typing import List, Optional
import json

from app.schemas.input import ChatMessage, ContextIn
from app.schemas.output import AskOut, AskItem, ConfidenceScore
from app.services.base import LLMClient, logger
from app.utils.confidence import normalize_confidence


class AskService(LLMClient[AskOut]):
    """Service for querying specific signal types from conversation"""
    
    def __init__(self):
        super().__init__(
            prompt_file="ask.txt",
            temperature=0.1,
            max_tokens=2048
        )
    
    def build_user_prompt(
        self,
        category: str,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> str:
        """Build the ask prompt"""
        
        # Format conversation
        conversation = "\n".join([
            f"[{msg.user}]: {msg.message}"
            for msg in messages
        ])
        
        # Build context
        context_str = "None"
        if context:
            parts = []
            if context.prior_decisions: parts.append(f"Decisions: {context.prior_decisions}")
            if context.prior_actions: parts.append(f"Actions: {context.prior_actions}")
            if parts:
                context_str = "\n".join(parts)
        
        # Map /type to CATEGORY if needed
        clean_category = category.strip().strip("/").upper()
        
        return self.prompt_template.format(
            category=clean_category,
            messages=conversation,
            context=context_str
        )
    
    def parse_response(self, response: dict) -> tuple:
        """Parse LLM response into ask results and insights"""
        text = response.get("response", "{}")
        logger.debug(f"Parsing ask response: {text}")
        parsed = self.parse_json(text)
        
        items = []
        insight = None
        
        if isinstance(parsed, dict):
            items = parsed.get("items", [])
            insight = parsed.get("ai_insight")
        elif isinstance(parsed, list):
            items = parsed
            
        return items, insight
    
    async def ask(
        self,
        category: str,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> AskOut:
        """Query for items matching category"""
        # Map ASK to QUESTION for internal consistency
        mapped_category = category.strip().strip("/").upper()
        if mapped_category == "ASK":
            mapped_category = "QUESTION"
            
        logger.info(f"Asking for {mapped_category} (original: {category}) in {len(messages)} messages")
        
        user_prompt = self.build_user_prompt(mapped_category, messages, context)
        response = await self.query(user_prompt)
        
        items_data, ai_insight = self.parse_response(response)
        
        final_items = []
        for i, item in enumerate(items_data):
            try:
                score = normalize_confidence(float(item.get("confidence", 0.7)))
                final_items.append(
                    AskItem(
                        text=item.get("text", ""),
                        user=item.get("user", "unknown"),
                        confidence=ConfidenceScore(
                            score=score,
                            reason=item.get("reason", "LLM extraction")
                        )
                    )
                )
            except Exception as e:
                logger.error(f"Error parsing ask item {i}: {e}")
                continue
        
        # Fallback if empty
        if not final_items:
            logger.info(f"LLM found no {mapped_category}, trying keyword fallback")
            final_items = self._fallback_ask(mapped_category, messages)
            if not ai_insight:
                ai_insight = f"No direct items found for {mapped_category}. Consider reviewing the conversation for implicit signals."
            
        return AskOut(
            items=final_items,
            query_type=mapped_category,
            ai_insight=ai_insight
        )
    
    def _fallback_ask(self, category: str, messages: List[ChatMessage]) -> List[AskItem]:
        """Simple keyword-based fallback for Ask"""
        from app.services.classifier_service import classifier_service
        
        cat_upper = category.strip().strip("/").upper()
        results = []
        
        for msg in messages:
            types, score = classifier_service._fallback_classify(msg.message)
            # If our fallback classifier thinks it matches the category
            if any(t.upper() == cat_upper for t in types):
                results.append(
                    AskItem(
                        text=msg.message,
                        user=msg.user,
                        confidence=ConfidenceScore(
                            score=score,
                            reason=f"Fallback keyword match for {cat_upper}"
                        )
                    )
                )
        return results


# Singleton instance
ask_service = AskService()
