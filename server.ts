import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import { initializeSchema } from './src/server/database/schema';
import { seedDatabase } from './src/server/database/seed';

import transactionRoutes from './src/server/routes/transactionRoutes';
import profileRoutes from './src/server/routes/profileRoutes';
import alertRoutes from './src/server/routes/alertRoutes';
import scamRoutes from './src/server/routes/scamRoutes';
import safetyRoutes from './src/server/routes/safetyRoutes';
import dashboardRoutes from './src/server/routes/dashboardRoutes';

import { analyzePayment, submitIntervention } from './src/server/services/transactionService';
import { analyzeScamMessage } from './src/server/services/scamService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'GuardianPay AI Node Backend', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'GuardianPay AI Node Backend', timestamp: new Date().toISOString() });
});

// Specialized Direct API Endpoints
app.post('/api/analyze-payment', async (req, res) => {
  try {
    const result = await analyzePayment(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('[API /api/analyze-payment Error]:', err);
    return res.status(500).json({ error: err.message || 'Payment analysis failed.' });
  }
});

app.post('/api/intervention', async (req, res) => {
  try {
    const result = await submitIntervention(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('[API /api/intervention Error]:', err);
    return res.status(500).json({ error: err.message || 'Intervention submission failed.' });
  }
});

app.post('/api/analyze-message', async (req, res) => {
  try {
    const { messageText, customerId, userId, message } = req.body;
    const text = messageText || message;
    const user = customerId || userId;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Please enter or paste message text to analyze. Empty messages cannot be evaluated.' });
    }

    const result = await analyzeScamMessage(user, text.trim());
    return res.json(result);
  } catch (err: any) {
    console.error('[API /api/analyze-message Error]:', err);
    return res.status(500).json({ error: err.message || 'Scam message analysis failed.' });
  }
});

// Mount Modular Express API Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api', profileRoutes); // exposes /api/customers, /api/users, /api/profile/:userId, /api/users/:userId/beneficiaries
app.use('/api/alerts', alertRoutes);
app.use('/api/scams', scamRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api', dashboardRoutes); // exposes /api/dashboard and /api/admin/dashboard

// Start Server & Mount Vite / Static
async function startServer() {
  try {
    // Initialize SQLite Database schema & demo seed
    await initializeSchema();
    await seedDatabase();
  } catch (dbErr) {
    console.error('[GuardianPay AI] Error initializing database:', dbErr);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GuardianPay AI] Node.js server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
