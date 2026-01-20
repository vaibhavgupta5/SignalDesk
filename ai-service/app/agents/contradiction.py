"""
Contradiction Agent - Delegates to ContradictionService for conflict detection.
"""

from typing import Optional, List

from app.schemas.input import ContextIn, ChatMessage
from app.schemas.output import ContradictOut
from app.services.contradiction_service import contradiction_service


async def find_contradictions(
    messages: List[ChatMessage], context: Optional[ContextIn] = None
) -> ContradictOut:
    """
    Detect contradictions in messages given prior context using LLM.
    
    Identifies: decision conflicts, constraint violations, assumption conflicts,
    reversals, and invalid assumptions.
    
    Args:
        messages: List of chat messages to analyze
        context: Prior decisions, actions, assumptions to check against
    
    Returns:
        ContradictOut with detected contradictions and consistency flag
    """
    return await contradiction_service.detect(messages, context)
