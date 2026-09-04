from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.database.models import (
    User,
    Beneficiary,
    SafetySetting,
    Transaction,
    TransactionRiskSignal,
    ScamAnalysis,
    Alert,
)

def seed_database(db: Session):
    """
    Seeds initial realistic banking demo data idempotently into SQLite.
    """
    existing_user = db.query(User).first()
    if existing_user:
        return  # Database already seeded

    now = datetime.now()
    now_iso = now.isoformat()

    # 1. Seed Demo Users
    users_data = [
        {
            "id": "usr_ravi_kumar",
            "name": "Ravi Kumar",
            "email": "ravi.kumar@klyrova-demo.in",
            "customer_id": "CUST-84920",
            "user_type": "Senior / Digitally Inexperienced",
            "digital_experience": "Beginner",
            "protection_level": "Enhanced",
            "phone": "+91 98450 12345",
            "account_number": "•••• •••• 8492",
            "upi_id": "ravikumar@okhdfcbank",
            "balance": 75420.0,
            "habitual_max_amount": 5000.0,
            "registered_device": "Samsung Galaxy M31 (Android 12)",
            "registered_ip": "103.21.144.62 (Bengaluru, IN)",
            "created_at": (now - timedelta(days=180)).isoformat(),
        },
        {
            "id": "usr_sunita_patel",
            "name": "Sunita Patel",
            "email": "sunita.patel@klyrova-demo.in",
            "customer_id": "CUST-39218",
            "user_type": "Moderate Experience",
            "digital_experience": "Moderate",
            "protection_level": "Standard",
            "phone": "+91 98765 43210",
            "account_number": "•••• •••• 3921",
            "upi_id": "sunitapatel@oksbi",
            "balance": 45000.0,
            "habitual_max_amount": 10000.0,
            "registered_device": "Redmi Note 11 (Android 11)",
            "registered_ip": "115.99.231.10 (Ahmedabad, IN)",
            "created_at": (now - timedelta(days=90)).isoformat(),
        },
        {
            "id": "usr_arjun_mehta",
            "name": "Arjun Mehta",
            "email": "arjun.mehta@klyrova-demo.in",
            "customer_id": "CUST-10482",
            "user_type": "Tech Savvy / Advanced",
            "digital_experience": "Advanced",
            "protection_level": "Standard",
            "phone": "+91 91234 56789",
            "account_number": "•••• •••• 1048",
            "upi_id": "arjunmehta@okaxis",
            "balance": 118250.0,
            "habitual_max_amount": 25000.0,
            "registered_device": "OnePlus 11R (Android 14)",
            "registered_ip": "49.37.112.45 (Mumbai, IN)",
            "created_at": (now - timedelta(days=360)).isoformat(),
        },
    ]

    for u in users_data:
        db.add(User(**u))

    # 2. Seed Safety Settings
    for u in users_data:
        db.add(
            SafetySetting(
                id=f"set_{u['id']}",
                user_id=u["id"],
                transaction_monitoring=1,
                scam_analysis=1,
                high_risk_verification=1,
                updated_at=now_iso,
            )
        )

    # 3. Seed Beneficiaries
    bens_data = [
        {
            "id": "ben_1",
            "user_id": "usr_ravi_kumar",
            "name": "Priya Kumar",
            "upi_id": "priya.kumar@oksbi",
            "account_number": "•••• •••• 4421",
            "relationship": "Daughter",
            "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
            "is_trusted": 1,
            "created_at": (now - timedelta(days=120)).isoformat(),
        },
        {
            "id": "ben_2",
            "user_id": "usr_ravi_kumar",
            "name": "Ramesh Verma",
            "upi_id": "rameshverma@paytm",
            "account_number": "•••• •••• 8831",
            "relationship": "Trusted Pharmacist",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            "is_trusted": 1,
            "created_at": (now - timedelta(days=60)).isoformat(),
        },
        {
            "id": "ben_3",
            "user_id": "usr_ravi_kumar",
            "name": "Dr. Arvind Joshi",
            "upi_id": "drjoshi@icici",
            "account_number": "•••• •••• 1290",
            "relationship": "Family Physician",
            "avatar": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150",
            "is_trusted": 1,
            "created_at": (now - timedelta(days=45)).isoformat(),
        },
        {
            "id": "ben_4",
            "user_id": "usr_ravi_kumar",
            "name": "BESCOM Electricity Board",
            "upi_id": "bescom.billpay@sbi",
            "account_number": "•••• •••• 9901",
            "relationship": "Utility Provider",
            "avatar": "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=150",
            "is_trusted": 1,
            "created_at": (now - timedelta(days=150)).isoformat(),
        },
    ]

    for b in bens_data:
        db.add(Beneficiary(**b))

    # 4. Seed Initial Transactions
    txns_data = [
        {
            "id": "TXN-001",
            "user_id": "usr_ravi_kumar",
            "recipient": "Priya Kumar",
            "recipient_upi": "priya.kumar@oksbi",
            "amount": 2500.0,
            "purpose": "Monthly pocket money allowance",
            "risk_score": 15,
            "risk_level": "LOW",
            "recommended_action": "ALLOW",
            "status": "COMPLETED",
            "device": "Samsung Galaxy M31",
            "location": "Bengaluru, IN",
            "created_at": (now - timedelta(days=2, hours=3)).isoformat(),
            "signals": [
                {"reason": "Baseline transaction telemetry check", "points": 10},
                {"reason": "Known trusted beneficiary verified", "points": 5},
            ],
        },
        {
            "id": "TXN-002",
            "user_id": "usr_ravi_kumar",
            "recipient": "Ramesh Verma",
            "recipient_upi": "rameshverma@paytm",
            "amount": 840.0,
            "purpose": "Monthly BP medicine prescription refill",
            "risk_score": 12,
            "risk_level": "LOW",
            "recommended_action": "ALLOW",
            "status": "COMPLETED",
            "device": "Samsung Galaxy M31",
            "location": "Bengaluru, IN",
            "created_at": (now - timedelta(days=5, hours=6)).isoformat(),
            "signals": [
                {"reason": "Baseline transaction telemetry check", "points": 10},
                {"reason": "Trusted medical contact", "points": 2},
            ],
        },
        {
            "id": "TXN-003",
            "user_id": "usr_ravi_kumar",
            "recipient": "FastPay Tech Support Officer",
            "recipient_upi": "support981@ybl",
            "amount": 45000.0,
            "purpose": "URGENT electricity disconnection fine payment immediately",
            "risk_score": 92,
            "risk_level": "CRITICAL",
            "recommended_action": "HOLD",
            "status": "HELD",
            "device": "Unrecognized Chrome / Windows 10",
            "location": "Kolkata, IN",
            "created_at": (now - timedelta(hours=1, minutes=15)).isoformat(),
            "signals": [
                {"reason": "High value transfer (₹45,000 >= ₹25,000)", "points": 25},
                {"reason": "Amount ₹45,000 exceeds habitual threshold (₹5,000) by >2x", "points": 10},
                {"reason": "Unfamiliar/unverified recipient not in trusted directory", "points": 20},
                {"reason": "Urgency coercion keywords detected in transaction purpose", "points": 10},
                {"reason": "Combined risk vector: High-value payment to a newly introduced recipient", "points": 10},
                {"reason": "Unrecognized device fingerprint", "points": 15},
                {"reason": "Enhanced Protection Profile: Senior/beginner safety sensitivity adjustment", "points": 10},
            ],
        },
    ]

    for t_data in txns_data:
        signals = t_data.pop("signals")
        txn = Transaction(**t_data)
        db.add(txn)
        for s in signals:
            db.add(
                TransactionRiskSignal(
                    id=f"sig_{txn.id}_{len(txn.signals)}",
                    transaction_id=txn.id,
                    reason=s["reason"],
                    points=s["points"],
                )
            )

    # 5. Seed Initial Scam Analysis
    import json
    scam = ScamAnalysis(
        id="SCAM-INIT-001",
        user_id="usr_ravi_kumar",
        message="Dear Customer, Your SBI YONO Account will be Blocked Today! Please immediately update your PAN Card by clicking http://sbi-pan-kyc.apk or call bank officer at 9845019283 to avoid permanent seizure.",
        score=94,
        risk_level="CRITICAL",
        categories=json.dumps(["Phishing SMS", "Institutional Impersonation", "Malicious APK Payload"]),
        reasons=json.dumps([
            "Impersonates authoritative bodies (SBI / YONO)",
            "Creates artificial panic with immediate account blocked deadlines",
            "Directs user to download an untrusted APK package (sbi-pan-kyc.apk)",
        ]),
        recommended_action="IMMEDIATELY DISREGARD AND BLOCK SENDER. Report incident to 1930 Cybercrime Helpline.",
        source="LOCAL_HEURISTIC_ENGINE",
        created_at=(now - timedelta(hours=2)).isoformat(),
    )
    db.add(scam)

    # 6. Seed Initial Alerts
    alerts_data = [
        {
            "id": "ALT-001",
            "user_id": "usr_ravi_kumar",
            "type": "PAYMENT_HOLD",
            "title": "Protective Hold Instituted on ₹45,000 Transfer",
            "message": "GuardianPay AI detected coercive urgency keywords and an unfamiliar recipient. Funds are kept safely in your account.",
            "severity": "CRITICAL",
            "related_transaction_id": "TXN-003",
            "related_scam_id": None,
            "read": 0,
            "created_at": (now - timedelta(hours=1, minutes=14)).isoformat(),
        },
        {
            "id": "ALT-002",
            "user_id": "usr_ravi_kumar",
            "type": "SCAM_DETECTED",
            "title": "Deceptive Phishing SMS Detected",
            "message": "Scam analyzer flagged a fake SBI PAN card KYC APK download threat with 94% risk probability.",
            "severity": "CRITICAL",
            "related_transaction_id": None,
            "related_scam_id": "SCAM-INIT-001",
            "read": 0,
            "created_at": (now - timedelta(hours=2)).isoformat(),
        },
        {
            "id": "ALT-003",
            "user_id": "usr_ravi_kumar",
            "type": "SAFETY_REMINDER",
            "title": "Enhanced Senior Protection Active",
            "message": "24/7 proactive behavioral analysis active for Ravi Kumar.",
            "severity": "LOW",
            "related_transaction_id": None,
            "related_scam_id": None,
            "read": 1,
            "created_at": (now - timedelta(days=1)).isoformat(),
        },
    ]

    for a in alerts_data:
        db.add(Alert(**a))

    db.commit()
