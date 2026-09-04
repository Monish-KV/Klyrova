import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  addBeneficiary,
} from '../services/profileService';
import { query } from '../database/db';

const router = Router();

// GET /api/customers & GET /api/users (for demo profile switcher & customer list)
router.get('/customers', async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.json(users);
  } catch (err: any) {
    console.error('[API GET /api/customers Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch customers.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.json(users);
  } catch (err: any) {
    console.error('[API GET /api/users Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch users.' });
  }
});

// GET /api/profile/:userId
router.get('/profile/:userId', async (req, res) => {
  try {
    const profile = await getUserProfile(req.params.userId);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    return res.json(profile);
  } catch (err: any) {
    console.error(`[API GET /api/profile/${req.params.userId} Error]:`, err);
    return res.status(500).json({ error: err.message || 'Failed to fetch user profile.' });
  }
});

// PATCH /api/profile/:userId
router.patch('/profile/:userId', async (req, res) => {
  try {
    const { userType, digitalExperience, protectionLevel, habitualMaxAmount, balance } = req.body;
    const updated = await updateUserProfile(req.params.userId, {
      userType,
      digitalExperience,
      protectionLevel,
      habitualMaxAmount,
      balance,
    });
    return res.json(updated);
  } catch (err: any) {
    console.error(`[API PATCH /api/profile/${req.params.userId} Error]:`, err);
    return res.status(500).json({ error: err.message || 'Failed to update user profile.' });
  }
});

// GET /api/users/:userId/beneficiaries
router.get('/users/:userId/beneficiaries', async (req, res) => {
  try {
    const beneficiaries = await query(
      `SELECT * FROM beneficiaries WHERE user_id = ? OR user_id = (SELECT id FROM users WHERE customer_id = ?) ORDER BY created_at DESC`,
      [req.params.userId, req.params.userId]
    );
    return res.json(beneficiaries);
  } catch (err: any) {
    console.error(`[API GET /api/users/${req.params.userId}/beneficiaries Error]:`, err);
    return res.status(500).json({ error: err.message || 'Failed to fetch beneficiaries.' });
  }
});

// POST /api/users/:userId/beneficiaries
router.post('/users/:userId/beneficiaries', async (req, res) => {
  try {
    const { name, upiId, relationship, accountNumber, avatar } = req.body;
    if (!name || !upiId) {
      return res.status(400).json({ error: 'name and upiId are required.' });
    }
    const created = await addBeneficiary(req.params.userId, {
      name,
      upiId,
      relationship,
      accountNumber,
      avatar,
    });
    return res.json(created);
  } catch (err: any) {
    console.error(`[API POST /api/users/${req.params.userId}/beneficiaries Error]:`, err);
    return res.status(500).json({ error: err.message || 'Failed to add beneficiary.' });
  }
});

export default router;
