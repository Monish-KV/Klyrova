import random
from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.app.database.models import (
    User,
    Transaction,
    TransactionRiskSignal,
    Beneficiary,
    Alert,
)
from backend.app.risk.risk_engine import evaluate_transaction_risk
from backend.app.services.customer_service import get_user_by_id_or_customer_id

def map_transaction_to_dict(txn: Transaction, signals: List[TransactionRiskSignal] = None, user: User = None) -> Dict[str, Any]:
    sig_list = [
        {"reason": s.reason, "points": s.points}
        for s in (signals if signals is not None else txn.signals)
    ]
    user_name = user.name if user else (txn.user.name if txn.user else "Customer")
    customer_id = user.customer_id if user else (txn.user.customer_id if txn.user else txn.user_id)

    return {
        "id": txn.id,
        "userId": txn.user_id,
        "user_id": txn.user_id,
        "customerId": customer_id,
        "userName": user_name,
        "user_name": user_name,
        "recipient": txn.recipient,
        "recipientName": txn.recipient,
        "recipientUpi": txn.recipient_upi,
        "recipient_upi": txn.recipient_upi,
        "amount": txn.amount,
        "purpose": txn.purpose or "",
        "riskScore": txn.risk_score,
        "risk_score": txn.risk_score,
        "riskTier": txn.risk_level,
        "risk_level": txn.risk_level,
        "recommendedAction": txn.recommended_action,
        "recommended_action": txn.recommended_action,
        "actionTaken": txn.recommended_action,
        "status": txn.status,
        "device": txn.device,
        "location": txn.location,
        "created_at": txn.created_at,
        "timestamp": txn.created_at,
        "signals": sig_list,
    }

def analyze_and_record_payment(
    db: Session,
    telemetry: Dict[str, Any],
) -> Dict[str, Any]:
    user_ident = telemetry.get("customerId") or telemetry.get("userId")
    if user_ident:
        user = get_user_by_id_or_customer_id(db, user_ident)
        if not user:
            raise HTTPException(status_code=404, detail=f"User with ID '{user_ident}' not found.")
    else:
        user = db.query(User).first()
        if not user:
            raise HTTPException(status_code=404, detail="No active user accounts found in database.")

    recipient_name = (telemetry.get("recipientName") or telemetry.get("recipient") or "").strip()
    recipient_upi = (telemetry.get("recipientUpi") or telemetry.get("recipient_upi") or "").strip()

    if not recipient_upi and not recipient_name:
        raise HTTPException(status_code=400, detail="Recipient UPI ID is required.")

    if not recipient_name:
        recipient_name = recipient_upi

    try:
        amount = float(telemetry.get("amount", 0.0))
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Transaction amount must be a valid number.")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Transaction amount must be greater than zero.")

    purpose = telemetry.get("note") or telemetry.get("purpose") or ""
    device = telemetry.get("deviceFingerprint") or telemetry.get("device") or (user.registered_device if user else "Standard Browser")
    location = telemetry.get("location") or "Bengaluru, IN"
    is_known_device = telemetry.get("isKnownDevice", True)
    transaction_hour = telemetry.get("transactionHour")
    completion_time_seconds = telemetry.get("completionTimeSeconds")
    has_recent_scam_alert = bool(telemetry.get("hasRecentScamAlert") or telemetry.get("has_recent_scam_link"))

    # Check if recipient is a trusted contact
    trusted_beneficiary = (
        db.query(Beneficiary)
        .filter(
            Beneficiary.user_id == user.id,
            (Beneficiary.upi_id.ilike(recipient_upi) | Beneficiary.name.ilike(recipient_name)),
            Beneficiary.is_trusted == 1,
        )
        .first()
    )
    is_known_recipient = bool(trusted_beneficiary)

    customer_dict = {
        "user_type": user.user_type,
        "digital_experience": user.digital_experience,
        "protection_level": user.protection_level,
        "habitual_max_amount": user.habitual_max_amount,
        "registered_device": user.registered_device,
        "has_recent_scam_link": has_recent_scam_alert,
    }

    # Run deterministic risk engine
    eval_result = evaluate_transaction_risk(
        amount=amount,
        recipient=recipient_name,
        recipient_upi=recipient_upi,
        purpose=purpose,
        device=device,
        location=location,
        is_known_recipient=is_known_recipient,
        is_known_device=is_known_device,
        transaction_hour=transaction_hour,
        completion_time_seconds=completion_time_seconds,
        customer=customer_dict,
        has_recent_scam_alert=has_recent_scam_alert,
    )

    # Persist pending/held transaction in SQLite
    txn_id = f"TXN-{int(datetime.now().timestamp() * 1000)}"
    now_iso = datetime.now().isoformat()

    db_txn = Transaction(
        id=txn_id,
        user_id=user.id,
        recipient=recipient_name,
        recipient_upi=recipient_upi,
        amount=amount,
        purpose=purpose,
        risk_score=eval_result.risk_score,
        risk_level=eval_result.risk_level,
        recommended_action=eval_result.recommended_action,
        status=eval_result.status,
        device=device,
        location=location,
        created_at=now_iso,
    )
    db.add(db_txn)

    # Add risk signals
    for sig in eval_result.signals:
        db.add(
            TransactionRiskSignal(
                id=f"sig_{txn_id}_{random.randint(1000, 9999)}",
                transaction_id=txn_id,
                reason=sig.reason,
                points=sig.points,
            )
        )

    # Create safety alert if critical hold or high verification
    if eval_result.recommended_action == "HOLD" or eval_result.risk_level == "CRITICAL":
        db.add(
            Alert(
                id=f"ALT-TXN-{int(datetime.now().timestamp() * 1000)}",
                user_id=user.id,
                type="PAYMENT_HOLD",
                title=f"Protective Hold Instituted on ₹{amount:,.0f} Transfer",
                message=f"GuardianPay AI detected critical risk score of {eval_result.risk_score}% ({eval_result.risk_level}). Funds remain securely held in your account.",
                severity="CRITICAL",
                related_transaction_id=txn_id,
                read=0,
                created_at=now_iso,
            )
        )
    elif eval_result.risk_level == "HIGH":
        db.add(
            Alert(
                id=f"ALT-TXN-{int(datetime.now().timestamp() * 1000)}",
                user_id=user.id,
                type="SECURITY_WARNING",
                title=f"Security Verification Required for ₹{amount:,.0f} Transfer",
                message=f"Elevated risk signals detected ({eval_result.risk_score}% score). Verification requested before completing payment to {recipient_name}.",
                severity="HIGH",
                related_transaction_id=txn_id,
                read=0,
                created_at=now_iso,
            )
        )

    db.commit()
    db.refresh(db_txn)

    # Generate factors for the modal
    habitual_ratio = amount / max(1.0, user.habitual_max_amount)
    factors = [
        {
            "id": "habitual",
            "name": "Habitual Amount Deviation",
            "score": 25 if (habitual_ratio > 2.0) else (15 if habitual_ratio > 1.0 else 0),
            "maxScore": 25,
            "triggered": bool(amount > user.habitual_max_amount),
            "description": (
                f"You normally send around ₹{user.habitual_max_amount:,.0f}, but this payment is ₹{amount:,.0f}."
                if amount > user.habitual_max_amount
                else f"Transfer amount ₹{amount:,.0f} aligns with typical spending (up to ₹{user.habitual_max_amount:,.0f})"
            ),
            "severity": "CRITICAL" if habitual_ratio > 4.0 else ("WARN" if habitual_ratio > 1.0 else "LOW"),
        },
        {
            "id": "recipient",
            "name": "Beneficiary Trust Standing",
            "score": 0 if is_known_recipient else 20,
            "maxScore": 20,
            "triggered": not is_known_recipient,
            "description": "Recipient is in your verified contact list" if is_known_recipient else f"New / unverified recipient ({recipient_upi})",
            "severity": "LOW" if is_known_recipient else "HIGH",
        },
        {
            "id": "device",
            "name": "Hardware Fingerprint Verification",
            "score": 0 if is_known_device else 15,
            "maxScore": 15,
            "triggered": not is_known_device,
            "description": f"Authorized device: {user.registered_device}" if is_known_device else "Unrecognized hardware or remote desktop session",
            "severity": "LOW" if is_known_device else "HIGH",
        },
        {
            "id": "haste",
            "name": "Behavioral Urgency & Coercion",
            "score": 15 if (completion_time_seconds and completion_time_seconds < 20) else 0,
            "maxScore": 15,
            "triggered": bool(completion_time_seconds and completion_time_seconds < 20),
            "description": f"Execution velocity ({completion_time_seconds or 35}s) reflects accelerated panic checkout" if (completion_time_seconds and completion_time_seconds < 20) else "Natural typing and checkout pacing observed",
            "severity": "HIGH" if (completion_time_seconds and completion_time_seconds < 20) else "LOW",
        },
    ]

    if eval_result.recommended_action == "HOLD":
        explanation = f"Critical risk signals detected ({eval_result.risk_score}/100). Protective hold instituted to prevent unauthorized drain. Funds remain safely in your account."
    elif eval_result.recommended_action == "VERIFY":
        explanation = f"Elevated risk score of {eval_result.risk_score}/100 detected. Multiple factors require conscious verification before proceeding."
    elif eval_result.recommended_action == "WARN":
        explanation = f"This payment is higher than your usual amount. You normally send around ₹{user.habitual_max_amount:,.0f}, but this payment is ₹{amount:,.0f}. Do you want to continue?"
    else:
        explanation = f"Transaction meets baseline safety requirements with low risk score of {eval_result.risk_score}/100."

    return {
        "totalScore": eval_result.risk_score,
        "tier": eval_result.risk_level,
        "action": eval_result.recommended_action,
        "status": eval_result.status,
        "transactionId": txn_id,
        "factors": factors,
        "explanation": explanation,
        "requiresIntervention": eval_result.recommended_action in ("HOLD", "VERIFY"),
        "reasons": eval_result.reasons,
        "signals": [s.to_dict() for s in eval_result.signals],
        "protectionLevel": eval_result.protection_level,
    }

def confirm_transaction(db: Session, transaction_id: str, confirmation_data: Dict[str, Any]) -> Dict[str, Any]:
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found.")

    # A HOLD decision must actually prevent the transaction from being marked completed directly
    if txn.status == "HELD" or txn.recommended_action == "HOLD" or txn.risk_level == "CRITICAL":
        is_override = bool(confirmation_data.get("bankOverride"))
        if not is_override:
            txn.status = "HELD"
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Transaction is protected under GuardianPay AI Protective Hold and cannot be marked completed directly. Senior safety intervention or bank verification is required."
            )

    txn.status = "COMPLETED"
    
    # Deduct balance from user
    if txn.user and txn.user.balance >= txn.amount:
        txn.user.balance -= txn.amount

    db.commit()
    db.refresh(txn)
    return map_transaction_to_dict(txn)

def cancel_transaction(db: Session, transaction_id: str) -> Dict[str, Any]:
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found.")

    txn.status = "CANCELLED"
    db.commit()
    db.refresh(txn)
    return map_transaction_to_dict(txn)

def get_all_transactions(db: Session, user_identifier: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    query = db.query(Transaction)
    if user_identifier:
        user = get_user_by_id_or_customer_id(db, user_identifier)
        if user:
            query = query.filter(Transaction.user_id == user.id)
        else:
            query = query.filter(Transaction.user_id == user_identifier)

    txns = query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()
    return [map_transaction_to_dict(t) for t in txns]

def get_transaction_by_id(db: Session, txn_id: str) -> Optional[Dict[str, Any]]:
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        return None
    return map_transaction_to_dict(txn)

def resolve_transaction(db: Session, txn_id: str, decision: str) -> Dict[str, Any]:
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction {txn_id} not found.")

    if decision.upper() == "APPROVE":
        txn.status = "COMPLETED"
        if txn.user and txn.user.balance >= txn.amount:
            txn.user.balance -= txn.amount
    elif decision.upper() == "BLOCK":
        txn.status = "BLOCKED"
    else:
        txn.status = "HELD"

    db.commit()
    db.refresh(txn)
    return map_transaction_to_dict(txn)

def submit_intervention(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
    customer_id = data.get("customerId")
    answer = data.get("manipulationAnswer", "YES")
    txn_data = data.get("transactionData", {})
    amount = float(txn_data.get("amount", 0.0))
    user = get_user_by_id_or_customer_id(db, customer_id)

    if answer in ("YES", "NOT_SURE"):
        # Protective Hold Instituted
        now_iso = datetime.now().isoformat()
        txn_id = f"TXN-HELD-{int(datetime.now().timestamp() * 1000)}"
        if user:
            db_txn = Transaction(
                id=txn_id,
                user_id=user.id,
                recipient=txn_data.get("recipientName") or txn_data.get("recipient") or "Unverified Coercive Contact",
                recipient_upi=txn_data.get("recipientUpi") or "unknown@upi",
                amount=amount,
                purpose="Coercive phone call manipulation reported during payment confirmation",
                risk_score=95,
                risk_level="CRITICAL",
                recommended_action="HOLD",
                status="HELD",
                device=txn_data.get("deviceFingerprint") or "Protected Device",
                location="Bengaluru, IN",
                created_at=now_iso,
            )
            db.add(db_txn)
            db.add(
                TransactionRiskSignal(
                    id=f"sig_{txn_id}_manip",
                    transaction_id=txn_id,
                    reason="Customer confirmed external coaching / urgent phone instructions during transfer",
                    points=35,
                )
            )
            db.add(
                Alert(
                    id=f"ALT-MANIP-{int(datetime.now().timestamp() * 1000)}",
                    user_id=user.id,
                    type="COERCION_INTERVENTION",
                    title=f"Protective Hold: ₹{amount:,.0f} Transfer Prevented",
                    message="Customer indicated potential caller manipulation. Funds were safely retained in the account.",
                    severity="CRITICAL",
                    related_transaction_id=txn_id,
                    read=0,
                    created_at=now_iso,
                )
            )
            db.commit()

        return {
            "outcome": "HELD",
            "headline": "Protective Hold Instituted",
            "message": f"Your payment of ₹{amount:,.0f} has been paused safely. Your money has NOT left your bank account.",
            "guidance": [
                "Disconnect any active phone calls claiming to be from your bank, electricity board, or police.",
                "Do NOT share your UPI PIN or one-time passwords (OTP).",
                "Contact the 1930 National Cybercrime Helpline or consult a trusted family member.",
            ],
            "transactionId": txn_id,
        }
    else:
        # User confirmed legitimate voluntary payment
        return {
            "outcome": "VERIFIED",
            "headline": "Transfer Verified",
            "message": "You verified this payment as voluntary. Proceed with standard security verification.",
        }
