"""
Classifier Agent - Delegates to ClassifierService for message classification.
"""

from typing import Optional, List

from app.schemas.input import ContextIn, ChatMessage
from app.schemas.output import ClassifyOut
from app.services.classifier_service import classifier_service


async def classify_messages(
    messages: List[ChatMessage], context: Optional[ContextIn] = None
) -> ClassifyOut:
    """
    Classify chat messages into signal categories using LLM.
    
    Categories: DECISION, ACTION, ASSUMPTION, SUGGESTION, CONSTRAINT, QUESTION, OTHER.
    Each message can have multiple types.
    
    Args:
        messages: List of chat messages to classify
        context: Optional historical context
    
    Returns:
        ClassifyOut with classified messages and explanation
    """
    return await classifier_service.classify(messages, context)
