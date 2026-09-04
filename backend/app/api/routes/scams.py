from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.database.schemas import ScamAnalyzeRequest
from backend.app.services.scam_service import analyze_and_record_scam, get_scam_history

router = APIRouter()

@router.post("/analyze-message")
async def analyze_message_endpoint(
    payload: ScamAnalyzeRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Direct endpoint called by the React ScamAnalyzer component.
    """
    text = payload.messageText or payload.message
    user_id = payload.customerId or payload.userId

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="messageText or message is required.")

    try:
        return await analyze_and_record_scam(db, text.strip(), user_identifier=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scams/analyze")
async def analyze_scam_endpoint(
    payload: ScamAnalyzeRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Scam analysis endpoint.
    """
    text = payload.message or payload.messageText
    user_id = payload.userId or payload.customerId

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="message or messageText is required.")

    try:
        return await analyze_and_record_scam(db, text.strip(), user_identifier=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scams", response_model=List[Any])
def list_scams(
    userId: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Retrieves historic scam analyses.
    """
    return get_scam_history(db, user_identifier=userId, limit=limit, offset=offset)
