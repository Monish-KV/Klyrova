"""
GuardianPay AI - Behavioral ML Risk Feature Pipeline & Anomaly Detector
Implemented using Scikit-learn and Pandas for behavioral anomaly estimation.
"""
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler

class TransactionFeatureExtractor:
    """
    Extracts numerical and categorical feature vectors from real-time transaction telemetry
    for banking anomaly detection.
    """
    FEATURE_COLUMNS = [
        "amount",
        "habitual_ratio",
        "is_known_recipient",
        "is_known_device",
        "transaction_hour",
        "completion_time_seconds",
        "is_senior_or_beginner",
        "has_urgency_keywords",
        "has_credential_keywords",
    ]

    def extract_features(self, telemetry: Dict[str, Any], customer: Dict[str, Any]) -> pd.DataFrame:
        amount = float(telemetry.get("amount", 0.0))
        habitual_max = float(customer.get("habitual_max_amount", 5000.0) or 5000.0)
        habitual_ratio = (amount / habitual_max) if habitual_max > 0 else 1.0

        user_type = str(customer.get("user_type", "")).lower()
        digital_exp = str(customer.get("digital_experience", "")).lower()
        is_senior = 1 if ("senior" in user_type or "beginner" in digital_exp or "inexperienced" in user_type) else 0

        purpose = str(telemetry.get("purpose", "") or telemetry.get("note", "")).lower()
        urgent_kws = ["urgent", "immediately", "asap", "fast", "emergency", "police", "arrest", "block"]
        cred_kws = ["otp", "pin", "cvv", "kyc", "remote", "anydesk", "teamviewer"]

        has_urgency = 1 if any(w in purpose for w in urgent_kws) else 0
        has_cred = 1 if any(w in purpose for w in cred_kws) else 0

        hour = int(telemetry.get("transactionHour", 14) or 14)
        completion_sec = int(telemetry.get("completionTimeSeconds", 35) or 35)

        row = {
            "amount": amount,
            "habitual_ratio": habitual_ratio,
            "is_known_recipient": 1 if telemetry.get("isKnownRecipient", False) else 0,
            "is_known_device": 1 if telemetry.get("isKnownDevice", True) else 0,
            "transaction_hour": hour,
            "completion_time_seconds": completion_sec,
            "is_senior_or_beginner": is_senior,
            "has_urgency_keywords": has_urgency,
            "has_credential_keywords": has_cred,
        }
        return pd.DataFrame([row], columns=self.FEATURE_COLUMNS)

class MLRiskPipeline:
    """
    Scikit-learn Anomaly Detection & ML Risk Scoring Pipeline.
    Supplements the deterministic risk engine with unsupervised behavioral baseline scoring.
    """
    def __init__(self):
        self.extractor = TransactionFeatureExtractor()
        self.scaler = StandardScaler()
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.08,
            random_state=42
        )
        self._is_fitted = False
        self._initialize_baseline_model()

    def _initialize_baseline_model(self):
        """Pre-trains an anomaly detection baseline on synthetic banking behavioral telemetry."""
        np.random.seed(42)
        n_samples = 300
        
        # Normal customer transactions
        normal_amounts = np.random.exponential(scale=2500, size=n_samples) + 200
        habitual_ratios = normal_amounts / 5000.0
        known_recipients = np.random.choice([1, 0], size=n_samples, p=[0.85, 0.15])
        known_devices = np.random.choice([1, 0], size=n_samples, p=[0.95, 0.05])
        hours = np.random.randint(8, 21, size=n_samples)
        completion_times = np.random.normal(loc=40, scale=10, size=n_samples).clip(15, 120)
        seniors = np.random.choice([1, 0], size=n_samples, p=[0.4, 0.6])
        urgency = np.zeros(n_samples)
        cred = np.zeros(n_samples)

        df = pd.DataFrame({
            "amount": normal_amounts,
            "habitual_ratio": habitual_ratios,
            "is_known_recipient": known_recipients,
            "is_known_device": known_devices,
            "transaction_hour": hours,
            "completion_time_seconds": completion_times,
            "is_senior_or_beginner": seniors,
            "has_urgency_keywords": urgency,
            "has_credential_keywords": cred,
        }, columns=TransactionFeatureExtractor.FEATURE_COLUMNS)

        X_scaled = self.scaler.fit_transform(df)
        self.model.fit(X_scaled)
        self._is_fitted = True

    def predict_anomaly(self, telemetry: Dict[str, Any], customer: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs the scikit-learn feature pipeline to estimate anomaly score (0-100)
        and behavioral deviation confidence.
        """
        features_df = self.extractor.extract_features(telemetry, customer)
        X_scaled = self.scaler.transform(features_df)
        
        # Decision function: negative values indicate outliers/anomalies
        raw_score = self.model.decision_function(X_scaled)[0]
        # Normalize into a 0 - 100 anomaly index
        anomaly_score = int(np.clip((0.2 - raw_score) * 200, 5, 98))

        return {
            "ml_anomaly_score": anomaly_score,
            "feature_vector": features_df.to_dict(orient="records")[0],
            "model_type": "Scikit-Learn IsolationForest Anomaly Engine",
            "is_anomaly": bool(self.model.predict(X_scaled)[0] == -1),
        }

ml_pipeline = MLRiskPipeline()
