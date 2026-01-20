"""
Action Service - Extracts detailed actions with assignees, deadlines and priorities.
"""

from typing import List, Optional

from app.schemas.input import ChatMessage, ContextIn
from app.schemas.output import ActionOut, ActionItem
from app.services.base import LLMClient, logger


class ActionService(LLMClient[ActionOut]):
    """Service for extracting structured actions from conversation"""
    
    def __init__(self):
        super().__init__(
            prompt_file="action.txt",
            temperature=0.1,
            max_tokens=2048
        )
    
    def build_user_prompt(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> str:
        """Build action extraction prompt"""
        
        # Format conversation
        conversation = "\n".join([
            f"[{msg.timestamp or 'N/A'}] {msg.user}: {msg.message}"
            for msg in messages
        ])
        
        # Build context
        context_str = "None"
        if context:
            parts = []
            if context.prior_decisions: parts.append(f"Known Decisions: {context.prior_decisions}")
            if context.prior_actions: parts.append(f"Prior Actions: {context.prior_actions}")
            if parts:
                context_str = "\n".join(parts)
        
        return self.prompt_template.format(
            messages=conversation,
            context=context_str
        )
    
    def parse_response(self, response: dict) -> dict:
        """Parse LLM response into action results"""
        text = response.get("response", "{}")
        logger.debug(f"Parsing action response: {text}")
        parsed = self.parse_json(text)
        
        if isinstance(parsed, dict) and "actions" in parsed:
             return parsed
        
        return {"actions": [], "summary": "No actions found or parsing error."}
    
    async def extract_actions(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> ActionOut:
        """Extract all actions with metadata"""
        logger.info(f"Extracting actions from {len(messages)} messages")
        
        user_prompt = self.build_user_prompt(messages, context)
        response = await self.query(user_prompt)
        
        result_data = self.parse_response(response)
        
        actions = []
        for item in result_data.get("actions", []):
            try:
                actions.append(ActionItem(**item))
            except Exception as e:
                logger.error(f"Error parsing action item: {e}")
                continue
        
        return ActionOut(
            actions=actions,
            summary=result_data.get("summary", f"Found {len(actions)} actions.")
        )


# Singleton instance
action_service = ActionService()
