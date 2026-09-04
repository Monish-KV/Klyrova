from typing import Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.database.models import SafetySetting, Alert, User
from backend.app.services.customer_service import get_user_by_id_or_customer_id

def get_safety_settings(db: Session, user_identifier: str) -> Dict[str, Any]:
    user = get_user_by_id_or_customer_id(db, user_identifier)
    if not user:
        raise ValueError(f"User {user_identifier} not found.")

    setting = db.query(SafetySetting).filter(SafetySetting.user_id == user.id).first()
    if not setting:
        now_iso = datetime.now().isoformat()
        setting = SafetySetting(
            id=f"set_{user.id}",
            user_id=user.id,
            transaction_monitoring=1,
            scam_analysis=1,
            high_risk_verification=1,
            updated_at=now_iso,
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

    return {
        "transactionMonitoring": bool(setting.transaction_monitoring),
        "scamAnalysis": bool(setting.scam_analysis),
        "highRiskVerification": bool(setting.high_risk_verification),
        "updatedAt": setting.updated_at,
    }

def update_safety_settings(db: Session, user_identifier: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    user = get_user_by_id_or_customer_id(db, user_identifier)
    if not user:
        raise ValueError(f"User {user_identifier} not found.")

    setting = db.query(SafetySetting).filter(SafetySetting.user_id == user.id).first()
    if not setting:
        setting = SafetySetting(
            id=f"set_{user.id}",
            user_id=user.id,
            transaction_monitoring=1,
            scam_analysis=1,
            high_risk_verification=1,
            updated_at=datetime.now().isoformat(),
        )
        db.add(setting)

    if "transactionMonitoring" in updates and updates["transactionMonitoring"] is not None:
        setting.transaction_monitoring = 1 if updates["transactionMonitoring"] else 0
    if "scamAnalysis" in updates and updates["scamAnalysis"] is not None:
        setting.scam_analysis = 1 if updates["scamAnalysis"] else 0
    if "highRiskVerification" in updates and updates["highRiskVerification"] is not None:
        setting.high_risk_verification = 1 if updates["highRiskVerification"] else 0

    setting.updated_at = datetime.now().isoformat()
    db.commit()
    db.refresh(setting)

    return {
        "transactionMonitoring": bool(setting.transaction_monitoring),
        "scamAnalysis": bool(setting.scam_analysis),
        "highRiskVerification": bool(setting.high_risk_verification),
        "updatedAt": setting.updated_at,
    }

def pause_safety(db: Session, user_identifier: str) -> Dict[str, Any]:
    user = get_user_by_id_or_customer_id(db, user_identifier)
    if not user:
        raise ValueError(f"User {user_identifier} not found.")

    now_iso = datetime.now().isoformat()
    alert_id = f"ALT-FREEZE-{int(datetime.now().timestamp() * 1000)}"
    db.add(
        Alert(
            id=alert_id,
            user_id=user.id,
            type="SAFETY_REMINDER",
            title="Emergency Outbound Payment Freeze Active",
            message="Customer initiated 1-click emergency safeguard. All outbound digital transfers are paused.",
            severity="HIGH",
            related_transaction_id=None,
            related_scam_id=None,
            read=0,
            created_at=now_iso,
        )
    )
    db.commit()

    return {
        "success": True,
        "status": "HOLD_ACTIVE",
        "message": "Emergency Outbound Payment Freeze active.",
    }

def resume_safety(db: Session, user_identifier: str) -> Dict[str, Any]:
    user = get_user_by_id_or_customer_id(db, user_identifier)
    if not user:
        raise ValueError(f"User {user_identifier} not found.")

    return {
        "success": True,
        "status": "PROTECTED",
        "message": "Regular banking safeguards resumed.",
    }
