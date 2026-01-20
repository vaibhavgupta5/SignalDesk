from pydantic import BaseModel, Field
from typing import Any, List, Optional
from enum import Enum


class MessageType(str, Enum):
    """Classification types for messages"""
    DECISION = "decision"
    ACTION = "action"
    ASSUMPTION = "assumption"
    SUGGESTION = "suggestion"
    QUESTION = "question"
    CONSTRAINT = "constraint"
    OTHER = "other"


class ConfidenceScore(BaseModel):
    """Attached to each output for traceability"""
    score: float = Field(ge=0.0, le=1.0, description="Confidence 0.0-1.0")
    reason: Optional[str] = None


class ClassifiedMessage(BaseModel):
    """Single classified chat message"""
    user: str
    message: str
    timestamp: Optional[str] = None
    type: List[MessageType] = Field(description="One or more classification types")
    confidence: ConfidenceScore


class ClassifyOut(BaseModel):
    """Classification result for multiple messages"""
    messages: List[ClassifiedMessage]
    explanation: Optional[str] = None


class ExtractedField(BaseModel):
    """Extracted key-value pair with confidence"""
    key: str
    value: Any
    confidence: ConfidenceScore


class ExtractOut(BaseModel):
    """Structured extraction result"""
    items: List[ExtractedField]
    raw_text: Optional[str] = None


class Contradiction(BaseModel):
    """Detected contradiction"""
    claim_a: str
    claim_b: str
    severity: str = Field(description="'critical', 'high', 'medium', 'low'")
    confidence: ConfidenceScore
    explanation: Optional[str] = None


class ContradictOut(BaseModel):
    """Contradiction detection result"""
    contradictions: List[Contradiction]
    is_consistent: bool


class SummarizeOut(BaseModel):
    """Summary output"""
    summary: str
    key_points: List[str] = []
    confidence: ConfidenceScore
