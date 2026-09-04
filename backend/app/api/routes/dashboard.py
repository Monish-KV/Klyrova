from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.services.dashboard_service import (
    get_customer_dashboard_stats,
    get_admin_dashboard_stats,
)

router = APIRouter()

@router.get("/dashboard")
def read_customer_dashboard(
    userId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns metrics and recent safety events for customer dashboard view.
    """
    return get_customer_dashboard_stats(db, user_identifier=userId)

@router.get("/admin/dashboard")
def read_admin_dashboard(db: Session = Depends(get_db)):
    """
    Returns enterprise-wide risk metrics, protection rates, and high-risk events for bank console.
    """
    return get_admin_dashboard_stats(db)
