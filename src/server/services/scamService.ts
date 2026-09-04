import { query, queryOne, run } from '../database/db';
import { analyzeScamWithGemini } from '../ai/geminiScamService';

export async function analyzeScamMessage(userId?: string, message?: string) {
  if (!message || message.trim() === '') {
    throw new Error('Message text is required for scam analysis.');
  }

  // 1. Resolve user if provided
  let resolvedUserId: string | null = null;
  if (userId) {
    const user = await queryOne(
      `SELECT id FROM users WHERE id = ? OR customer_id = ? LIMIT 1`,
      [userId, userId]
    );
    if (user) {
      resolvedUserId = user.id;
    }
  }

  // 2. Run Gemini AI / Local Heuristic Engine
  const result = await analyzeScamWithGemini(message);

  // 3. Persist to SQLite
  const id = `SCAM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  await run(
    `INSERT INTO scam_analyses (id, user_id, message, score, risk_level, categories, reasons, recommended_action, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      resolvedUserId,
      message,
      result.score,
      result.riskLevel,
      JSON.stringify(result.categories),
      JSON.stringify(result.reasons),
      result.recommendedAction,
      result.source,
      now,
    ]
  );

  // 4. Create Alert if High or Critical
  if (result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH') {
    const alertId = `ALT-SCAM-${Date.now()}`;
    await run(
      `INSERT INTO alerts (id, user_id, type, title, message, severity, related_transaction_id, related_scam_id, read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alertId,
        resolvedUserId,
        'SCAM_DETECTED',
        `Deceptive ${result.categories[0] || 'Phishing'} Message Detected`,
        `Scam analyzer identified high threat (${result.score}% risk): "${message.slice(0, 70)}..."`,
        result.riskLevel,
        null,
        id,
        0,
        now,
      ]
    );
  }

  const lower = message.toLowerCase();
  const hasUrgencyTactics = /urgent|immediately|asap|today|tonight|blocked|freeze|disconnect|expire|hour/i.test(lower);
  const hasSuspiciousLinks = /https?:\/\/|www\.|\.apk|\.xyz|\.top|bit\.ly/i.test(lower);
  const hasImpersonation = /sbi|hdfc|icici|axis|bank|officer|police|customs|bescom|electricity|yono/i.test(lower);
  const requestsRemoteAccess = /anydesk|teamviewer|quicksupport|screen share|remote/i.test(lower);
  const requestsCredentialsOrOtp = /otp|pin|password|pan card|aadhaar|cvv|kyc|credential/i.test(lower);

  return {
    id,
    score: result.score,
    riskScore: result.score,
    riskLevel: result.riskLevel,
    categories: result.categories,
    reasons: result.reasons,
    warningSigns: result.reasons,
    recommendedAction: result.recommendedAction,
    actionAdvice: [
      result.recommendedAction,
      'Never install third-party APKs or share one-time PINs/passwords.',
      'Report suspected cybercrime to 1930 or cybercrime.gov.in.',
    ],
    source: result.source,
    rawText: message,
    timestamp: now,
    createdAt: now,
    created_at: now,
    scamType: result.categories[0] || 'Phishing / Social Engineering',
    summary: result.reasons[0] || 'Automated message risk scan completed.',
    threatIndicators: {
      hasUrgencyTactics,
      hasSuspiciousLinks,
      hasImpersonation,
      requestsRemoteAccess,
      requestsCredentialsOrOtp,
    },
  };
}

export async function getScamHistory(userId?: string, limit = 50, offset = 0) {
  let sql = `SELECT * FROM scam_analyses`;
  const params: any[] = [];

  if (userId) {
    sql += ` WHERE user_id = ?`;
    params.push(userId);
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const rows = await query(sql, params);

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    message: r.message,
    score: r.score,
    riskLevel: r.risk_level,
    categories: JSON.parse(r.categories || '[]'),
    reasons: JSON.parse(r.reasons || '[]'),
    recommendedAction: r.recommended_action,
    source: r.source,
    createdAt: r.created_at,
  }));
}
