from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.services.alert_service import (
    get_alerts,
    mark_alert_read,
    get_unread_alerts_count,
)

router = APIRouter()

@router.get("/alerts", response_model=List[Any])
def list_alerts(
    userId: Optional[str] = Query(None),
    unreadOnly: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Returns security alerts for bank operators and customers.
    """
    return get_alerts(db, user_identifier=userId, unread_only=unreadOnly, limit=limit)

@router.get("/alerts/count")
def count_unread_alerts(
    userId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns the count of unread high/critical priority alerts.
    """
    count = get_unread_alerts_count(db, user_identifier=userId)
    return {"unreadCount": count}

@router.patch("/alerts/{alert_id}/read")
def mark_read(
    alert_id: str,
    db: Session = Depends(get_db),
):
    """
    Acknowledges an alert and marks read flag.
    """
    try:
        updated = mark_alert_read(db, alert_id)
        return {"success": True, "alert": updated}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
