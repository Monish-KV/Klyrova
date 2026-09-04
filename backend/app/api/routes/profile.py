from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.database.schemas import UpdateProfileRequest
from backend.app.services.customer_service import (
    get_all_customers,
    get_user_profile,
    update_user_profile,
)

router = APIRouter()

@router.get("/users", response_model=List[Any])
def list_users(db: Session = Depends(get_db)):
    """
    Returns users for profile switcher demo.
    """
    return get_all_customers(db)

@router.get("/profile/{user_id}")
def read_user_profile(user_id: str, db: Session = Depends(get_db)):
    """
    Returns user profile with safety settings and beneficiaries.
    """
    profile = get_user_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found.")
    return profile

@router.patch("/profile/{user_id}")
def update_profile(
    user_id: str,
    payload: UpdateProfileRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Updates customer profile parameters (e.g. protection level, balance, habitual max amount).
    """
    updates = payload.model_dump(exclude_unset=True)
    profile = update_user_profile(db, user_id, updates)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found.")
    return profile
