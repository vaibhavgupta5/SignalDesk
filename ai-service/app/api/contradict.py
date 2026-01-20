from fastapi import APIRouter

from app.schemas.input import ContradictRequest
from app.schemas.output import ContradictOut
from app.agents.contradiction import find_contradictions

router = APIRouter()


@router.post("/contradict", response_model=ContradictOut)
async def contradict(req: ContradictRequest) -> ContradictOut:
    """
    Detect contradictions in chat messages given prior context.
    
    Flags conflicts with prior decisions, assumptions, or actions.
    """
    return await find_contradictions(req.messages, req.context)
