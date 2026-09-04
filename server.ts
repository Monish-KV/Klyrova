import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import { getDb } from './src/server/database/db';
import { initializeSchema } from './src/server/database/schema';
import { seedDatabase } from './src/server/database/seed';

import transactionRoutes from './src/server/routes/transactionRoutes';
import scamRoutes from './src/server/routes/scamRoutes';
import alertRoutes from './src/server/routes/alertRoutes';
import dashboardRoutes from './src/server/routes/dashboardRoutes';
import profileRoutes from './src/server/routes/profileRoutes';
import safetyRoutes from './src/server/routes/safetyRoutes';

import { analyzeTransaction, confirmTransaction } from './src/server/services/transactionService';
import { analyzeScamMessage } from './src/server/services/scamService';
import { getAllUsers } from './src/server/services/profileService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Database & Seed
async function initBackendDatabase() {
  try {
    await getDb();
    await initializeSchema();
    await seedDatabase();
    console.log('✅ [GuardianPay AI] SQLite Database and Seed data initialized successfully.');
  } catch (err) {
    console.error('❌ [GuardianPay AI] Database initialization error:', err);
  }
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', engine: 'GuardianPay AI Multi-Factor Behavioral Risk Engine', database: 'SQLite' });
});

// REST API Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/scams', scamRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', profileRoutes);
app.use('/api/safety', safetyRoutes);

// Compatibility endpoints for previous frontend service calls
app.post('/api/intervention', async (req, res) => {
  try {
    const { customerId, transactionData, manipulationAnswer } = req.body;
    if (manipulationAnswer === 'YES' || manipulationAnswer === 'NOT_SURE') {
      const analysis = await analyzeTransaction({
        userId: customerId,
        recipient: transactionData.recipientName || transactionData.recipientUpi,
        recipientUpi: transactionData.recipientUpi,
        amount: Number(transactionData.amount),
        purpose: transactionData.purpose || transactionData.note || 'User indicated potential phone coercion / social engineering',
        device: transactionData.deviceFingerprint,
      });

      return res.json({
        outcome: 'HELD',
        headline: 'GuardianPay AI Protective Hold Activated',
        message: 'Your money is completely safe. We detected that an unknown caller or scammer might be coercing you. No funds have been transferred.',
        guidance: [
          'Hang up immediately if anyone is currently instructing you on a phone call or AnyDesk.',
          'Call the National Cybercrime Helpline at 1930.',
          'Contact your branch manager or a family member to verify any claim.',
        ],
        transactionId: analysis.transactionId,
      });
    } else {
      return res.json({
        outcome: 'VERIFIED',
        headline: 'Voluntary Confirmation Acknowledged',
        message: 'Customer verified transaction was requested independently.',
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const users = await getAllUsers();
    // Map to frontend customer format
    const customers = users.map((u: any) => ({
      id: u.id,
      customerId: u.customer_id,
      name: u.name,
      age: u.user_type.includes('Senior') ? 68 : u.user_type.includes('Teacher') ? 54 : 29,
      persona: u.user_type,
      avatar: u.id === 'usr_ravi_kumar'
        ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
        : u.id === 'usr_sunita_patel'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      phone: u.phone,
      accountNumber: u.account_number,
      upiId: u.upi_id,
      balance: u.balance,
      habitualMaxAmount: u.habitual_max_amount,
      safetyStatus: 'PROTECTED',
      activeHours: { start: 7, end: 21 },
      registeredDevice: u.registered_device,
      registeredIp: u.registered_ip,
      hasRecentScamLink: false,
      userType: u.user_type,
      digitalExperience: u.digital_experience,
      protectionLevel: u.protection_level,
    }));
    return res.json(customers);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/analyze-payment', async (req, res) => {
  try {
    const {
      customerId,
      userId,
      recipientName,
      recipient,
      recipientUpi,
      amount,
      note,
      purpose,
      deviceFingerprint,
      device,
      isKnownDevice,
      transactionHour,
      completionTimeSeconds,
    } = req.body;

    const analysis = await analyzeTransaction({
      userId: userId || customerId,
      recipient: recipient || recipientName || recipientUpi,
      recipientUpi,
      amount: Number(amount),
      purpose: purpose || note || '',
      device: device || deviceFingerprint,
      isKnownDevice,
      transactionHour,
      completionTimeSeconds,
    });

    // Map factors to frontend modal expectations
    const factors = analysis.signals.map((s, idx) => ({
      id: `f_${idx}`,
      name: s.reason,
      score: s.points,
      maxScore: 30,
      triggered: s.points > 0,
      description: s.reason,
      severity: s.points >= 20 ? 'HIGH' : s.points >= 10 ? 'MEDIUM' : 'LOW',
    }));

    return res.json({
      totalScore: analysis.riskScore,
      tier: analysis.riskLevel === 'CRITICAL' || analysis.riskLevel === 'HIGH' ? analysis.riskLevel : analysis.riskLevel === 'VERIFY' ? 'MEDIUM' : 'LOW',
      action: analysis.recommendedAction === 'HOLD' ? 'HOLD & VERIFY' : analysis.recommendedAction === 'VERIFY' ? 'VERIFY' : 'ALLOW',
      status: analysis.status,
      transactionId: analysis.transactionId,
      factors,
      explanation: `${analysis.riskLevel} RISK: ${analysis.reasons.join('. ')}`,
      requiresIntervention: analysis.riskLevel !== 'LOW',
      reasons: analysis.reasons,
      signals: analysis.signals,
      protectionLevel: analysis.protectionLevel,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/analyze-message', async (req, res) => {
  try {
    const { messageText, message, customerId, userId } = req.body;
    const text = messageText || message;
    const result = await analyzeScamMessage(userId || customerId, text);
    return res.json({
      id: result.id,
      rawText: text,
      timestamp: result.createdAt,
      riskScore: result.score,
      riskLevel: result.riskLevel,
      source: result.source,
      scamType: result.categories[0] || 'Deceptive Phishing Attempt',
      summary: `GuardianPay evaluated threat level at ${result.score}%. ${result.reasons[0] || ''}`,
      warningSigns: result.reasons,
      actionAdvice: [result.recommendedAction, 'Never share one-time passwords (OTPs) or banking PINs.'],
      threatIndicators: {
        hasUrgencyTactics: result.categories.some((c) => c.includes('Urgency')),
        hasSuspiciousLinks: result.categories.some((c) => c.includes('Link') || c.includes('APK')),
        hasImpersonation: result.categories.some((c) => c.includes('Impersonation') || c.includes('Bank')),
        requestsRemoteAccess: result.categories.some((c) => c.includes('Remote')),
        requestsCredentialsOrOtp: result.categories.some((c) => c.includes('Credential') || c.includes('OTP')),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Start Server & mount Vite
async function startServer() {
  await initBackendDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GuardianPay AI] Full-stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
