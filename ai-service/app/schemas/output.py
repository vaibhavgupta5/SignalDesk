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
    metadata: Optional[dict] = None


class ClassifyOut(BaseModel):
    """Classification result for multiple messages"""
    messages: List[ClassifiedMessage]
    explanation: Optional[str] = None


class ActionItem(BaseModel):
    """Detailed action item with assignment and priority"""
    task: str
    assignee: Optional[str] = "unassigned"
    deadline: Optional[str] = None
    priority: str = Field(description="'critical', 'high', 'medium', 'low'")
    reasoning: Optional[str] = None


class ActionOut(BaseModel):
    """Result of action extraction"""
    actions: List[ActionItem]
    summary: str


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


class TimelineItem(BaseModel):
    """Event in the conversation timeline"""
    event: str
    type: str  # decision, action, suggestion, change
    timestamp: Optional[str] = None
    user: Optional[str] = None


class SummarizeOut(BaseModel):
    """Summary output with detailed content and timeline"""
    summary: str
    key_points: List[str] = []
    timeline: List[TimelineItem] = []
    confidence: ConfidenceScore


class AskItem(BaseModel):
    text: str
    user: str
    confidence: ConfidenceScore


class AskOut(BaseModel):
    """Result of Ask query"""
    items: List[AskItem]
    query_type: str
    ai_insight: Optional[str] = Field(None, description="AI's own analysis or additional suggestions based on the query type")
