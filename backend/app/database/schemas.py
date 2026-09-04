from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

# Base configuration for Pydantic models
class SchemaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# ----------------- Customer / User Schemas -----------------
class CustomerResponse(SchemaBase):
    id: str
    customerId: Optional[str] = None
    customer_id: Optional[str] = None
    name: str
    email: Optional[str] = None
    age: int = 45
    persona: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    accountNumber: Optional[str] = None
    account_number: Optional[str] = None
    upiId: Optional[str] = None
    upi_id: Optional[str] = None
    balance: float = 0.0
    habitualMaxAmount: float = 5000.0
    habitual_max_amount: Optional[float] = None
    safetyStatus: str = "PROTECTED"
    activeHours: Dict[str, int] = Field(default_factory=lambda: {"start": 7, "end": 21})
    registeredDevice: Optional[str] = None
    registered_device: Optional[str] = None
    registeredIp: Optional[str] = None
    registered_ip: Optional[str] = None
    hasRecentScamLink: bool = False
    userType: Optional[str] = None
    user_type: Optional[str] = None
    digitalExperience: Optional[str] = None
    digital_experience: Optional[str] = None
    protectionLevel: Optional[str] = None
    protection_level: Optional[str] = None

class UpdateProfileRequest(SchemaBase):
    userType: Optional[str] = None
    user_type: Optional[str] = None
    digitalExperience: Optional[str] = None
    digital_experience: Optional[str] = None
    protectionLevel: Optional[str] = None
    protection_level: Optional[str] = None
    habitualMaxAmount: Optional[float] = None
    habitual_max_amount: Optional[float] = None
    balance: Optional[float] = None

# ----------------- Beneficiary Schemas -----------------
class BeneficiaryResponse(SchemaBase):
    id: str
    userId: Optional[str] = None
    user_id: Optional[str] = None
    customerId: Optional[str] = None
    name: str
    upiId: Optional[str] = None
    upi_id: Optional[str] = None
    accountNumber: Optional[str] = None
    account_number: Optional[str] = None
    relationship: Optional[str] = None
    avatar: Optional[str] = None
    isTrusted: bool = True
    is_trusted: Optional[int] = 1
    addedDate: Optional[str] = None
    created_at: Optional[str] = None

class AddBeneficiaryRequest(SchemaBase):
    name: str
    upiId: Optional[str] = None
    upi_id: Optional[str] = None
    accountNumber: Optional[str] = None
    account_number: Optional[str] = None
    relationship: Optional[str] = "Trusted Contact"
    avatar: Optional[str] = None

# ----------------- Risk & Transaction Schemas -----------------
class RiskSignalSchema(SchemaBase):
    reason: str
    points: int

class RiskFactorSchema(SchemaBase):
    id: str
    name: str
    score: int
    maxScore: int = 30
    triggered: bool
    description: str
    severity: str

class TelemetryPayloadRequest(SchemaBase):
    customerId: Optional[str] = None
    userId: Optional[str] = None
    recipientName: Optional[str] = None
    recipient: Optional[str] = None
    recipientUpi: Optional[str] = None
    recipient_upi: Optional[str] = None
    amount: float
    note: Optional[str] = None
    purpose: Optional[str] = None
    deviceFingerprint: Optional[str] = None
    device: Optional[str] = None
    location: Optional[str] = "Local Session"
    isKnownDevice: Optional[bool] = True
    transactionHour: Optional[int] = None
    completionTimeSeconds: Optional[int] = None
    hasRecentScamAlert: Optional[bool] = False

class AnalyzeTransactionRequest(SchemaBase):
    userId: str
    recipient: Optional[str] = None
    recipientUpi: str
    amount: float
    purpose: Optional[str] = ""
    device: Optional[str] = "Standard Web Client"
    location: Optional[str] = "Local Session"
    isKnownDevice: Optional[bool] = True
    transactionHour: Optional[int] = None
    completionTimeSeconds: Optional[int] = None

class RiskAnalysisResultResponse(SchemaBase):
    totalScore: int
    tier: str
    action: str
    status: str
    transactionId: str
    factors: List[RiskFactorSchema] = []
    explanation: str
    requiresIntervention: bool
    reasons: List[str] = []
    signals: List[RiskSignalSchema] = []
    protectionLevel: str

class TransactionAnalyzeResponse(SchemaBase):
    transactionId: str
    riskScore: int
    riskLevel: str
    recommendedAction: str
    status: str
    reasons: List[str] = []
    signals: List[RiskSignalSchema] = []
    protectionLevel: str

class ConfirmTransactionRequest(SchemaBase):
    pinEntered: Optional[bool] = False
    verifiedLegitimate: Optional[bool] = False

class ResolveTransactionRequest(SchemaBase):
    decision: str  # 'APPROVE' | 'BLOCK' | 'HOLD'

class InterventionRequest(SchemaBase):
    customerId: str
    transactionData: Dict[str, Any]
    manipulationAnswer: str  # 'YES' | 'NO' | 'NOT_SURE'

class InterventionResponse(SchemaBase):
    outcome: str
    headline: str
    message: str
    guidance: Optional[List[str]] = None
    transactionId: Optional[str] = None

class TransactionResponse(SchemaBase):
    id: str
    userId: Optional[str] = None
    user_id: Optional[str] = None
    customerId: Optional[str] = None
    userName: Optional[str] = None
    user_name: Optional[str] = None
    recipient: Optional[str] = None
    recipientName: Optional[str] = None
    recipientUpi: Optional[str] = None
    recipient_upi: Optional[str] = None
    amount: float
    purpose: Optional[str] = None
    riskScore: Optional[int] = None
    risk_score: Optional[int] = None
    riskTier: Optional[str] = None
    risk_level: Optional[str] = None
    recommendedAction: Optional[str] = None
    recommended_action: Optional[str] = None
    actionTaken: Optional[str] = None
    status: str
    device: Optional[str] = None
    location: Optional[str] = None
    created_at: Optional[str] = None
    timestamp: Optional[str] = None
    signals: List[RiskSignalSchema] = []

# ----------------- Scam Analysis Schemas -----------------
class ScamAnalyzeRequest(SchemaBase):
    userId: Optional[str] = None
    customerId: Optional[str] = None
    message: Optional[str] = None
    messageText: Optional[str] = None

class ThreatIndicatorsSchema(SchemaBase):
    hasUrgencyTactics: bool
    hasSuspiciousLinks: bool
    hasImpersonation: bool
    requestsRemoteAccess: bool
    requestsCredentialsOrOtp: bool

class ScamAssessmentResponse(SchemaBase):
    id: str
    rawText: str
    timestamp: str
    riskScore: int
    riskLevel: str
    source: str
    scamType: str
    summary: str
    warningSigns: List[str]
    actionAdvice: List[str]
    threatIndicators: ThreatIndicatorsSchema

class ScamHistoryResponse(SchemaBase):
    id: str
    userId: Optional[str] = None
    user_id: Optional[str] = None
    message: str
    score: int
    riskLevel: str
    risk_level: Optional[str] = None
    categories: List[str] = []
    reasons: List[str] = []
    recommendedAction: str
    recommended_action: Optional[str] = None
    source: str
    createdAt: str
    created_at: Optional[str] = None

# ----------------- Alert Schemas -----------------
class AlertResponse(SchemaBase):
    id: str
    user_id: Optional[str] = None
    type: str
    title: str
    message: str
    severity: str
    related_transaction_id: Optional[str] = None
    related_scam_id: Optional[str] = None
    read: int
    created_at: str

# ----------------- Safety Settings Schemas -----------------
class SafetySettingsResponse(SchemaBase):
    transactionMonitoring: bool
    scamAnalysis: bool
    highRiskVerification: bool
    updatedAt: str

class UpdateSafetySettingsRequest(SchemaBase):
    transactionMonitoring: Optional[bool] = None
    scamAnalysis: Optional[bool] = None
    highRiskVerification: Optional[bool] = None

# ----------------- Dashboard Schemas -----------------
class DashboardStatsResponse(SchemaBase):
    totalTransactions: int
    totalVolume: float
    highRiskTransactions: int
    transactionsHeld: int
    amountHeld: float
    amountProtected: float
    scamsDetected: int
    riskDistribution: List[Dict[str, Any]] = []
    recentTransactions: List[Any] = []
    recentAlerts: List[Any] = []

class AdminDashboardStatsResponse(SchemaBase):
    transactionsAnalyzed: int
    totalMonitoredVolume: float
    highRiskTransactions: int
    transactionsHeld: int
    transactionsBlocked: int
    scamsDetected: int
    criticalScamsDetected: int
    customersProtected: int
    seniorAccountsProtected: int
    amountProtected: float
    protectionRate: float
    riskDistribution: List[Dict[str, Any]] = []
    recentHighRiskEvents: List[Any] = []
