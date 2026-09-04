from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.services.customer_service import get_all_customers

router = APIRouter()

@router.get("/customers", response_model=List[Any])
def get_customers(db: Session = Depends(get_db)):
    """
    Returns the list of monitored customers for GuardianPay AI demo & operations.
    """
    return get_all_customers(db)
