import { Router } from 'express';
import { analyzeScamMessage, getScamHistory } from '../services/scamService';

const router = Router();

// POST /api/scams/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { userId, message, messageText } = req.body;
    const textToAnalyze = message || messageText;

    if (!textToAnalyze || textToAnalyze.trim() === '') {
      return res.status(400).json({ error: 'message or messageText is required.' });
    }

    const result = await analyzeScamMessage(userId, textToAnalyze);
    return res.json(result);
  } catch (err: any) {
    console.error('[API POST /api/scams/analyze Error]:', err);
    return res.status(500).json({ error: err.message || 'Scam analysis failed.' });
  }
});

// GET /api/scams
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const history = await getScamHistory(userId, limit, offset);
    return res.json(history);
  } catch (err: any) {
    console.error('[API GET /api/scams Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch scam history.' });
  }
});

export default router;
