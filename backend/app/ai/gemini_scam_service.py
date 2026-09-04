import os
import re
import json
from typing import Dict, Any, List
from backend.app.core.config import settings

class ThreatIndicators:
    def __init__(
        self,
        has_urgency_tactics: bool = False,
        has_suspicious_links: bool = False,
        has_impersonation: bool = False,
        requests_remote_access: bool = False,
        requests_credentials_or_otp: bool = False,
    ):
        self.has_urgency_tactics = has_urgency_tactics
        self.has_suspicious_links = has_suspicious_links
        self.has_impersonation = has_impersonation
        self.requests_remote_access = requests_remote_access
        self.requests_credentials_or_otp = requests_credentials_or_otp

    def to_dict(self) -> Dict[str, bool]:
        return {
            "hasUrgencyTactics": self.has_urgency_tactics,
            "hasSuspiciousLinks": self.has_suspicious_links,
            "hasImpersonation": self.has_impersonation,
            "requestsRemoteAccess": self.requests_remote_access,
            "requestsCredentialsOrOtp": self.requests_credentials_or_otp,
        }

def analyze_with_local_heuristics(message: str) -> Dict[str, Any]:
    """
    Authoritative local heuristic fallback engine.
    Scans for high-confidence Indian banking scam patterns, phishing vectors, and APK payloads.
    """
    text = message.lower()
    score = 0
    categories: List[str] = []
    reasons: List[str] = []
    actions: List[str] = []

    # Indicators
    has_urgency = False
    has_links = False
    has_impersonation = False
    requests_remote = False
    requests_credentials = False

    # 1. Impersonation detection
    impersonation_patterns = [
        "sbi", "hdfc", "icici", "axis", "punjab national", "rbi",
        "reserve bank", "police", "electricity office", "power department",
        "customer care", "bank manager", "kyc officer", "telecom"
    ]
    matched_org = [org for org in impersonation_patterns if org in text]
    if matched_org:
        score += 25
        has_impersonation = True
        categories.append("Institutional Impersonation")
        reasons.append(f"Impersonates authoritative bodies or utility providers ({', '.join(matched_org).upper()})")

    # 2. Urgency and Coercion
    urgency_patterns = [
        "blocked today", "suspended", "immediately", "within 24 hours",
        "power will be disconnected", "disconnected tonight", "urgent",
        "action required", "legal action", "arrest warrant", "freeze"
    ]
    matched_urgency = [u for u in urgency_patterns if u in text]
    if matched_urgency:
        score += 30
        has_urgency = True
        categories.append("Urgency & Coercion")
        reasons.append("Creates artificial panic with immediate forfeiture, arrest, or disconnection deadlines")

    # 3. Malicious Links / APK Payloads
    has_url = bool(re.search(r"https?://\S+|www\.\S+|bit\.ly/\S+|\.apk", text))
    if has_url or ".apk" in text or "download" in text and "link" in text:
        score += 35
        has_links = True
        categories.append("Phishing Link / Malicious APK")
        reasons.append("Directs user to click suspicious shortened link or download an untrusted APK package")

    # 4. Remote Access / Screen Sharing
    remote_keywords = ["anydesk", "teamviewer", "quicksupport", "rustdesk", "screen share", "9-digit code"]
    matched_remote = [r for r in remote_keywords if r in text]
    if matched_remote:
        score += 45
        requests_remote = True
        categories.append("Remote Access Trojan / Screen Control")
        reasons.append(f"Instructs victim to install remote desktop control software ({', '.join(matched_remote)})")

    # 5. Credential / OTP Harvest
    credential_keywords = ["otp", "pin", "pan card", "aadhaar", "password", "cvv", "card number", "debit card details"]
    matched_cred = [c for c in credential_keywords if c in text]
    if matched_cred:
        score += 35
        requests_credentials = True
        categories.append("Credential Harvesting")
        reasons.append(f"Demands sensitive banking identifiers or authentication factors ({', '.join(matched_cred)})")

    # Calculate final score and tier
    score = min(100, max(5, score))

    if score >= 75:
        risk_level = "CRITICAL" if score >= 85 else "HIGH"
        actions = [
            "DO NOT click any embedded links or install recommended applications.",
            "DO NOT share OTPs, PINs, or 9-digit remote control codes.",
            "Verify directly with your official bank branch or dial National Cybercrime Helpline 1930."
        ]
        recommended_action = "IMMEDIATELY DISREGARD AND BLOCK SENDER. Report incident to 1930 Cybercrime Helpline."
    elif score >= 40:
        risk_level = "WARN"
        actions = [
            "Treat with caution. Contact the sender through a verified telephone number.",
            "Do not disclose confidential bank account numbers or passwords."
        ]
        recommended_action = "EXERCISE CAUTION. Independently verify the message authenticity before taking action."
    else:
        risk_level = "SAFE"
        categories.append("Legitimate / Low Risk")
        reasons.append("No active phishing patterns, coercive threats, or credential harvest signatures identified.")
        actions = ["Standard banking precautions apply."]
        recommended_action = "Message appears informational. Always refrain from sharing UPI PINs to receive money."

    indicators = ThreatIndicators(
        has_urgency_tactics=has_urgency,
        has_suspicious_links=has_links,
        has_impersonation=has_impersonation,
        requests_remote_access=requests_remote,
        requests_credentials_or_otp=requests_credentials,
    )

    primary_category = categories[0] if categories else "General Security Alert"

    return {
        "score": score,
        "riskLevel": risk_level,
        "categories": categories,
        "reasons": reasons,
        "recommendedAction": recommended_action,
        "source": "LOCAL_HEURISTIC_ENGINE",
        "scamType": primary_category,
        "summary": f"Heuristic analysis flagged {len(categories)} security factors with {score}% threat probability.",
        "warningSigns": reasons,
        "actionAdvice": actions,
        "threatIndicators": indicators.to_dict(),
    }

async def analyze_scam_with_gemini(message: str) -> Dict[str, Any]:
    """
    Analyzes an inbound SMS, WhatsApp message, or call transcript using Gemini AI.
    Gracefully falls back to local heuristic analysis if API key is not configured or on network error.
    """
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return analyze_with_local_heuristics(message)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        prompt = f"""
You are the Chief Financial Cybercrime Analyst for GuardianPay AI, an advanced digital banking safety layer.
Evaluate the following SMS, email, or WhatsApp message for scam and social engineering indicators:

MESSAGE CONTENT:
\"\"\"{message}\"\"\"

Analyze the message strictly and return ONLY a valid JSON object with the following structure:
{{
  "score": <integer from 0 to 100 representing scam risk>,
  "riskLevel": "<SAFE | WARN | HIGH | CRITICAL>",
  "scamType": "<e.g. Phishing SMS, Utility Bill Scam, KYC Impersonation, Remote Access Fraud, Legitimate>",
  "categories": ["<category1>", "<category2>"],
  "summary": "<one sentence clear assessment>",
  "reasons": ["<bullet 1>", "<bullet 2>"],
  "warningSigns": ["<sign 1>", "<sign 2>"],
  "actionAdvice": ["<action 1>", "<action 2>"],
  "recommendedAction": "<concise clear instruction for an elderly or non-tech-savvy user>",
  "threatIndicators": {{
    "hasUrgencyTactics": <true/false>,
    "hasSuspiciousLinks": <true/false>,
    "hasImpersonation": <true/false>,
    "requestsRemoteAccess": <true/false>,
    "requestsCredentialsOrOtp": <true/false>
  }}
}}
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        response_text = response.text or ""
        # Clean up JSON markdown fences if present
        clean_json = re.sub(r"^```json\s*", "", response_text.strip())
        clean_json = re.sub(r"\s*```$", "", clean_json.strip())

        parsed = json.loads(clean_json)
        parsed["source"] = "GEMINI"
        return parsed

    except Exception as e:
        # On error, timeout, or quota limit, fall back safely to deterministic heuristic engine
        print(f"[GuardianPay AI] Gemini API call deferred to heuristic engine: {e}")
        fallback = analyze_with_local_heuristics(message)
        fallback["source"] = "LOCAL_HEURISTIC_ENGINE"
        return fallback
