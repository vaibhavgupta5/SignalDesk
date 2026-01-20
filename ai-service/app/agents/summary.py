"""
Summary Agent - Delegates to SummaryService for conversation summarization.
"""

from typing import Optional, List

from app.schemas.input import ContextIn, ChatMessage
from app.schemas.output import SummarizeOut
from app.services.summary_service import summary_service


async def summarize_text(
    messages: List[ChatMessage], context: Optional[ContextIn] = None
) -> SummarizeOut:
    """
    Generate a concise summary of messages using LLM.
    
    Focuses on: decisions made, actions assigned, blockers identified.
    
    Args:
        messages: List of chat messages to summarize
        context: Optional historical context
    
    Returns:
        SummarizeOut with concise summary and confidence
    """
    return await summary_service.summarize(messages, context)
