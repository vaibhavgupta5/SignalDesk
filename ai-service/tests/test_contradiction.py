import asyncio
from app.agents.contradiction import find_contradictions
from app.schemas.input import ChatMessage, ContextIn


def test_contradict_basic():
    msg = ChatMessage(user="test", message="Actually, let's use MongoDB instead")
    context = ContextIn(prior_decisions=["We decided to use PostgreSQL"])
    res = asyncio.get_event_loop().run_until_complete(find_contradictions([msg], context))
    assert res.is_consistent is False
    assert len(res.contradictions) > 0
