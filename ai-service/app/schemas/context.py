from pydantic import BaseModel
from typing import Dict, Any, Optional


class RequestContext(BaseModel):
    """Stateless per-request context: all history supplied by caller"""
    message_id: Optional[str] = None
    timestamp: Optional[str] = None
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
