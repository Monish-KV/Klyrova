from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.database.schemas import UpdateSafetySettingsRequest
from backend.app.services.safety_service import (
    get_safety_settings,
    update_safety_settings,
    pause_safety,
    resume_safety,
)

router = APIRouter()

@router.get("/safety/{user_id}")
def read_safety_settings(user_id: str, db: Session = Depends(get_db)):
    """
    Returns safety controls for a specific user.
    """
    try:
        return get_safety_settings(db, user_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.patch("/safety/{user_id}")
@router.put("/safety/{user_id}")
def update_safety(
    user_id: str,
    payload: UpdateSafetySettingsRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Toggles safety safeguards (transaction monitoring, scam analysis, verification).
    """
    data = payload.model_dump(exclude_unset=True)
    try:
        return update_safety_settings(db, user_id, data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/safety/{user_id}/pause")
def trigger_emergency_pause(user_id: str, db: Session = Depends(get_db)):
    """
    1-Click Emergency Outbound Payment Freeze.
    """
    try:
        return pause_safety(db, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/safety/{user_id}/resume")
def trigger_resume_safety(user_id: str, db: Session = Depends(get_db)):
    """
    Resumes regular banking safeguards.
    """
    try:
        return resume_safety(db, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
