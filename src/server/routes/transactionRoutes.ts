import { Router } from 'express';
import {
  analyzeTransaction,
  analyzePayment,
  confirmTransaction,
  cancelTransaction,
  getTransactions,
  getTransactionById,
  resolveTransactionAlert,
  submitIntervention,
} from '../services/transactionService';

const router = Router();

// POST /api/transactions/analyze
router.post('/analyze', async (req, res) => {
  try {
    const {
      userId,
      customerId,
      recipient,
      recipientName,
      recipientUpi,
      amount,
      purpose,
      note,
      device,
      deviceFingerprint,
      location,
      isKnownDevice,
      transactionHour,
      completionTimeSeconds,
    } = req.body;

    const targetUser = userId || customerId;
    if (!targetUser || !recipientUpi || amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({
        error: 'userId or customerId, recipientUpi, and positive amount are required.',
      });
    }

    const result = await analyzeTransaction({
      userId: targetUser,
      recipient: recipient || recipientName || recipientUpi,
      recipientUpi,
      amount: Number(amount),
      purpose: purpose || note || '',
      device: device || deviceFingerprint || 'Web Client',
      location,
      isKnownDevice,
      transactionHour,
      completionTimeSeconds,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[API /api/transactions/analyze Error]:', err);
    return res.status(500).json({ error: err.message || 'Transaction analysis failed.' });
  }
});

// POST /api/transactions/:id/confirm
router.post('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { pinEntered, verifiedLegitimate } = req.body;
    const result = await confirmTransaction(id, { pinEntered, verifiedLegitimate });
    return res.json(result);
  } catch (err: any) {
    console.error(`[API /api/transactions/${req.params.id}/confirm Error]:`, err);
    return res.status(500).json({ error: err.message || 'Confirmation failed.' });
  }
});

// POST /api/transactions/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await cancelTransaction(id);
    return res.json(result);
  } catch (err: any) {
    console.error(`[API /api/transactions/${req.params.id}/cancel Error]:`, err);
    return res.status(500).json({ error: err.message || 'Cancellation failed.' });
  }
});

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const userId = (req.query.userId || req.query.customerId) as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const transactions = await getTransactions(userId, limit, offset);
    return res.json(transactions);
  } catch (err: any) {
    console.error('[API GET /api/transactions Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch transactions.' });
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const transaction = await getTransactionById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }
    return res.json(transaction);
  } catch (err: any) {
    console.error(`[API GET /api/transactions/${req.params.id}/Error]:`, err);
    return res.status(500).json({ error: err.message || 'Failed to fetch transaction details.' });
  }
});

// POST /api/transactions/:id/resolve
router.post('/:id/resolve', async (req, res) => {
  try {
    const { decision } = req.body; // 'APPROVE' | 'BLOCK' | 'HOLD'
    if (!['APPROVE', 'BLOCK', 'HOLD'].includes(decision)) {
      return res.status(400).json({ error: "Invalid decision. Must be 'APPROVE', 'BLOCK', or 'HOLD'." });
    }
    const updated = await resolveTransactionAlert(req.params.id, decision);
    return res.json({ success: true, transaction: updated });
  } catch (err: any) {
    console.error(`[API POST /api/transactions/${req.params.id}/resolve Error]:`, err);
    return res.status(500).json({ error: err.message || 'Failed to resolve alert.' });
  }
});

export default router;
