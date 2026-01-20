"""
SignalDesk AI Services Layer

Provides structured service classes for each AI capability:
- classifier_service: Classify messages into signal categories
- extractor_service: Extract structured key-value data
- contradiction_service: Detect conflicts and inconsistencies
- summary_service: Generate concise summaries
- filter_service: Filter useful signals from noise
"""

from app.services.classifier_service import classifier_service
from app.services.extractor_service import extractor_service
from app.services.contradiction_service import contradiction_service
from app.services.summary_service import summary_service
from app.services.filter_service import filter_service

__all__ = [
    "classifier_service",
    "extractor_service", 
    "contradiction_service",
    "summary_service",
    "filter_service",
]
