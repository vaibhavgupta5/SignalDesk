import asyncio
from app.agents.classifier import classify_messages
from app.schemas.input import ChatMessage


def test_classify_basic():
    msg = ChatMessage(user="test", message="We decided to use React")
    res = asyncio.get_event_loop().run_until_complete(classify_messages([msg]))
    assert len(res.messages) > 0
    assert "DECISION" in [t.name for t in res.messages[0].type]
