"""
SignalDesk AI Services Layer

Provides structured service classes for each AI capability:
- classifier_service: Classify messages into signal categories
- action_service: Extract high-fidelity actions and task metadata
- contradiction_service: Detect conflicts and inconsistencies
- summary_service: Generate concise summaries
- filter_service: Filter useful signals from noise
- ask_service: Query specific signal categories with AI insights
"""

from app.services.classifier_service import classifier_service
from app.services.action_service import action_service
from app.services.contradiction_service import contradiction_service
from app.services.summary_service import summary_service
from app.services.filter_service import filter_service
from app.services.ask_service import ask_service

__all__ = [
    "classifier_service",
    "action_service",
    "contradiction_service",
    "summary_service",
    "filter_service",
    "ask_service",
]
