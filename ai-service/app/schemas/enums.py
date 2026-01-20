from enum import Enum


class ClassificationEnum(str, Enum):
    """Well-defined signal classification categories"""
    DECISION = "decision"
    ACTION = "action"
    ASSUMPTION = "assumption"
    SUGGESTION = "suggestion"
    QUESTION = "question"
    CONSTRAINT = "constraint"
    OTHER = "other"


class ConfidenceLevel(str, Enum):
    """Confidence rating"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
