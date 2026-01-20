from fastapi import APIRouter, HTTPException
from app.schemas.input import ActionRequest
from app.schemas.output import ActionOut
from app.services.action_service import action_service

router = APIRouter()

@router.post("/action", response_model=ActionOut)
async def extract_actions(request: ActionRequest):
    """
    Extract all ACTION items from messages.
    Includes assignee, deadline, and priority (critical/high/medium/low).
    Sorted by priority.
    """
    try:
        result = await action_service.extract_actions(
            messages=request.messages,
            context=request.context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
