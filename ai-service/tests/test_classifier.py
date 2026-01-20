import asyncio

from app.agents.classifier import classify_text


def test_classify_basic():
    res = asyncio.get_event_loop().run_until_complete(classify_text("hello"))
    assert isinstance(res, dict)
