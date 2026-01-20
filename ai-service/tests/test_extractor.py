import asyncio
from app.agents.extractor import extract_structured
from app.schemas.input import ChatMessage


def test_extract_basic():
    msg = ChatMessage(user="test", message="Deadline is tomorrow for Bob")
    res = asyncio.get_event_loop().run_until_complete(extract_structured([msg]))
    assert len(res.items) > 0
