from typing import List, Dict, Any, Optional
from datetime import datetime

class RiskSignal:
    def __init__(self, reason: str, points: int):
        self.reason = reason
        self.points = points

    def to_dict(self) -> Dict[str, Any]:
        return {"reason": self.reason, "points": self.points}

class RiskEvaluationResult:
    def __init__(
        self,
        risk_score: int,
        risk_level: str,
        recommended_action: str,
        status: str,
        signals: List[RiskSignal],
        protection_level: str,
        reasons: List[str],
    ):
        self.risk_score = risk_score
        self.risk_level = risk_level
        self.recommended_action = recommended_action
        self.status = status
        self.signals = signals
        self.protection_level = protection_level
        self.reasons = reasons

def evaluate_transaction_risk(
    amount: float,
    recipient: str,
    recipient_upi: str,
    purpose: str = "",
    device: Optional[str] = None,
    location: Optional[str] = None,
    is_known_recipient: bool = False,
    is_known_device: bool = True,
    transaction_hour: Optional[int] = None,
    completion_time_seconds: Optional[int] = None,
    customer: Optional[Dict[str, Any]] = None,
    has_recent_scam_alert: bool = False,
) -> RiskEvaluationResult:
    """
    Authoritative Multi-Factor Behavioral Risk Engine for GuardianPay AI.
    Evaluates transaction risk BEFORE payment execution with explainable, deterministic weights
    and vulnerability-aware protection profiles.
    """
    customer = customer or {}
    habitual_max = float(customer.get("habitual_max_amount", 5000.0) or 5000.0)
    user_type = str(customer.get("user_type", "") or "")
    digital_exp = str(customer.get("digital_experience", "") or "")
    protection_level = str(customer.get("protection_level", "Standard") or "Standard")
    registered_device = str(customer.get("registered_device", "") or "")

    score = 0
    signals: List[RiskSignal] = []

    # 1. Baseline transaction verification telemetry (5 pts)
    score += 5
    signals.append(RiskSignal("Baseline transaction telemetry check", 5))

    # 2. Transaction Amount and Habitual Threshold Evaluation
    if amount >= 50000:
        score += 30
        signals.append(RiskSignal(f"High value transfer (₹{amount:,.0f} >= ₹50,000)", 30))
    elif amount >= 25000:
        score += 20
        signals.append(RiskSignal(f"Substantial transfer amount (₹{amount:,.0f} >= ₹25,000)", 20))
    elif amount >= 10000:
        score += 15
        signals.append(RiskSignal(f"Elevated transfer amount (₹{amount:,.0f} >= ₹10,000)", 15))
    elif amount >= 5000:
        score += 10
        signals.append(RiskSignal(f"Moderate transfer amount (₹{amount:,.0f} >= ₹5,000)", 10))

    # Habitual deviation (> 2x habitual maximum)
    if habitual_max and amount > (habitual_max * 2):
        score += 15
        signals.append(
            RiskSignal(
                f"Amount ₹{amount:,.0f} exceeds customer's habitual threshold (₹{habitual_max:,.0f}) by >2x",
                15,
            )
        )

    # 3. Unfamiliar / Unverified Beneficiary
    if not is_known_recipient:
        score += 20
        signals.append(
            RiskSignal(
                f"Unfamiliar/unverified recipient ({recipient_upi}) not found in trusted contact directory",
                20,
            )
        )

    # 4. Urgent Coercive Language in Note/Purpose
    purpose_lower = (purpose or "").lower()
    urgent_keywords = [
        "urgent", "immediately", "asap", "fast", "quick", "emergency",
        "hurry", "police", "arrest", "power cut", "bill due", "disconnection",
        "block", "penalty", "seizure", "fine", "warrant"
    ]
    has_urgent_keyword = any(kw in purpose_lower for kw in urgent_keywords)
    if has_urgent_keyword:
        score += 15
        signals.append(
            RiskSignal("Urgency / coercive threat keywords detected in transaction purpose/note", 15)
        )

    # 5. OTP / PIN / Credentials / Remote-Access indicators
    credential_keywords = [
        "otp", "pin", "cvv", "password", "passcode", "verification",
        "kyc", "code", "remote", "anydesk", "teamviewer", "quicksupport",
        "apk", "screen share"
    ]
    has_credential_keyword = any(kw in purpose_lower for kw in credential_keywords)
    if has_credential_keyword:
        score += 15
        signals.append(
            RiskSignal("Demands for credentials, OTP, or remote screen control keywords identified", 15)
        )

    # 6. Device & Telemetry Anomaly
    is_device_unfamiliar = (not is_known_device) or (
        bool(device and registered_device and "Galaxy" not in device and device not in registered_device)
    )
    if is_device_unfamiliar:
        score += 20
        signals.append(
            RiskSignal(f"Unrecognized device fingerprint ({device or 'Unknown Hardware'})", 20)
        )

    # Temporal analysis (Off-hours 22:00 - 06:00)
    hour = transaction_hour if transaction_hour is not None else datetime.now().hour
    if hour >= 22 or hour < 6:
        score += 15
        signals.append(
            RiskSignal(f"Off-hours transaction timing ({hour}:00, outside normal daylight banking hours)", 15)
        )

    # Behavioral Velocity / Panic Checkout (< 15 seconds completion)
    if completion_time_seconds is not None and completion_time_seconds < 15:
        score += 15
        signals.append(
            RiskSignal(
                f"Abnormal behavioral haste ({completion_time_seconds}s completion, characteristic of active phone coercion)",
                15,
            )
        )

    # 7. Threat Intelligence: Prior Scam Interaction Correlation
    scam_intel = (
        has_recent_scam_alert
        or customer.get("has_recent_scam_link")
        or customer.get("hasRecentScamAlert")
    )
    if scam_intel:
        score += 20
        signals.append(
            RiskSignal("Threat Intelligence Link: Account recently interacted with suspicious scam/phishing message", 20)
        )

    # 8. Vulnerability-Aware Customer Protection Profile Adjustment
    protection_norm = protection_level.upper()
    is_senior_or_beginner = (
        digital_exp.lower() in ("beginner", "low")
        or "senior" in user_type.lower()
        or "inexperienced" in user_type.lower()
    )

    if protection_norm in ("ENHANCED", "STRONG") or is_senior_or_beginner:
        # Heightened safety sensitivity for senior/digitally inexperienced account when risk signals are present
        if (not is_known_recipient) or has_urgent_keyword or is_device_unfamiliar:
            score += 15
            signals.append(
                RiskSignal(
                    "Enhanced Protection Profile: Heightened safety sensitivity applied for senior/digitally inexperienced account",
                    15,
                )
            )

    # 9. Scikit-learn IsolationForest Prototype Anomaly Evaluation
    try:
        from backend.app.risk.ml_risk_pipeline import ml_pipeline
        telemetry_dict = {
            "amount": amount,
            "isKnownRecipient": is_known_recipient,
            "isKnownDevice": is_known_device,
            "transactionHour": hour,
            "completionTimeSeconds": completion_time_seconds or 35,
            "purpose": purpose,
        }
        ml_res = ml_pipeline.predict_anomaly(telemetry_dict, customer)
        if ml_res.get("is_anomaly"):
            score += 10
            signals.append(
                RiskSignal(
                    f"Prototype IsolationForest Anomaly Engine: Unsupervised behavioral deviation detected (Score: {ml_res['ml_anomaly_score']}/100)",
                    10,
                )
            )
    except Exception:
        pass

    # Cap score between 0 and 100
    score = min(100, max(0, score))

    # Determine Risk Level, Decision, and Status
    # Actions:
    # LOW (<25)       -> ALLOW
    # MEDIUM (25-49)  -> WARN (Explain why unusual, ask for conscious confirmation)
    # HIGH (50-74)    -> VERIFY (Explain risk factors, require stronger verification)
    # CRITICAL (>=75) -> HOLD (Protective Hold, cannot be bypassed with simple PIN)
    if score >= 75:
        risk_level = "CRITICAL"
        recommended_action = "HOLD"
        status = "HELD"
    elif score >= 50:
        risk_level = "HIGH"
        recommended_action = "VERIFY"
        status = "VERIFICATION REQUIRED"
    elif score >= 25:
        risk_level = "MEDIUM"
        recommended_action = "WARN"
        status = "WARNED"
    else:
        risk_level = "LOW"
        recommended_action = "ALLOW"
        status = "ALLOWED"

    reasons = [s.reason for s in signals]

    return RiskEvaluationResult(
        risk_score=score,
        risk_level=risk_level,
        recommended_action=recommended_action,
        status=status,
        signals=signals,
        protection_level=protection_level,
        reasons=reasons,
    )
