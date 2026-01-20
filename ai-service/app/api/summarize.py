from fastapi import APIRouter

from app.schemas.input import SummarizeRequest
from app.schemas.output import SummarizeOut
from app.agents.summary import summarize_text

router = APIRouter()


@router.post("/summarize", response_model=SummarizeOut)
async def summarize(req: SummarizeRequest) -> SummarizeOut:
    """
    Generate a concise summary of chat messages.
    """
    return await summarize_text(req.messages, req.context)
