import asyncio

from app.agents.contradiction import find_contradictions


def test_contradict_basic():
    res = asyncio.get_event_loop().run_until_complete(find_contradictions("none"))
    assert isinstance(res, dict)
