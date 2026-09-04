from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.database.schemas import (
    TelemetryPayloadRequest,
    AnalyzeTransactionRequest,
    ConfirmTransactionRequest,
    ResolveTransactionRequest,
    InterventionRequest,
)
from backend.app.services.transaction_service import (
    analyze_and_record_payment,
    confirm_transaction,
    get_all_transactions,
    get_transaction_by_id,
    resolve_transaction,
    submit_intervention,
)

router = APIRouter()

@router.post("/analyze-payment")
def analyze_payment_endpoint(
    payload: TelemetryPayloadRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Authoritative behavioral telemetry analysis invoked before transaction execution.
    """
    data = payload.model_dump(exclude_unset=True)
    try:
        return analyze_and_record_payment(db, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transactions/analyze")
def analyze_transaction_endpoint(
    payload: AnalyzeTransactionRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Legacy and direct transaction analysis endpoint.
    """
    data = payload.model_dump(exclude_unset=True)
    try:
        res = analyze_and_record_payment(db, data)
        return {
            "transactionId": res["transactionId"],
            "riskScore": res["totalScore"],
            "riskLevel": res["tier"],
            "recommendedAction": res["action"],
            "status": res["status"],
            "reasons": res["reasons"],
            "signals": res["signals"],
            "protectionLevel": res["protectionLevel"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transactions")
def create_transaction_endpoint(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
):
    """
    Direct payment submission fallback.
    """
    try:
        res = analyze_and_record_payment(db, payload)
        force_status = payload.get("forceStatus")
        if force_status:
            return resolve_transaction(db, res["transactionId"], "APPROVE" if force_status == "COMPLETED" else "HOLD")
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transactions/{transaction_id}/confirm")
def confirm_transaction_endpoint(
    transaction_id: str,
    payload: ConfirmTransactionRequest = Body(default_factory=ConfirmTransactionRequest),
    db: Session = Depends(get_db),
):
    """
    Finalizes a payment after user OTP/PIN verification or manual clearance.
    """
    data = payload.model_dump(exclude_unset=True)
    try:
        return confirm_transaction(db, transaction_id, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions", response_model=List[Any])
def list_transactions(
    userId: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Retrieves transactions with attached behavioral risk signals.
    """
    return get_all_transactions(db, user_identifier=userId, limit=limit, offset=offset)

@router.get("/transactions/{transaction_id}")
def read_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
):
    """
    Fetches full forensic record of a single transaction.
    """
    txn = get_transaction_by_id(db, transaction_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    return txn

@router.post("/transactions/{transaction_id}/resolve")
def resolve_transaction_endpoint(
    transaction_id: str,
    payload: ResolveTransactionRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Bank operator override or user resolution (APPROVE | BLOCK | HOLD).
    """
    try:
        return resolve_transaction(db, transaction_id, payload.decision)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/intervention")
def submit_intervention_endpoint(
    payload: InterventionRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Handles interactive coercion intervention questions (e.g. 'Are you on an active phone call?').
    """
    data = payload.model_dump(exclude_unset=True)
    try:
        return submit_intervention(db, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
