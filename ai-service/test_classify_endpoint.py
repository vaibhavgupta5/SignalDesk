#!/usr/bin/env python
"""Test the classify endpoint with multi-user chat input"""

import asyncio
import json
from app.schemas.input import ClassifyRequest, ChatMessage
from app.services.classifier_service import classifier_service


async def test_classify():
    """Test multi-user chat classification via service"""
    
    messages = [
        ChatMessage(
            user="Alice",
            message="We decided to use Python for this project",
            timestamp="2024-01-19T10:00:00Z"
        ),
        ChatMessage(
            user="Bob",
            message="Complete this by tomorrow",
            timestamp="2024-01-19T10:05:00Z"
        ),
        ChatMessage(
            user="Alice",
            message="I think we should consider using FastAPI",
            timestamp="2024-01-19T10:10:00Z"
        ),
        ChatMessage(
            user="Charlie",
            message="We must have tests before deployment",
            timestamp="2024-01-19T10:15:00Z"
        ),
    ]
    
    # Classify via service
    result = await classifier_service.classify(messages)
    
    # Pretty print result
    print("=" * 60)
    print("CLASSIFICATION RESULTS")
    print("=" * 60)
    print(json.dumps(result.model_dump(), indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(test_classify())
