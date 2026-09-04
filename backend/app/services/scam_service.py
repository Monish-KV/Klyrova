import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.database.models import ScamAnalysis, Alert, User
from backend.app.ai.gemini_scam_service import analyze_scam_with_gemini
from backend.app.services.customer_service import get_user_by_id_or_customer_id

async def analyze_and_record_scam(
    db: Session,
    message: str,
    user_identifier: Optional[str] = None,
) -> Dict[str, Any]:
    if not message or not message.strip():
        raise ValueError("Message text is required for scam analysis.")

    user = get_user_by_id_or_customer_id(db, user_identifier) if user_identifier else None
    user_id = user.id if user else None

    # Run Gemini AI with local fallback
    analysis_result = await analyze_scam_with_gemini(message)

    scam_id = f"SCAM-{int(datetime.now().timestamp() * 1000)}"
    now_iso = datetime.now().isoformat()

    db_scam = ScamAnalysis(
        id=scam_id,
        user_id=user_id,
        message=message,
        score=analysis_result["score"],
        risk_level=analysis_result["riskLevel"],
        categories=json.dumps(analysis_result.get("categories", [])),
        reasons=json.dumps(analysis_result.get("reasons", [])),
        recommended_action=analysis_result.get("recommendedAction", "Exercise caution"),
        source=analysis_result.get("source", "LOCAL_HEURISTIC_ENGINE"),
        created_at=now_iso,
    )
    db.add(db_scam)

    # If critical or high risk, generate customer alert
    if analysis_result["riskLevel"] in ("CRITICAL", "HIGH"):
        cat_primary = (
            analysis_result.get("categories", ["Phishing"])[0]
            if analysis_result.get("categories")
            else "Phishing"
        )
        db.add(
            Alert(
                id=f"ALT-SCAM-{int(datetime.now().timestamp() * 1000)}",
                user_id=user_id,
                type="SCAM_DETECTED",
                title=f"Deceptive {cat_primary} Message Detected",
                message=f"Scam analyzer identified high threat ({analysis_result['score']}% risk): \"{message[:70]}...\"",
                severity=analysis_result["riskLevel"],
                related_transaction_id=None,
                related_scam_id=scam_id,
                read=0,
                created_at=now_iso,
            )
        )

    db.commit()

    # Build response format matching both ScamAssessmentResponse and scamAnalyze response
    return {
        "id": scam_id,
        "score": analysis_result["score"],
        "riskScore": analysis_result["score"],
        "riskLevel": analysis_result["riskLevel"],
        "categories": analysis_result.get("categories", []),
        "reasons": analysis_result.get("reasons", []),
        "warningSigns": analysis_result.get("warningSigns", analysis_result.get("reasons", [])),
        "recommendedAction": analysis_result.get("recommendedAction", ""),
        "actionAdvice": analysis_result.get("actionAdvice", [analysis_result.get("recommendedAction", "")]),
        "source": analysis_result.get("source", "LOCAL_HEURISTIC_ENGINE"),
        "rawText": message,
        "timestamp": now_iso,
        "createdAt": now_iso,
        "created_at": now_iso,
        "scamType": analysis_result.get("scamType", "Phishing SMS"),
        "summary": analysis_result.get("summary", "Message security analysis completed."),
        "threatIndicators": analysis_result.get("threatIndicators", {
            "hasUrgencyTactics": True,
            "hasSuspiciousLinks": False,
            "hasImpersonation": True,
            "requestsRemoteAccess": False,
            "requestsCredentialsOrOtp": False,
        }),
    }

def get_scam_history(
    db: Session,
    user_identifier: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    query = db.query(ScamAnalysis)
    if user_identifier:
        user = get_user_by_id_or_customer_id(db, user_identifier)
        if user:
            query = query.filter(ScamAnalysis.user_id == user.id)

    records = query.order_by(ScamAnalysis.created_at.desc()).offset(offset).limit(limit).all()

    results = []
    for r in records:
        try:
            cats = json.loads(r.categories)
        except Exception:
            cats = []
        try:
            reasons = json.loads(r.reasons)
        except Exception:
            reasons = []

        results.append({
            "id": r.id,
            "userId": r.user_id,
            "user_id": r.user_id,
            "message": r.message,
            "score": r.score,
            "riskScore": r.score,
            "riskLevel": r.risk_level,
            "risk_level": r.risk_level,
            "categories": cats,
            "reasons": reasons,
            "recommendedAction": r.recommended_action,
            "recommended_action": r.recommended_action,
            "source": r.source,
            "createdAt": r.created_at,
            "created_at": r.created_at,
        })
    return results
