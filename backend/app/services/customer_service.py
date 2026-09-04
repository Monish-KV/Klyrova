from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.database.models import User, Beneficiary, SafetySetting

def map_user_to_customer_dict(user: User) -> Dict[str, Any]:
    # Custom attributes for rich customer view
    age = 68 if "ravi" in user.id else (52 if "sunita" in user.id else 27)
    persona = (
        "Retired Government Servant"
        if "ravi" in user.id
        else ("Homemaker & First-Time UPI User" if "sunita" in user.id else "Software Engineer")
    )
    avatar = (
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
        if "ravi" in user.id
        else (
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
            if "sunita" in user.id
            else "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
        )
    )

    return {
        "id": user.id,
        "customerId": user.customer_id,
        "customer_id": user.customer_id,
        "name": user.name,
        "email": user.email,
        "age": age,
        "persona": persona,
        "avatar": avatar,
        "phone": user.phone,
        "accountNumber": user.account_number,
        "account_number": user.account_number,
        "upiId": user.upi_id,
        "upi_id": user.upi_id,
        "balance": user.balance,
        "habitualMaxAmount": user.habitual_max_amount,
        "habitual_max_amount": user.habitual_max_amount,
        "safetyStatus": "PROTECTED",
        "activeHours": {"start": 7, "end": 21},
        "registeredDevice": user.registered_device,
        "registered_device": user.registered_device,
        "registeredIp": user.registered_ip,
        "registered_ip": user.registered_ip,
        "hasRecentScamLink": False,
        "userType": user.user_type,
        "user_type": user.user_type,
        "digitalExperience": user.digital_experience,
        "digital_experience": user.digital_experience,
        "protectionLevel": user.protection_level,
        "protection_level": user.protection_level,
    }

def get_all_customers(db: Session) -> List[Dict[str, Any]]:
    users = db.query(User).order_by(User.created_at.asc()).all()
    return [map_user_to_customer_dict(u) for u in users]

def get_user_by_id_or_customer_id(db: Session, user_identifier: str) -> Optional[User]:
    return (
        db.query(User)
        .filter((User.id == user_identifier) | (User.customer_id == user_identifier))
        .first()
    )

def get_user_profile(db: Session, user_identifier: str) -> Optional[Dict[str, Any]]:
    user = get_user_by_id_or_customer_id(db, user_identifier)
    if not user:
        return None

    customer_dict = map_user_to_customer_dict(user)
    
    # Safety settings
    safety = (
        db.query(SafetySetting)
        .filter(SafetySetting.user_id == user.id)
        .first()
    )
    safety_data = {
        "transaction_monitoring": safety.transaction_monitoring if safety else 1,
        "scam_analysis": safety.scam_analysis if safety else 1,
        "high_risk_verification": safety.high_risk_verification if safety else 1,
    }

    # Beneficiaries
    bens = (
        db.query(Beneficiary)
        .filter(Beneficiary.user_id == user.id)
        .order_by(Beneficiary.created_at.desc())
        .all()
    )
    bens_data = [
        {
            "id": b.id,
            "userId": b.user_id,
            "user_id": b.user_id,
            "name": b.name,
            "upiId": b.upi_id,
            "upi_id": b.upi_id,
            "accountNumber": b.account_number,
            "account_number": b.account_number,
            "relationship": b.relationship,
            "avatar": b.avatar,
            "isTrusted": bool(b.is_trusted),
            "is_trusted": b.is_trusted,
            "created_at": b.created_at,
        }
        for b in bens
    ]

    return {
        **customer_dict,
        "safetySettings": safety_data,
        "beneficiaries": bens_data,
    }

def update_user_profile(db: Session, user_identifier: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    user = get_user_by_id_or_customer_id(db, user_identifier)
    if not user:
        return None

    if "userType" in updates and updates["userType"] is not None:
        user.user_type = updates["userType"]
    elif "user_type" in updates and updates["user_type"] is not None:
        user.user_type = updates["user_type"]

    if "digitalExperience" in updates and updates["digitalExperience"] is not None:
        user.digital_experience = updates["digitalExperience"]
    elif "digital_experience" in updates and updates["digital_experience"] is not None:
        user.digital_experience = updates["digital_experience"]

    if "protectionLevel" in updates and updates["protectionLevel"] is not None:
        user.protection_level = updates["protectionLevel"]
    elif "protection_level" in updates and updates["protection_level"] is not None:
        user.protection_level = updates["protection_level"]

    if "habitualMaxAmount" in updates and updates["habitualMaxAmount"] is not None:
        user.habitual_max_amount = float(updates["habitualMaxAmount"])
    elif "habitual_max_amount" in updates and updates["habitual_max_amount"] is not None:
        user.habitual_max_amount = float(updates["habitual_max_amount"])

    if "balance" in updates and updates["balance"] is not None:
        user.balance = float(updates["balance"])

    db.commit()
    db.refresh(user)
    return get_user_profile(db, user.id)

def get_beneficiaries(db: Session, user_identifier: str) -> List[Dict[str, Any]]:
    user = get_user_by_id_or_customer_id(db, user_identifier)
    user_id = user.id if user else user_identifier

    bens = (
        db.query(Beneficiary)
        .filter(Beneficiary.user_id == user_id)
        .order_by(Beneficiary.created_at.desc())
        .all()
    )
    return [
        {
            "id": b.id,
            "customerId": b.user_id,
            "userId": b.user_id,
            "user_id": b.user_id,
            "name": b.name,
            "upiId": b.upi_id,
            "upi_id": b.upi_id,
            "accountNumber": b.account_number,
            "account_number": b.account_number,
            "relationship": b.relationship or "Trusted Contact",
            "avatar": b.avatar or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            "isTrusted": bool(b.is_trusted),
            "is_trusted": b.is_trusted,
            "addedDate": b.created_at,
            "created_at": b.created_at,
        }
        for b in bens
    ]

def add_beneficiary(db: Session, user_identifier: str, data: Dict[str, Any]) -> Dict[str, Any]:
    user = get_user_by_id_or_customer_id(db, user_identifier)
    if not user:
        raise ValueError(f"User {user_identifier} not found.")

    import random
    ben_id = f"ben_{int(datetime.now().timestamp() * 1000)}"
    now_iso = datetime.now().isoformat()

    acc_no = data.get("accountNumber") or data.get("account_number") or f"•••• •••• {random.randint(1000, 9999)}"
    upi_id = data.get("upiId") or data.get("upi_id") or ""
    avatar = data.get("avatar") or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"

    ben = Beneficiary(
        id=ben_id,
        user_id=user.id,
        name=data["name"],
        upi_id=upi_id,
        account_number=acc_no,
        relationship=data.get("relationship", "Trusted Contact"),
        avatar=avatar,
        is_trusted=1,
        created_at=now_iso,
    )
    db.add(ben)
    db.commit()
    db.refresh(ben)

    return {
        "id": ben.id,
        "customerId": ben.user_id,
        "userId": ben.user_id,
        "user_id": ben.user_id,
        "name": ben.name,
        "upiId": ben.upi_id,
        "upi_id": ben.upi_id,
        "accountNumber": ben.account_number,
        "account_number": ben.account_number,
        "relationship": ben.relationship,
        "avatar": ben.avatar,
        "isTrusted": bool(ben.is_trusted),
        "is_trusted": ben.is_trusted,
        "addedDate": ben.created_at,
        "created_at": ben.created_at,
    }
