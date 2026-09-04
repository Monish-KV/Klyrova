import { query, queryOne, run } from '../database/db';
import { evaluateTransactionRisk, RiskSignal } from '../risk/riskEngine';

export interface AnalyzeTransactionInput {
  userId: string;
  recipient: string;
  recipientUpi: string;
  amount: number;
  purpose?: string;
  device?: string;
  location?: string;
  isKnownDevice?: boolean;
  transactionHour?: number;
  completionTimeSeconds?: number;
}

export async function analyzeTransaction(input: AnalyzeTransactionInput) {
  const {
    userId,
    recipient,
    recipientUpi,
    amount,
    purpose = '',
    device = 'Standard Web Client',
    location = 'Local Session',
    isKnownDevice = true,
    transactionHour,
    completionTimeSeconds,
  } = input;

  if (!userId || !recipientUpi || !amount || amount <= 0) {
    throw new Error('Missing required transaction parameters (userId, recipientUpi, positive amount).');
  }

  // 1. Fetch user from SQLite
  const user = await queryOne(
    `SELECT * FROM users WHERE id = ? OR customer_id = ? LIMIT 1`,
    [userId, userId]
  );

  if (!user) {
    throw new Error(`Customer profile with ID '${userId}' not found in database.`);
  }

  // 2. Fetch safety settings
  const safety = await queryOne(
    `SELECT * FROM safety_settings WHERE user_id = ? LIMIT 1`,
    [user.id]
  );

  // 3. Check if recipient is in trusted beneficiaries directory
  const trustedBeneficiary = await queryOne(
    `SELECT * FROM beneficiaries WHERE user_id = ? AND (upi_id = ? OR name LIKE ?) LIMIT 1`,
    [user.id, recipientUpi, `%${recipient}%`]
  );

  const isKnownRecipient = !!trustedBeneficiary;

  // 4. Run authoritative Risk Engine
  const riskResult = evaluateTransactionRisk({
    amount,
    recipient,
    recipientUpi,
    purpose,
    device,
    location,
    isKnownRecipient,
    isKnownDevice,
    transactionHour,
    completionTimeSeconds,
    customer: {
      id: user.id,
      name: user.name,
      habitualMaxAmount: user.habitual_max_amount,
      userType: user.user_type,
      digitalExperience: user.digital_experience,
      protectionLevel: user.protection_level,
      registeredDevice: user.registered_device,
    },
  });

  // 5. Persist Transaction to SQLite
  const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  await run(
    `INSERT INTO transactions (id, user_id, recipient, recipient_upi, amount, purpose, risk_score, risk_level, recommended_action, status, device, location, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transactionId,
      user.id,
      recipient || recipientUpi,
      recipientUpi,
      amount,
      purpose,
      riskResult.riskScore,
      riskResult.riskLevel,
      riskResult.recommendedAction,
      riskResult.status,
      device,
      location,
      now,
    ]
  );

  // 6. Persist Risk Signals to SQLite
  let signalIndex = 1;
  for (const signal of riskResult.signals) {
    const signalId = `SIG-${transactionId}-${signalIndex++}`;
    await run(
      `INSERT INTO transaction_risk_signals (id, transaction_id, reason, points)
       VALUES (?, ?, ?, ?)`,
      [signalId, transactionId, signal.reason, signal.points]
    );
  }

  // 7. Generate Alert if elevated risk
  if (riskResult.riskLevel === 'CRITICAL' || riskResult.riskLevel === 'HIGH') {
    const alertId = `ALT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const alertTitle =
      riskResult.status === 'HELD'
        ? `Protective Hold Placed on ₹${amount.toLocaleString('en-IN')}`
        : `High-Risk Transaction Flagged (₹${amount.toLocaleString('en-IN')})`;

    const alertMessage = `GuardianPay AI intervened on transfer to ${recipient} (${recipientUpi}) due to: ${riskResult.reasons.slice(0, 2).join('; ')}.`;

    await run(
      `INSERT INTO alerts (id, user_id, type, title, message, severity, related_transaction_id, related_scam_id, read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alertId,
        user.id,
        riskResult.status === 'HELD' ? 'TRANSACTION_HELD' : 'HIGH_RISK_TRANSACTION',
        alertTitle,
        alertMessage,
        riskResult.riskLevel,
        transactionId,
        null,
        0,
        now,
      ]
    );
  } else if (riskResult.riskLevel === 'VERIFY') {
    const alertId = `ALT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    await run(
      `INSERT INTO alerts (id, user_id, type, title, message, severity, related_transaction_id, related_scam_id, read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alertId,
        user.id,
        'VERIFICATION_REQUIRED',
        `Verification Required for ₹${amount.toLocaleString('en-IN')}`,
        `Payment to ${recipient} flagged for additional confirmation.`,
        'MEDIUM',
        transactionId,
        null,
        0,
        now,
      ]
    );
  }

  const result = {
    transactionId,
    riskScore: riskResult.riskScore,
    totalScore: riskResult.riskScore,
    riskLevel: riskResult.riskLevel,
    tier: riskResult.riskLevel,
    recommendedAction: riskResult.recommendedAction,
    action: riskResult.recommendedAction,
    status: riskResult.status,
    reasons: riskResult.reasons,
    signals: riskResult.signals,
    protectionLevel: riskResult.protectionLevel,
  };

  return result;
}

export async function analyzePayment(telemetry: any) {
  const customerId = telemetry.customerId || telemetry.userId;
  const recipient = telemetry.recipientName || telemetry.recipient || telemetry.recipientUpi;
  const recipientUpi = telemetry.recipientUpi;
  const amount = Number(telemetry.amount) || 0;
  const purpose = telemetry.note || telemetry.purpose || '';
  const device = telemetry.deviceFingerprint || telemetry.device || 'Mobile App Client';
  const isKnownDevice = telemetry.isKnownDevice !== undefined ? telemetry.isKnownDevice : true;
  const transactionHour = telemetry.transactionHour !== undefined ? telemetry.transactionHour : new Date().getHours();
  const completionTimeSeconds = telemetry.completionTimeSeconds !== undefined ? telemetry.completionTimeSeconds : 35;

  const analysis = await analyzeTransaction({
    userId: customerId,
    recipient,
    recipientUpi,
    amount,
    purpose,
    device,
    isKnownDevice,
    transactionHour,
    completionTimeSeconds,
  });

  const user = await queryOne(`SELECT * FROM users WHERE id = ? OR customer_id = ? LIMIT 1`, [customerId, customerId]);
  const habitualMax = user ? user.habitual_max_amount : 5000;

  // Build granular factors matching RiskFactor interface
  const factors = [
    {
      id: 'habitual',
      name: 'Habitual Amount Deviation',
      score: amount > habitualMax * 2 ? 25 : amount > habitualMax ? 15 : 0,
      maxScore: 25,
      triggered: amount > habitualMax,
      description: amount > habitualMax
        ? `₹${amount.toLocaleString('en-IN')} exceeds habitual limit of ₹${habitualMax.toLocaleString('en-IN')}`
        : `Within typical spending baseline (₹${habitualMax.toLocaleString('en-IN')})`,
      severity: (amount > habitualMax * 2 ? 'HIGH' : amount > habitualMax ? 'MEDIUM' : 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
    },
    {
      id: 'recipient',
      name: 'Beneficiary Trust Standing',
      score: analysis.signals.some(s => s.reason.toLowerCase().includes('unfamiliar') || s.reason.toLowerCase().includes('first-time')) ? 20 : 0,
      maxScore: 20,
      triggered: analysis.signals.some(s => s.reason.toLowerCase().includes('unfamiliar') || s.reason.toLowerCase().includes('first-time')),
      description: analysis.signals.some(s => s.reason.toLowerCase().includes('unfamiliar'))
        ? 'First-time recipient not saved in trusted directory'
        : 'Recognized or verified beneficiary',
      severity: (analysis.signals.some(s => s.reason.toLowerCase().includes('unfamiliar')) ? 'HIGH' : 'LOW') as 'HIGH' | 'LOW',
    },
    {
      id: 'device',
      name: 'Hardware Fingerprint Verification',
      score: !isKnownDevice ? 15 : 0,
      maxScore: 15,
      triggered: !isKnownDevice,
      description: !isKnownDevice ? 'Unrecognized device session' : 'Registered customer hardware verified',
      severity: (!isKnownDevice ? 'HIGH' : 'LOW') as 'HIGH' | 'LOW',
    },
    {
      id: 'haste',
      name: 'Behavioral Urgency & Coercion',
      score: completionTimeSeconds < 20 || analysis.signals.some(s => s.reason.toLowerCase().includes('coercive') || s.reason.toLowerCase().includes('urgent')) ? 15 : 0,
      maxScore: 15,
      triggered: completionTimeSeconds < 20 || analysis.signals.some(s => s.reason.toLowerCase().includes('coercive') || s.reason.toLowerCase().includes('urgent')),
      description: completionTimeSeconds < 20
        ? `Abnormal velocity (${completionTimeSeconds}s entry indicative of phone coercion)`
        : 'Standard deliberate transaction pacing',
      severity: (completionTimeSeconds < 20 ? 'HIGH' : 'LOW') as 'HIGH' | 'LOW',
    },
  ];

  let explanation = '';
  if (analysis.riskLevel === 'CRITICAL' || analysis.recommendedAction === 'HOLD') {
    explanation = `Critical risk signals detected (${analysis.riskScore}/100). Protective hold instituted to prevent unauthorized drain. Funds remain safely in your account.`;
  } else if (analysis.riskLevel === 'HIGH' || analysis.recommendedAction === 'VERIFY') {
    explanation = `Elevated risk score of ${analysis.riskScore}/100 detected. Multiple factors require conscious verification before proceeding.`;
  } else if (analysis.riskLevel === 'WARN' || analysis.riskLevel === 'MEDIUM') {
    explanation = `This payment is higher than your usual amount. You normally send around ₹${habitualMax.toLocaleString('en-IN')}, but this payment is ₹${amount.toLocaleString('en-IN')}. Do you want to continue?`;
  } else {
    explanation = `Transaction meets baseline safety requirements with low risk score of ${analysis.riskScore}/100.`;
  }

  return {
    totalScore: analysis.riskScore,
    riskScore: analysis.riskScore,
    tier: analysis.riskLevel,
    riskLevel: analysis.riskLevel,
    action: analysis.recommendedAction,
    recommendedAction: analysis.recommendedAction,
    status: analysis.status,
    transactionId: analysis.transactionId,
    factors,
    explanation,
    requiresIntervention: analysis.recommendedAction === 'HOLD' || analysis.recommendedAction === 'VERIFY',
    reasons: analysis.reasons,
    signals: analysis.signals,
    protectionLevel: analysis.protectionLevel,
    telemetryBreakdown: {
      amountAnomaly: amount > habitualMax,
      unfamiliarBeneficiary: analysis.signals.some(s => s.reason.toLowerCase().includes('unfamiliar')),
      unrecognizedDevice: !isKnownDevice,
      temporalAnomaly: transactionHour < 6 || transactionHour > 22,
      highVelocityHaste: completionTimeSeconds < 20,
      threatLink: !!telemetry.hasRecentScamAlert,
    },
  };
}

export async function cancelTransaction(id: string) {
  const txn = await queryOne(`SELECT * FROM transactions WHERE id = ? LIMIT 1`, [id]);
  if (!txn) {
    throw new Error(`Transaction ${id} not found.`);
  }

  await run(`UPDATE transactions SET status = 'CANCELLED' WHERE id = ?`, [id]);
  await run(`UPDATE alerts SET read = 1 WHERE related_transaction_id = ?`, [id]);

  const updated = await queryOne(`SELECT * FROM transactions WHERE id = ? LIMIT 1`, [id]);
  return {
    success: true,
    status: 'CANCELLED',
    message: 'Transaction successfully cancelled. No funds were transferred.',
    transaction: updated,
  };
}

export async function submitIntervention(payload: {
  customerId: string;
  transactionData: any;
  manipulationAnswer: 'YES' | 'NO' | 'NOT_SURE';
}) {
  const { customerId, transactionData, manipulationAnswer } = payload;
  const user = await queryOne(`SELECT * FROM users WHERE id = ? OR customer_id = ? LIMIT 1`, [customerId, customerId]);
  const amount = transactionData.amount || 0;
  const recipient = transactionData.recipientName || transactionData.recipient || 'Unknown Recipient';
  const recipientUpi = transactionData.recipientUpi || 'unknown@upi';
  const now = new Date().toISOString();
  const txnId = `TXN-HELD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (manipulationAnswer === 'YES' || manipulationAnswer === 'NOT_SURE') {
    // Coercion confirmed or suspected - institute protective hold
    if (user) {
      await run(
        `INSERT INTO transactions (id, user_id, recipient, recipient_upi, amount, purpose, risk_score, risk_level, recommended_action, status, device, location, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          txnId,
          user.id,
          recipient,
          recipientUpi,
          amount,
          'Intervention triggered - Customer indicated potential pressure or coercion',
          95,
          'CRITICAL',
          'HOLD',
          'HELD',
          transactionData.deviceFingerprint || 'Mobile Client',
          'Local Session',
          now,
        ]
      );

      const alertId = `ALT-COERCION-${Date.now()}`;
      await run(
        `INSERT INTO alerts (id, user_id, type, title, message, severity, related_transaction_id, related_scam_id, read, created_at)
         VALUES (?, ?, 'TRANSACTION_HELD', 'Protective Safeguard Hold Active', ?, 'CRITICAL', ?, null, 0, ?)`,
        [
          alertId,
          user.id,
          `Protective hold instituted on ₹${amount.toLocaleString('en-IN')} transfer to ${recipient} after safety check indicated coercive pressure.`,
          txnId,
          now,
        ]
      );
    }

    return {
      outcome: 'HELD',
      headline: 'Protective Hold Instituted',
      message: `Your payment of ₹${amount.toLocaleString('en-IN')} has been paused safely. Your money has NOT left your bank account.`,
      guidance: [
        'Disconnect any active phone calls claiming to be from your bank, electricity board, courier, or police.',
        'Do NOT share your UPI PIN, ATM PIN, or One-Time Passwords (OTP) with anyone.',
        'Never install AnyDesk, TeamViewer, or QuickSupport apps under caller instructions.',
        'Contact the National Cyber Crime Helpline at 1930 immediately if threatened.',
      ],
      transactionId: txnId,
    };
  }

  return {
    outcome: 'VERIFIED',
    headline: 'Transfer Verified',
    message: 'You verified this transfer as voluntary. Proceed with standard security verification.',
    guidance: [],
  };
}

export async function confirmTransaction(id: string, confirmationPayload?: { pinEntered?: boolean; verifiedLegitimate?: boolean }) {
  const txn = await queryOne(`SELECT * FROM transactions WHERE id = ? LIMIT 1`, [id]);
  if (!txn) {
    throw new Error(`Transaction ${id} not found.`);
  }

  // IMPORTANT: Enforce backend authority!
  // A transaction marked HELD or CRITICAL cannot simply become ALLOWED because the frontend sent confirm.
  if (txn.status === 'HELD' || txn.risk_level === 'CRITICAL') {
    if (txn.risk_level === 'CRITICAL' || !confirmationPayload?.verifiedLegitimate) {
      return {
        success: false,
        status: 'HELD',
        message: 'Transaction remains safely HELD by GuardianPay protective protocol. Critical risk holds cannot be bypassed with a normal PIN confirmation.',
        transaction: txn,
      };
    }
  }

  // Deduct balance from user
  const user = await queryOne(`SELECT balance FROM users WHERE id = ? LIMIT 1`, [txn.user_id]);
  if (user && user.balance >= txn.amount) {
    await run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [txn.amount, txn.user_id]);
  }

  await run(`UPDATE transactions SET status = 'COMPLETED' WHERE id = ?`, [id]);
  const updated = await queryOne(`SELECT * FROM transactions WHERE id = ? LIMIT 1`, [id]);

  return {
    success: true,
    status: 'COMPLETED',
    message: 'Transaction successfully processed and completed.',
    transaction: updated,
  };
}

export async function getTransactions(userId?: string, limit = 50, offset = 0) {
  let sql = `SELECT t.*, u.name as user_name, u.customer_id as customer_code FROM transactions t JOIN users u ON t.user_id = u.id`;
  const params: any[] = [];

  if (userId) {
    sql += ` WHERE t.user_id = ? OR u.customer_id = ?`;
    params.push(userId, userId);
  }

  sql += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const txns = await query(sql, params);

  const enriched = [];
  for (const t of txns) {
    const signals = await query(
      `SELECT reason, points FROM transaction_risk_signals WHERE transaction_id = ?`,
      [t.id]
    );
    enriched.push({
      ...t,
      customerId: t.user_id,
      customerName: t.user_name,
      recipientName: t.recipient,
      recipientUpi: t.recipient_upi,
      timestamp: t.created_at,
      riskScore: t.risk_score,
      riskTier: t.risk_level,
      actionTaken: t.recommended_action,
      signals,
    });
  }

  return enriched;
}

export async function getTransactionById(id: string) {
  const txn = await queryOne(
    `SELECT t.*, u.name as user_name, u.customer_id as customer_code, u.habitual_max_amount, u.user_type, u.registered_device
     FROM transactions t
     JOIN users u ON t.user_id = u.id
     WHERE t.id = ? LIMIT 1`,
    [id]
  );

  if (!txn) return null;

  const signals = await query(
    `SELECT reason, points FROM transaction_risk_signals WHERE transaction_id = ?`,
    [id]
  );
  
  return {
    ...txn,
    customerId: txn.user_id,
    customerName: txn.user_name,
    recipientName: txn.recipient,
    recipientUpi: txn.recipient_upi,
    timestamp: txn.created_at,
    riskScore: txn.risk_score,
    riskTier: txn.risk_level,
    actionTaken: txn.recommended_action,
    signals,
  };
}

export async function resolveTransactionAlert(id: string, decision: 'APPROVE' | 'BLOCK' | 'HOLD') {
  const txn = await queryOne(`SELECT * FROM transactions WHERE id = ? LIMIT 1`, [id]);
  if (!txn) throw new Error(`Transaction ${id} not found.`);

  if (decision === 'APPROVE') {
    // Release hold and complete
    await run(`UPDATE transactions SET status = 'COMPLETED' WHERE id = ?`, [id]);
    await run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [txn.amount, txn.user_id]);
    await run(`UPDATE alerts SET read = 1 WHERE related_transaction_id = ?`, [id]);
  } else if (decision === 'BLOCK') {
    // Confirm fraud, block transfer
    await run(`UPDATE transactions SET status = 'BLOCKED' WHERE id = ?`, [id]);
    await run(`UPDATE alerts SET read = 1 WHERE related_transaction_id = ?`, [id]);
  } else {
    // Keep on hold
    await run(`UPDATE transactions SET status = 'HELD' WHERE id = ?`, [id]);
  }

  return getTransactionById(id);
}
