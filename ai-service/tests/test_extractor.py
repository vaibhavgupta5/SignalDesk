import asyncio

from app.agents.extractor import extract_structured


def test_extract_basic():
    res = asyncio.get_event_loop().run_until_complete(extract_structured("a b c"))
    assert isinstance(res, dict)
