import { Router } from 'express';
import { getAlerts, markAlertRead, getUnreadAlertsCount } from '../services/alertService';

const router = Router();

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const unreadOnly = req.query.unreadOnly === 'true';
    const alerts = await getAlerts(userId, unreadOnly);
    return res.json(alerts);
  } catch (err: any) {
    console.error('[API GET /api/alerts Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch alerts.' });
  }
});

// GET /api/alerts/count
router.get('/count', async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const count = await getUnreadAlertsCount(userId);
    return res.json({ unreadCount: count });
  } catch (err: any) {
    console.error('[API GET /api/alerts/count Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch unread count.' });
  }
});

// PATCH /api/alerts/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const alert = await markAlertRead(req.params.id);
    return res.json({ success: true, alert });
  } catch (err: any) {
    console.error(`[API PATCH /api/alerts/${req.params.id}/read Error]:`, err);
    return res.status(500).json({ error: err.message || 'Failed to mark alert as read.' });
  }
});

export default router;
