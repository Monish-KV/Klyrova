import { Router } from 'express';
import { getSafetySettings, updateSafetySettings } from '../services/profileService';
import { run, queryOne } from '../database/db';

const router = Router();

// GET /api/safety/:userId
router.get('/:userId', async (req, res) => {
  try {
    const settings = await getSafetySettings(req.params.userId);
    return res.json(settings);
  } catch (err: any) {
    console.error(`[API GET /api/safety/${req.params.userId} Error]:`, err);
    return res.status(500).json({ error: err.message || 'Failed to fetch safety settings.' });
  }
});

// PATCH or PUT /api/safety/:userId
const handleUpdateSafety = async (req: any, res: any) => {
  try {
    const { transactionMonitoring, scamAnalysis, highRiskVerification } = req.body;
    const updated = await updateSafetySettings(req.params.userId, {
      transactionMonitoring,
      scamAnalysis,
      highRiskVerification,
    });
    return res.json(updated);
  } catch (err: any) {
    console.error(`[API UPDATE /api/safety/${req.params.userId} Error]:`, err);
    return res.status(500).json({ error: err.message || 'Failed to update safety settings.' });
  }
};

router.patch('/:userId', handleUpdateSafety);
router.put('/:userId', handleUpdateSafety);

// POST /api/safety/:userId/pause
router.post('/:userId/pause', async (req, res) => {
  try {
    const user = await queryOne(`SELECT id FROM users WHERE id = ? OR customer_id = ? LIMIT 1`, [req.params.userId, req.params.userId]);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Create protective freeze alert
    const alertId = `ALT-FREEZE-${Date.now()}`;
    const now = new Date().toISOString();
    await run(
      `INSERT INTO alerts (id, user_id, type, title, message, severity, related_transaction_id, related_scam_id, read, created_at)
       VALUES (?, ?, 'SAFETY_REMINDER', 'Emergency Outbound Payment Freeze Active', 'Customer initiated 1-click emergency safeguard. All outbound digital transfers are paused.', 'HIGH', null, null, 0, ?)`,
      [alertId, user.id, now]
    );

    return res.json({ success: true, status: 'HOLD_ACTIVE', message: 'Emergency Outbound Payment Freeze active.' });
  } catch (err: any) {
    console.error(`[API POST /api/safety/${req.params.userId}/pause Error]:`, err);
    return res.status(500).json({ error: err.message || 'Failed to pause safety.' });
  }
});

// POST /api/safety/:userId/resume
router.post('/:userId/resume', async (req, res) => {
  try {
    return res.json({ success: true, status: 'PROTECTED', message: 'Regular banking safeguards resumed.' });
  } catch (err: any) {
    console.error(`[API POST /api/safety/${req.params.userId}/resume Error]:`, err);
    return res.status(500).json({ error: err.message || 'Failed to resume safety.' });
  }
});

export default router;
