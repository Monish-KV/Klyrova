from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, Index
from sqlalchemy.orm import relationship as sa_relationship
from backend.app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    customer_id = Column(String, unique=True, nullable=False, index=True)
    user_type = Column(String, nullable=False, default="Digitally Inexperienced")
    digital_experience = Column(String, nullable=False, default="Beginner")
    protection_level = Column(String, nullable=False, default="Enhanced")
    phone = Column(String, nullable=True)
    account_number = Column(String, nullable=True)
    upi_id = Column(String, nullable=True)
    balance = Column(Float, nullable=False, default=0.0)
    habitual_max_amount = Column(Float, nullable=False, default=5000.0)
    registered_device = Column(String, nullable=True)
    registered_ip = Column(String, nullable=True)
    created_at = Column(String, nullable=False)

    transactions = sa_relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    beneficiaries = sa_relationship("Beneficiary", back_populates="user", cascade="all, delete-orphan")
    alerts = sa_relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    safety_settings = sa_relationship("SafetySetting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    scams = sa_relationship("ScamAnalysis", back_populates="user")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient = Column(String, nullable=False)
    recipient_upi = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    purpose = Column(Text, nullable=True)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String, nullable=False)
    recommended_action = Column(String, nullable=False)
    status = Column(String, nullable=False)
    device = Column(String, nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(String, nullable=False)

    user = sa_relationship("User", back_populates="transactions")
    signals = sa_relationship("TransactionRiskSignal", back_populates="transaction", cascade="all, delete-orphan")

class TransactionRiskSignal(Base):
    __tablename__ = "transaction_risk_signals"

    id = Column(String, primary_key=True, index=True)
    transaction_id = Column(String, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(String, nullable=False)
    points = Column(Integer, nullable=False)

    transaction = sa_relationship("Transaction", back_populates="signals")

class ScamAnalysis(Base):
    __tablename__ = "scam_analyses"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    message = Column(Text, nullable=False)
    score = Column(Integer, nullable=False)
    risk_level = Column(String, nullable=False)
    categories = Column(Text, nullable=False)  # JSON string
    reasons = Column(Text, nullable=False)     # JSON string
    recommended_action = Column(String, nullable=False)
    source = Column(String, nullable=False)
    created_at = Column(String, nullable=False)

    user = sa_relationship("User", back_populates="scams")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, nullable=False)
    related_transaction_id = Column(String, nullable=True)
    related_scam_id = Column(String, nullable=True)
    read = Column(Integer, nullable=False, default=0)
    created_at = Column(String, nullable=False)

    user = sa_relationship("User", back_populates="alerts")

class SafetySetting(Base):
    __tablename__ = "safety_settings"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    transaction_monitoring = Column(Integer, nullable=False, default=1)
    scam_analysis = Column(Integer, nullable=False, default=1)
    high_risk_verification = Column(Integer, nullable=False, default=1)
    updated_at = Column(String, nullable=False)

    user = sa_relationship("User", back_populates="safety_settings")

class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    upi_id = Column(String, nullable=False)
    account_number = Column(String, nullable=True)
    relationship = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    is_trusted = Column(Integer, nullable=False, default=1)
    created_at = Column(String, nullable=False)

    user = sa_relationship("User", back_populates="beneficiaries")

Index("idx_transactions_user_id", Transaction.user_id)
Index("idx_signals_transaction_id", TransactionRiskSignal.transaction_id)
Index("idx_alerts_user_id", Alert.user_id)
Index("idx_beneficiaries_user_id", Beneficiary.user_id)
