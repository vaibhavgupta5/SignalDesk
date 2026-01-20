from fastapi import APIRouter

from app.schemas.input import ExtractRequest
from app.schemas.output import ExtractOut
from app.agents.extractor import extract_structured

router = APIRouter()


@router.post("/extract", response_model=ExtractOut)
async def extract(req: ExtractRequest) -> ExtractOut:
    """
    Extract structured key-value pairs from chat messages.
    
    Each extracted field includes a confidence score.
    """
    return await extract_structured(req.messages, req.context)
