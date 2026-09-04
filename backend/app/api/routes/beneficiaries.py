from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.database.schemas import AddBeneficiaryRequest
from backend.app.services.customer_service import get_beneficiaries, add_beneficiary

router = APIRouter()

@router.get("/users/{user_id}/beneficiaries", response_model=List[Any])
def list_beneficiaries(user_id: str, db: Session = Depends(get_db)):
    """
    Returns trusted beneficiaries for a given customer.
    """
    return get_beneficiaries(db, user_id)

@router.post("/users/{user_id}/beneficiaries")
def create_beneficiary(
    user_id: str,
    payload: AddBeneficiaryRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Registers a new trusted beneficiary for the customer.
    """
    if not payload.name or not (payload.upiId or payload.upi_id):
        raise HTTPException(status_code=400, detail="name and upiId are required.")

    data = payload.model_dump(exclude_unset=True)
    try:
        return add_beneficiary(db, user_id, data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
