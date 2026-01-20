import asyncio
from app.agents.summary import summarize_text
from app.schemas.input import ChatMessage


def test_summary_basic():
    messages = [
        ChatMessage(user="alice", message="Should we use React?"),
        ChatMessage(user="bob", message="Yes, let's use React for the frontend.")
    ]
    res = asyncio.get_event_loop().run_until_complete(summarize_text(messages))
    assert res.summary != ""
    assert res.confidence.score > 0
