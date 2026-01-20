from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class ChatMessage(BaseModel):
    """Single chat message with metadata"""
    user: str
    message: str
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ContextIn(BaseModel):
    """Surrounding historical context (optional)"""
    prior_decisions: Optional[List[str]] = None
    prior_actions: Optional[List[str]] = None
    prior_assumptions: Optional[List[str]] = None
    prior_suggestions: Optional[List[str]] = None
    prior_constraints: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class ClassifyRequest(BaseModel):
    """Classify multiple chat messages into categories (decision, action, etc.)"""
    messages: List[ChatMessage]
    context: Optional[ContextIn] = None


class ExtractRequest(BaseModel):
    """Extract structured fields from messages"""
    messages: List[ChatMessage]
    context: Optional[ContextIn] = None


class ContradictRequest(BaseModel):
    """Detect contradictions in messages given context"""
    messages: List[ChatMessage]
    context: Optional[ContextIn] = None


class SummarizeRequest(BaseModel):
    """Summarize messages concisely"""
    messages: List[ChatMessage]
    context: Optional[ContextIn] = None
