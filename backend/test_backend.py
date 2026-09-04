"""
Automated Comprehensive Test Suite for GuardianPay AI Backend
VIT Hackathon - Team Klyrova
Architecture: React -> FastAPI -> AI Risk Engine / Gemini -> SQLite
"""
import sys
from pathlib import Path

# Ensure root directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from backend.app.main import app

def run_tests():
    print("=========================================================")
    print("RUNNING COMPREHENSIVE GUARDIANPAY AI TEST SUITE")
    print("=========================================================")

    with TestClient(app) as client:
        # -----------------------------------------------------
        # 1. Health and Observability Checks
        # -----------------------------------------------------
        print("\n--- [1] HEALTH & OBSERVABILITY ---")
        health_resp = client.get("/health")
        assert health_resp.status_code == 200, f"Health check failed: {health_resp.text}"
        h_data = health_resp.json()
        assert h_data["status"] == "ok"
        assert "SQLite" in h_data["database"]
        assert "aiConfiguration" in h_data
        print(f" [PASS] GET /health: Status={h_data['status']}, DB={h_data['database']}, AI={h_data['aiConfiguration']}")

        api_health = client.get("/api/health")
        assert api_health.status_code == 200
        print(" [PASS] GET /api/health: Verified proxy-compatible route")

        # -----------------------------------------------------
        # 2. Customers and Persona Directory
        # -----------------------------------------------------
        print("\n--- [2] DEMO PERSONAS VERIFICATION ---")
        cust_resp = client.get("/api/customers")
        assert cust_resp.status_code == 200
        customers = cust_resp.json()
        assert len(customers) >= 3, "Expected at least 3 seeded personas"
        cust_ids = [c["id"] for c in customers]
        assert "usr_ravi_kumar" in cust_ids, "Ravi Kumar persona missing"
        assert "usr_sunita_patel" in cust_ids, "Sunita Patel persona missing"
        assert "usr_arjun_mehta" in cust_ids, "Arjun Mehta persona missing"

        ravi = next(c for c in customers if c["id"] == "usr_ravi_kumar")
        assert "Senior" in ravi["userType"] or "Beginner" in ravi["digitalExperience"]
        assert ravi["protectionLevel"] == "Enhanced"
        print(f" [PASS] Ravi Kumar: {ravi['userType']} | {ravi['digitalExperience']} | {ravi['protectionLevel']} Protection")

        arjun = next(c for c in customers if c["id"] == "usr_arjun_mehta")
        assert arjun["protectionLevel"] == "Standard"
        print(f" [PASS] Arjun Mehta: {arjun['userType']} | {arjun['digitalExperience']} | {arjun['protectionLevel']} Protection")

        # -----------------------------------------------------
        # 3. Risk Engine Hardening & Deterministic Scoring
        # -----------------------------------------------------
        print("\n--- [3] RISK ENGINE HARDENING ---")

        # 3a. Scenario A: Low-risk routine payment (ALLOW)
        low_risk_payload = {
            "customerId": "usr_ravi_kumar",
            "recipientName": "Rohan Kumar",
            "recipientUpi": "rohan.k@okaxis",
            "amount": 2500,
            "purpose": "Monthly household allowance",
            "isKnownDevice": True,
            "transactionHour": 14,
            "completionTimeSeconds": 65,
            "hasRecentScamAlert": False,
        }
        res_low = client.post("/api/analyze-payment", json=low_risk_payload)
        assert res_low.status_code == 200
        d_low = res_low.json()
        assert d_low["tier"] == "LOW", f"Expected LOW risk, got {d_low['tier']}"
        assert d_low["action"] == "ALLOW"
        assert d_low["status"] == "ALLOWED"
        print(f" [PASS] Low-Risk Routine Payment: Score={d_low['totalScore']}/100 -> {d_low['action']} ({d_low['tier']})")

        # 3b. Scenario B: Medium-risk unfamiliar payment (VERIFY)
        med_risk_payload = {
            "customerId": "usr_sunita_patel",
            "recipientName": "New Electric Vendor",
            "recipientUpi": "vendor981@upi",
            "amount": 8000,
            "purpose": "Appliance repair charge",
            "isKnownDevice": True,
            "transactionHour": 15,
            "completionTimeSeconds": 45,
            "hasRecentScamAlert": False,
        }
        res_med = client.post("/api/analyze-payment", json=med_risk_payload)
        assert res_med.status_code == 200
        d_med = res_med.json()
        assert d_med["tier"] == "VERIFY"
        assert d_med["action"] == "VERIFY"
        print(f" [PASS] Medium-Risk Unfamiliar Payment: Score={d_med['totalScore']}/100 -> {d_med['action']} ({d_med['tier']})")

        # 3c. Scenario C: High/Critical-risk coercion payment (HOLD)
        high_risk_payload = {
            "customerId": "usr_ravi_kumar",
            "recipientName": "Electricity Arrears Support",
            "recipientUpi": "powercut.warning@paytm",
            "amount": 80000,
            "purpose": "Urgent power disconnection penalty pay immediately",
            "isKnownDevice": False,
            "transactionHour": 23,
            "completionTimeSeconds": 10,
            "hasRecentScamAlert": True,
        }
        res_high = client.post("/api/analyze-payment", json=high_risk_payload)
        assert res_high.status_code == 200
        d_high = res_high.json()
        assert d_high["tier"] in ("CRITICAL", "HIGH")
        assert d_high["action"] == "HOLD"
        assert d_high["status"] == "HELD"
        held_txn_id = d_high["transactionId"]
        print(f" [PASS] High/Critical Coercion Payment: Score={d_high['totalScore']}/100 -> {d_high['action']} ({d_high['tier']})")

        # 3d. Scenario E: Vulnerability Sensitivity Differential
        # Same transaction evaluated for Ravi Kumar (Enhanced) vs Arjun Mehta (Standard)
        same_txn = {
            "recipientName": "Online Appliance Store",
            "recipientUpi": "appliancestore@upi",
            "amount": 18000,
            "purpose": "New microwave oven purchase",
            "isKnownDevice": True,
            "transactionHour": 14,
            "completionTimeSeconds": 35,
            "hasRecentScamAlert": False,
        }
        res_ravi = client.post("/api/analyze-payment", json={**same_txn, "customerId": "usr_ravi_kumar"}).json()
        res_arjun = client.post("/api/analyze-payment", json={**same_txn, "customerId": "usr_arjun_mehta"}).json()

        print(f" [PASS] Vulnerability Differential Test:")
        print(f"        Ravi Kumar (Senior, Enhanced):  Score={res_ravi['totalScore']}/100 -> Action={res_ravi['action']}")
        print(f"        Arjun Mehta (Tech, Standard):   Score={res_arjun['totalScore']}/100 -> Action={res_arjun['action']}")
        assert res_ravi["totalScore"] > res_arjun["totalScore"], "Vulnerable customer score must be strictly higher"

        # -----------------------------------------------------
        # 4. Protective HOLD Enforcement
        # -----------------------------------------------------
        print("\n--- [4] PROTECTIVE HOLD ENFORCEMENT ---")
        # Attacker/User attempts to confirm a HELD transaction directly without bank/family clearance
        confirm_fail = client.post(f"/api/transactions/{held_txn_id}/confirm", json={"pinEntered": True})
        assert confirm_fail.status_code == 403, f"Expected 403 Forbidden for unverified held transaction, got {confirm_fail.status_code}"
        print(" [PASS] Direct completion of HELD transaction rejected with HTTP 403")

        # Authorized bank resolution clears the hold
        resolve_resp = client.post(f"/api/transactions/{held_txn_id}/resolve", json={"decision": "APPROVE"})
        assert resolve_resp.status_code == 200
        assert resolve_resp.json()["status"] == "COMPLETED"
        print(f" [PASS] Bank operator verified override resolved status to: {resolve_resp.json()['status']}")

        # -----------------------------------------------------
        # 5. Scam Analyzer (Gemini & Heuristic Fallback)
        # -----------------------------------------------------
        print("\n--- [5] SCAM ANALYZER (AI & HEURISTICS) ---")
        # 5a. Critical fraudulent SMS
        fraud_sms = "URGENT: Your SBI account is blocked today. Click http://sbi-unfreeze.apk and enter your debit card PIN to restore access immediately."
        scam_res = client.post("/api/scams/analyze", json={"message": fraud_sms, "userId": "usr_ravi_kumar"})
        assert scam_res.status_code == 200
        scam_data = scam_res.json()
        assert scam_data["score"] >= 75
        assert scam_data["riskLevel"] in ("CRITICAL", "HIGH")
        assert scam_data["source"] in ("GEMINI", "LOCAL_HEURISTIC_ENGINE")
        assert len(scam_data["reasons"]) > 0
        print(f" [PASS] Deceptive SMS Detected: Score={scam_data['score']}% | Level={scam_data['riskLevel']} | Source={scam_data['source']}")

        # 5b. Benign message
        benign_sms = "Hi dad, I reached home safely. Will call you around 8 PM for dinner."
        benign_res = client.post("/api/scams/analyze", json={"message": benign_sms, "userId": "usr_ravi_kumar"})
        assert benign_res.status_code == 200
        b_data = benign_res.json()
        assert b_data["score"] <= 20
        assert b_data["riskLevel"] in ("LOW", "SAFE")
        print(f" [PASS] Benign Message Detected: Score={b_data['score']}% | Level={b_data['riskLevel']} | Source={b_data['source']}")

        # -----------------------------------------------------
        # 6. SQLite Persistence Verification
        # -----------------------------------------------------
        print("\n--- [6] SQLITE PERSISTENCE VERIFICATION ---")
        # Verify transactions retrieved
        txns_resp = client.get("/api/transactions?userId=usr_ravi_kumar")
        assert txns_resp.status_code == 200
        txns = txns_resp.json()
        assert len(txns) >= 1
        print(f" [PASS] Transactions query verified: {len(txns)} transactions retrieved for Ravi Kumar")

        # Verify scam analyses stored
        scams_resp = client.get("/api/scams?userId=usr_ravi_kumar")
        assert scams_resp.status_code == 200
        saved_scams = scams_resp.json()
        assert len(saved_scams) >= 1
        print(f" [PASS] Scam analysis history verified: {len(saved_scams)} records saved in SQLite")

        # Verify safety alerts created
        alerts_resp = client.get("/api/alerts?userId=usr_ravi_kumar")
        assert alerts_resp.status_code == 200
        alerts = alerts_resp.json()
        assert len(alerts) >= 1
        print(f" [PASS] Security alerts verified: {len(alerts)} alerts generated in SQLite")

        # Verify beneficiaries
        bens_resp = client.get("/api/users/usr_ravi_kumar/beneficiaries")
        assert bens_resp.status_code == 200
        bens = bens_resp.json()
        assert len(bens) >= 1
        print(f" [PASS] Beneficiaries list verified: {len(bens)} contacts found")

        # -----------------------------------------------------
        # 7. Safety Controls & Emergency Pause
        # -----------------------------------------------------
        print("\n--- [7] SAFETY CONTROLS & EMERGENCY PAUSE ---")
        # Read safety settings
        safety_get = client.get("/api/safety/usr_ravi_kumar")
        assert safety_get.status_code == 200
        s_data = safety_get.json()
        assert "transactionMonitoring" in s_data or "transaction_monitoring" in s_data
        print(" [PASS] Read safety settings verified")

        # Toggle safety settings
        patch_res = client.patch("/api/safety/usr_ravi_kumar", json={"highRiskVerification": 1, "scamAnalysis": 1})
        assert patch_res.status_code == 200
        print(" [PASS] PATCH /api/safety/usr_ravi_kumar: Updated safety safeguards")

        # Emergency Pause
        pause_res = client.post("/api/safety/usr_ravi_kumar/pause")
        assert pause_res.status_code == 200
        print(" [PASS] 1-Click Emergency Outbound Payment Freeze (/pause)")

        # Resume Safety
        resume_res = client.post("/api/safety/usr_ravi_kumar/resume")
        assert resume_res.status_code == 200
        print(" [PASS] Normal banking safeguards restored (/resume)")

        # -----------------------------------------------------
        # 8. Error Handling & Validation Defenses
        # -----------------------------------------------------
        print("\n--- [8] ERROR HANDLING & EDGE CASES ---")
        # Missing user
        err_user = client.post("/api/analyze-payment", json={"customerId": "usr_nonexistent_9999", "amount": 500, "recipientUpi": "test@upi"})
        assert err_user.status_code == 404
        print(f" [PASS] Missing User handled: HTTP 404 ({err_user.json()['detail']})")

        # Invalid amount <= 0
        err_amt = client.post("/api/analyze-payment", json={"customerId": "usr_ravi_kumar", "amount": -200, "recipientUpi": "test@upi"})
        assert err_amt.status_code == 400
        print(f" [PASS] Negative Amount handled: HTTP 400 ({err_amt.json()['detail']})")

        # Missing recipient
        err_rec = client.post("/api/analyze-payment", json={"customerId": "usr_ravi_kumar", "amount": 2500, "recipientUpi": ""})
        assert err_rec.status_code == 400
        print(f" [PASS] Missing Recipient handled: HTTP 400 ({err_rec.json()['detail']})")

        # Empty scam message
        err_scam = client.post("/api/scams/analyze", json={"message": "   "})
        assert err_scam.status_code == 400
        print(f" [PASS] Empty Scam Message handled: HTTP 400 ({err_scam.json()['detail']})")

        print("\n=========================================================")
        print("SUCCESS: ALL COMPREHENSIVE GUARDIANPAY AI TESTS PASSED!")
        print("=========================================================")

if __name__ == "__main__":
    run_tests()
