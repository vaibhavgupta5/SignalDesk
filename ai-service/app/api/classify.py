from fastapi import APIRouter

from app.schemas.input import ClassifyRequest
from app.schemas.output import ClassifyOut
from app.agents.classifier import classify_messages

router = APIRouter()


@router.post("/classify", response_model=ClassifyOut)
async def classify(req: ClassifyRequest) -> ClassifyOut:
    """
    Classify multiple chat messages into signal categories.
    
    Returns: DECISION, ACTION, ASSUMPTION, SUGGESTION, CONSTRAINT, QUESTION (can be multiple per message)
    """
    return await classify_messages(req.messages, req.context)
