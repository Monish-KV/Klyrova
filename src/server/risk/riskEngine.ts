export interface RiskSignal {
  reason: string;
  points: number;
}

export interface RiskEvaluationInput {
  amount: number;
  recipient: string;
  recipientUpi: string;
  purpose?: string;
  device?: string;
  location?: string;
  isKnownRecipient: boolean;
  isKnownDevice?: boolean;
  transactionHour?: number;
  completionTimeSeconds?: number;
  customer: {
    id: string;
    name: string;
    habitualMaxAmount: number;
    userType: string;
    digitalExperience: string;
    protectionLevel: 'Standard' | 'Enhanced' | 'Strong' | string;
    registeredDevice?: string;
  };
}

export interface RiskEvaluationOutput {
  riskScore: number;
  riskLevel: 'LOW' | 'WARN' | 'VERIFY' | 'HIGH' | 'CRITICAL';
  recommendedAction: 'ALLOW' | 'WARN' | 'VERIFY' | 'HOLD';
  status: 'ALLOWED' | 'WARNED' | 'VERIFICATION REQUIRED' | 'HELD';
  signals: RiskSignal[];
  protectionLevel: string;
  reasons: string[];
}

export function evaluateTransactionRisk(input: RiskEvaluationInput): RiskEvaluationOutput {
  const {
    amount,
    recipient,
    recipientUpi,
    purpose = '',
    device,
    isKnownRecipient,
    isKnownDevice = true,
    transactionHour,
    completionTimeSeconds,
    customer,
  } = input;

  let score = 0;
  const signals: RiskSignal[] = [];

  // 1. Base risk baseline (10 points)
  score += 10;
  signals.push({ reason: 'Baseline transaction telemetry check', points: 10 });

  // 2. Amount Rules (tiered)
  if (amount >= 50000) {
    score += 30;
    signals.push({ reason: `High value transfer (₹${amount.toLocaleString('en-IN')} >= ₹50,000)`, points: 30 });
  } else if (amount >= 25000) {
    score += 25;
    signals.push({ reason: `Substantial transfer amount (₹${amount.toLocaleString('en-IN')} >= ₹25,000)`, points: 25 });
  } else if (amount >= 10000) {
    score += 20;
    signals.push({ reason: `Elevated transfer amount (₹${amount.toLocaleString('en-IN')} >= ₹10,000)`, points: 20 });
  } else if (amount >= 5000) {
    score += 10;
    signals.push({ reason: `Moderate transfer amount (₹${amount.toLocaleString('en-IN')} >= ₹5,000)`, points: 10 });
  }

  // Habitual amount deviation
  if (customer.habitualMaxAmount && amount > customer.habitualMaxAmount * 2) {
    score += 10;
    signals.push({
      reason: `Amount ₹${amount.toLocaleString('en-IN')} exceeds habitual threshold (₹${customer.habitualMaxAmount.toLocaleString('en-IN')}) by >2x`,
      points: 10,
    });
  }

  // 3. New/Unfamiliar Recipient (+20)
  if (!isKnownRecipient) {
    score += 20;
    signals.push({
      reason: `Unfamiliar/unverified recipient (${recipientUpi}) not in trusted directory`,
      points: 20,
    });
  }

  // 4. Urgent Language in Purpose (+10)
  const purposeText = purpose.toLowerCase();
  const urgentKeywords = [
    'urgent',
    'immediately',
    'asap',
    'fast',
    'quick',
    'emergency',
    'hurry',
    'police',
    'arrest',
    'power cut',
    'bill due',
    'disconnection',
    'block',
    'penalty',
  ];
  const hasUrgentKeyword = urgentKeywords.some((kw) => purposeText.includes(kw));
  if (hasUrgentKeyword) {
    score += 10;
    signals.push({
      reason: 'Urgency coercion keywords detected in transaction purpose/note',
      points: 10,
    });
  }

  // 5. OTP / PIN / Password / CVV / Verification request (+15)
  const credentialKeywords = [
    'otp',
    'pin',
    'cvv',
    'password',
    'verification',
    'kyc',
    'code',
    'remote',
    'anydesk',
    'teamviewer',
    'quicksupport',
  ];
  const hasCredentialKeyword = credentialKeywords.some((kw) => purposeText.includes(kw));
  if (hasCredentialKeyword) {
    score += 15;
    signals.push({
      reason: 'Credential, verification, or remote-access keywords identified in purpose',
      points: 15,
    });
  }

  // 6. Large Payment + New Recipient combined vector (+10)
  if (!isKnownRecipient && amount >= 25000) {
    score += 10;
    signals.push({
      reason: 'Combined risk vector: High-value payment to a newly introduced recipient',
      points: 10,
    });
  }

  // 7. Behavioral Device & Environmental Telemetry
  if (!isKnownDevice || (device && customer.registeredDevice && !device.includes('Galaxy') && !customer.registeredDevice.includes(device))) {
    score += 15;
    signals.push({
      reason: `Unrecognized device fingerprint (${device || 'Unknown Hardware'})`,
      points: 15,
    });
  }

  // Temporal analysis (Off-hours 22:00 - 06:00)
  const hour = transactionHour !== undefined ? transactionHour : new Date().getHours();
  if (hour >= 22 || hour < 6) {
    score += 10;
    signals.push({
      reason: `Off-hours transaction timing (${hour}:00, outside regular daylight banking hours)`,
      points: 10,
    });
  }

  // Behavioral Haste / Velocity (panic checkout < 15 seconds)
  if (completionTimeSeconds !== undefined && completionTimeSeconds < 15) {
    score += 10;
    signals.push({
      reason: `High behavioral haste (${completionTimeSeconds}s completion, characteristic of coercive phone coaching)`,
      points: 10,
    });
  }

  // 8. Customer Vulnerability & Protection Profile Adjustment
  const protectionLevelNorm = (customer.protectionLevel || 'Standard').toUpperCase();
  const isSeniorOrBeginner =
    customer.digitalExperience?.toLowerCase() === 'beginner' ||
    customer.userType?.toLowerCase().includes('senior') ||
    customer.userType?.toLowerCase().includes('inexperienced');

  if (protectionLevelNorm === 'STRONG') {
    if (!isKnownRecipient || amount >= 10000) {
      score += 15;
      signals.push({
        reason: 'Strong Protection Profile: Heightened defensive weighting applied for vulnerable account',
        points: 15,
      });
    }
  } else if (protectionLevelNorm === 'ENHANCED' || isSeniorOrBeginner) {
    if (!isKnownRecipient || amount >= 10000 || hasUrgentKeyword) {
      score += 10;
      signals.push({
        reason: 'Enhanced Protection Profile: Senior/beginner safety sensitivity adjustment (+10 pts)',
        points: 10,
      });
    }
  }

  // Cap score at 100
  score = Math.min(100, Math.max(0, score));

  // Determine Risk Level, Decision, and Status
  let riskLevel: 'LOW' | 'WARN' | 'VERIFY' | 'HIGH' | 'CRITICAL';
  let recommendedAction: 'ALLOW' | 'WARN' | 'VERIFY' | 'HOLD';
  let status: 'ALLOWED' | 'WARNED' | 'VERIFICATION REQUIRED' | 'HELD';

  if (score >= 90) {
    riskLevel = 'CRITICAL';
    recommendedAction = 'HOLD';
    status = 'HELD';
  } else if (score >= 75) {
    riskLevel = 'HIGH';
    recommendedAction = 'HOLD';
    status = 'HELD';
  } else if (score >= 45) {
    riskLevel = 'VERIFY';
    recommendedAction = 'VERIFY';
    status = 'VERIFICATION REQUIRED';
  } else if (score >= 25) {
    riskLevel = 'WARN';
    recommendedAction = 'WARN';
    status = 'WARNED';
  } else {
    riskLevel = 'LOW';
    recommendedAction = 'ALLOW';
    status = 'ALLOWED';
  }

  const reasons = signals.map((s) => s.reason);

  return {
    riskScore: score,
    riskLevel,
    recommendedAction,
    status,
    signals,
    protectionLevel: customer.protectionLevel || 'Standard',
    reasons,
  };
}
