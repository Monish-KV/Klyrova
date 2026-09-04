export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InterventionAction = 'ALLOW' | 'WARN' | 'VERIFY' | 'HOLD & VERIFY';
export type TransactionStatus = 'COMPLETED' | 'HELD' | 'BLOCKED' | 'FLAGGED';

export interface Customer {
  id: string;
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
}

export interface Beneficiary {
  id: string;
  customerId: string;
  name: string;
  upiId: string;
  accountNumber: string;
  isTrusted: boolean;
  relationship: string;
  avatar: string;
  addedDate: string;
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
  recipientName: string;
  recipientUpi: string;
  amount: number;
  deviceFingerprint: string;
  isKnownDevice?: boolean;
  transactionHour?: number;
  completionTimeSeconds?: number;
  hasRecentScamAlert?: boolean;
  note?: string;
}

export interface RiskAnalysisResult {
  totalScore: number;
  tier: RiskTier;
  action: InterventionAction;
  factors: RiskFactor[];
  explanation: string;
  requiresIntervention: boolean;
  telemetryBreakdown: {
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
  customerId: string;
  customerName: string;
  recipientName: string;
  recipientUpi: string;
  amount: number;
  timestamp: string;
  status: TransactionStatus;
  riskScore: number;
  riskTier: RiskTier;
  riskFactors: string[];
  actionTaken: InterventionAction;
  holdReason?: string;
  resolution?: 'APPROVED' | 'CANCELLED_BY_USER' | 'BLOCKED_BY_BANK' | 'PENDING';
  resolvedAt?: string;
  telemetry: {
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
  source: 'GEMINI_AI' | 'LOCAL_RULE_ENGINE';
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
