"""
Nano Filter Agent - Delegates to FilterService for message filtering.
"""

from typing import List

from app.schemas.input import ChatMessage
from app.services.filter_service import filter_service, FilterResult


async def useful_filter(text: str) -> dict:
    """
    Filter whether a single message is useful or noise using LLM.
    
    Args:
        text: Message text to evaluate
    
    Returns:
        dict with 'useful' (bool), 'reason' (str), 'confidence' (float)
    """
    result = await filter_service.filter_single(text)
    return result.to_dict()


async def filter_messages(messages: List[ChatMessage]) -> List[FilterResult]:
    """
    Filter multiple messages to identify useful vs noise.
    
    Args:
        messages: List of chat messages to filter
    
    Returns:
        List of FilterResult objects
    """
    return await filter_service.filter_messages(messages)
