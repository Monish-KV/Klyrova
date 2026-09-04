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

  return {
    transactionId,
    riskScore: riskResult.riskScore,
    riskLevel: riskResult.riskLevel,
    recommendedAction: riskResult.recommendedAction,
    status: riskResult.status,
    reasons: riskResult.reasons,
    signals: riskResult.signals,
    protectionLevel: riskResult.protectionLevel,
  };
}

export async function confirmTransaction(id: string, confirmationPayload?: { pinEntered?: boolean; verifiedLegitimate?: boolean }) {
  const txn = await queryOne(`SELECT * FROM transactions WHERE id = ? LIMIT 1`, [id]);
  if (!txn) {
    throw new Error(`Transaction ${id} not found.`);
  }

  // IMPORTANT: Enforce backend authority!
  // A transaction marked HELD cannot simply become ALLOWED because the frontend sent confirm.
  if (txn.status === 'HELD') {
    if (!confirmationPayload?.verifiedLegitimate) {
      return {
        success: false,
        status: 'HELD',
        message: 'Transaction remains safely HELD by GuardianPay protective protocol. Bank review or family confirmation required.',
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

  // Attach signals to each transaction
  for (const t of txns) {
    const signals = await query(
      `SELECT reason, points FROM transaction_risk_signals WHERE transaction_id = ?`,
      [t.id]
    );
    t.signals = signals;
  }

  return txns;
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
  txn.signals = signals;

  return txn;
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
