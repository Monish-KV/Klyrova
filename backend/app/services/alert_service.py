from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.database.models import Alert
from backend.app.services.customer_service import get_user_by_id_or_customer_id

def get_alerts(
    db: Session,
    user_identifier: Optional[str] = None,
    unread_only: bool = False,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    query = db.query(Alert)
    if user_identifier:
        user = get_user_by_id_or_customer_id(db, user_identifier)
        user_id = user.id if user else user_identifier
        query = query.filter((Alert.user_id == user_id) | (Alert.user_id.is_(None)))

    if unread_only:
        query = query.filter(Alert.read == 0)

    records = query.order_by(Alert.created_at.desc()).limit(limit).all()

    return [
        {
            "id": a.id,
            "user_id": a.user_id,
            "userId": a.user_id,
            "type": a.type,
            "title": a.title,
            "message": a.message,
            "severity": a.severity,
            "related_transaction_id": a.related_transaction_id,
            "relatedTransactionId": a.related_transaction_id,
            "related_scam_id": a.related_scam_id,
            "relatedScamId": a.related_scam_id,
            "read": a.read,
            "isRead": bool(a.read),
            "created_at": a.created_at,
            "timestamp": a.created_at,
        }
        for a in records
    ]

def mark_alert_read(db: Session, alert_id: str) -> Dict[str, Any]:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise ValueError(f"Alert {alert_id} not found.")

    alert.read = 1
    db.commit()
    db.refresh(alert)

    return {
        "id": alert.id,
        "user_id": alert.user_id,
        "userId": alert.user_id,
        "type": alert.type,
        "title": alert.title,
        "message": alert.message,
        "severity": alert.severity,
        "related_transaction_id": alert.related_transaction_id,
        "related_scam_id": alert.related_scam_id,
        "read": alert.read,
        "created_at": alert.created_at,
    }

def get_unread_alerts_count(db: Session, user_identifier: Optional[str] = None) -> int:
    query = db.query(Alert).filter(Alert.read == 0)
    if user_identifier:
        user = get_user_by_id_or_customer_id(db, user_identifier)
        user_id = user.id if user else user_identifier
        query = query.filter((Alert.user_id == user_id) | (Alert.user_id.is_(None)))

    return query.count()
