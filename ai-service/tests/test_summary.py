import asyncio

from app.agents.summary import summarize_text


def test_summary_basic():
    res = asyncio.get_event_loop().run_until_complete(summarize_text("this is a test"))
    assert isinstance(res, dict)
