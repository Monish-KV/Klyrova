export type RiskTier = 'LOW' | 'WARN' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InterventionAction = 'ALLOW' | 'WARN' | 'VERIFY' | 'HOLD' | 'HOLD & VERIFY';
export type TransactionStatus = 'ALLOWED' | 'WARNED' | 'VERIFICATION REQUIRED' | 'HELD' | 'COMPLETED' | 'BLOCKED' | 'FLAGGED';

export interface Customer {
  id: string;
  customerId?: string;
  name: string;
  age: number;
  persona: string;
  avatar: string;
  phone: string;
  accountNumber: string;
  upiId: string;
  balance: number;
  habitualMaxAmount: number;
  safetyStatus: 'PROTECTED' | 'AT_RISK' | 'HOLD_ACTIVE';
  activeHours: { start: number; end: number };
  registeredDevice: string;
  registeredIp: string;
  hasRecentScamLink: boolean;
  userType?: string;
  digitalExperience?: string;
  protectionLevel?: 'Standard' | 'Enhanced' | 'Strong' | string;
}

export interface Beneficiary {
  id: string;
  customerId?: string;
  userId?: string;
  name: string;
  upiId: string;
  accountNumber: string;
  isTrusted: boolean;
  relationship: string;
  avatar: string;
  addedDate?: string;
  createdAt?: string;
  lastTransferDate?: string;
}

export interface RiskFactor {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  triggered: boolean;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface TelemetryPayload {
  customerId: string;
  userId?: string;
  recipientName: string;
  recipientUpi: string;
  amount: number;
  deviceFingerprint: string;
  isKnownDevice?: boolean;
  transactionHour?: number;
  completionTimeSeconds?: number;
  hasRecentScamAlert?: boolean;
  note?: string;
  purpose?: string;
}

export interface RiskAnalysisResult {
  totalScore: number;
  tier: RiskTier;
  action: InterventionAction;
  status?: TransactionStatus;
  transactionId?: string;
  factors: RiskFactor[];
  explanation: string;
  requiresIntervention: boolean;
  reasons?: string[];
  signals?: { reason: string; points: number }[];
  protectionLevel?: string;
  telemetryBreakdown?: {
    amountAnomaly: boolean;
    unfamiliarBeneficiary: boolean;
    unrecognizedDevice: boolean;
    temporalAnomaly: boolean;
    highVelocityHaste: boolean;
    threatLink: boolean;
  };
}

export interface TransactionRecord {
  id: string;
  customerId?: string;
  user_id?: string;
  customerName?: string;
  user_name?: string;
  recipientName?: string;
  recipient?: string;
  recipientUpi?: string;
  recipient_upi?: string;
  amount: number;
  timestamp?: string;
  created_at?: string;
  status: TransactionStatus;
  riskScore?: number;
  risk_score?: number;
  riskTier?: RiskTier;
  risk_level?: RiskTier;
  riskFactors?: string[];
  actionTaken?: InterventionAction;
  recommended_action?: InterventionAction;
  holdReason?: string;
  purpose?: string;
  device?: string;
  location?: string;
  resolution?: 'APPROVED' | 'CANCELLED_BY_USER' | 'BLOCKED_BY_BANK' | 'PENDING';
  resolvedAt?: string;
  signals?: { reason: string; points: number }[];
  telemetry?: {
    device: string;
    isRecognizedDevice: boolean;
    time: string;
    isOutsideActiveHours: boolean;
    velocityTimeSeconds: number;
    isUnusualVelocity: boolean;
    isUnfamiliarBeneficiary: boolean;
    isAmountAnomaly: boolean;
    recentScamLinked: boolean;
  };
}

export interface ScamAssessmentResult {
  id: string;
  rawText: string;
  timestamp: string;
  riskScore: number;
  riskLevel: RiskTier;
  source: 'GEMINI_AI' | 'LOCAL_HEURISTIC_ENGINE' | 'LOCAL_RULE_ENGINE';
  scamType: string;
  summary: string;
  warningSigns: string[];
  actionAdvice: string[];
  threatIndicators: {
    hasUrgencyTactics: boolean;
    hasSuspiciousLinks: boolean;
    hasImpersonation: boolean;
    requestsRemoteAccess: boolean;
    requestsCredentialsOrOtp: boolean;
  };
}

export interface AlertRecord {
  id: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  related_transaction_id?: string | null;
  related_scam_id?: string | null;
  read: number;
  created_at: string;
}

export interface SafetySettings {
  transactionMonitoring: boolean;
  scamAnalysis: boolean;
  highRiskVerification: boolean;
  updatedAt: string;
}

export interface DashboardStats {
  totalTransactions: number;
  totalVolume: number;
  highRiskTransactions: number;
  transactionsHeld: number;
  amountHeld: number;
  amountProtected: number;
  scamsDetected: number;
  riskDistribution: { risk_level: string; count: number }[];
  recentTransactions: any[];
  recentAlerts: AlertRecord[];
}

export interface AdminDashboardStats {
  transactionsAnalyzed: number;
  totalMonitoredVolume: number;
  highRiskTransactions: number;
  transactionsHeld: number;
  transactionsBlocked: number;
  scamsDetected: number;
  criticalScamsDetected: number;
  customersProtected: number;
  seniorAccountsProtected: number;
  amountProtected: number;
  protectionRate: number;
  riskDistribution: { risk_level: string; count: number }[];
  recentHighRiskEvents: any[];
}

export interface BankMetrics {
  preventedFraudAmount: number;
  totalMonitoredAmount: number;
  activeHoldsCount: number;
  scamsAnalyzedCount: number;
  protectionRate: number;
  seniorAccountsProtected: number;
  totalTransactionsProcessed: number;
}

export interface DemoScenario {
  id: string;
  title: string;
  tag: string;
  customerId: string;
  customerName: string;
  recipientName: string;
  recipientUpi: string;
  amount: number;
  description: string;
  judgeNarrative: string;
  expectedScore: number;
  expectedTier: RiskTier;
  expectedAction: InterventionAction;
  telemetry: {
    isKnownDevice: boolean;
    transactionHour: number;
    completionTimeSeconds: number;
    hasRecentScamAlert: boolean;
  };
}
