from fastapi import APIRouter, HTTPException
from app.schemas.input import AskRequest
from app.schemas.output import AskOut
from app.services.ask_service import ask_service

router = APIRouter()

@router.post("/ask", response_model=AskOut)
async def ask_query(request: AskRequest):
    """
    Query specific message types (DECISION, ACTION, etc.) from a conversation.
    Supports query_type like 'DECISION', '/decision', 'suggestion', etc.
    """
    try:
        result = await ask_service.ask(
            category=request.query_type,
            messages=request.messages,
            context=request.context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
