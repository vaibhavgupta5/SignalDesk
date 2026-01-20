"""
Extractor Agent - Delegates to ExtractorService for structured data extraction.
"""

from typing import Optional, List

from app.schemas.input import ContextIn, ChatMessage
from app.schemas.output import ExtractOut
from app.services.extractor_service import extractor_service


async def extract_structured(
    messages: List[ChatMessage], context: Optional[ContextIn] = None
) -> ExtractOut:
    """
    Extract structured key-value pairs from messages using LLM.
    
    Extracts: deadlines, assignees, deliverables, resources, priorities, etc.
    Each field includes a confidence score.
    
    Args:
        messages: List of chat messages to extract from
        context: Optional historical context
    
    Returns:
        ExtractOut with extracted fields and confidence scores
    """
    return await extractor_service.extract(messages, context)
