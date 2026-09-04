from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.services.dashboard_service import get_admin_dashboard_stats

router = APIRouter()

@router.get("/dashboard")
def admin_dashboard(db: Session = Depends(get_db)):
    """
    Direct route under /api/admin/dashboard.
    """
    return get_admin_dashboard_stats(db)
