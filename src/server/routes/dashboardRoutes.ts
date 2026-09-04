import { Router } from 'express';
import { getCustomerDashboardStats, getAdminDashboardStats } from '../services/dashboardService';

const router = Router();

// GET /api/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const stats = await getCustomerDashboardStats(userId);
    return res.json(stats);
  } catch (err: any) {
    console.error('[API GET /api/dashboard Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch dashboard stats.' });
  }
});

// GET /api/admin/dashboard
router.get('/admin/dashboard', async (req, res) => {
  try {
    const stats = await getAdminDashboardStats();
    return res.json(stats);
  } catch (err: any) {
    console.error('[API GET /api/admin/dashboard Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch admin stats.' });
  }
});

export default router;
