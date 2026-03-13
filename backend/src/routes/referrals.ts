import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import type { JwtPayload } from '../middleware/auth';
import * as referralModel from '../models/referral';
import { getSetting } from '../services/settings';
import { pool } from '../config/db';

const router = Router();

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as JwtPayload).userId;
    const code = await referralModel.ensureReferralCode(userId);
    const referred = await referralModel.findReferredUsers(userId);
    const rewards = await referralModel.findRewardsForReferrer(userId);
    const total_earned = rewards
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const total_pending = rewards
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const withdrawable_balance = total_pending;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const earnings_this_month = rewards
      .filter((r) => new Date(r.created_at) >= startOfMonth && (r.status === 'paid' || r.status === 'pending'))
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const withdraw_min_amount = parseFloat((await getSetting('withdraw_min_amount')) || '10');
    const withdraw_max_amount = parseFloat((await getSetting('withdraw_max_amount')) || '500');
    res.json({
      code,
      referred,
      rewards: rewards.map((r) => ({
        referred_id: r.referred_id,
        referred_name: r.referred_name,
        amount: parseFloat(r.amount),
        status: r.status,
        created_at: r.created_at,
      })),
      total_earned,
      total_pending,
      withdrawable_balance: Math.round(withdrawable_balance * 100) / 100,
      withdraw_min_amount: Number.isFinite(withdraw_min_amount) ? withdraw_min_amount : 10,
      withdraw_max_amount: Number.isFinite(withdraw_max_amount) ? withdraw_max_amount : 500,
      earnings_this_month: Math.round(earnings_this_month * 100) / 100,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch referral info' });
  }
});

router.post('/withdraw-request', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as JwtPayload).userId;
    const { amount, method, method_details } = req.body;
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    const validMethods = ['bank', 'mobile_money', 'paypal'];
    if (!validMethods.includes(method) || typeof method_details !== 'string' || !method_details.trim()) {
      return res.status(400).json({ error: 'Invalid method or method details' });
    }
    const withdrawMin = parseFloat((await getSetting('withdraw_min_amount')) || '10');
    const withdrawMax = parseFloat((await getSetting('withdraw_max_amount')) || '500');
    const min = Number.isFinite(withdrawMin) ? withdrawMin : 10;
    const max = Number.isFinite(withdrawMax) ? withdrawMax : 500;
    if (numAmount < min) return res.status(400).json({ error: `Minimum withdrawal is $${min}` });
    if (numAmount > max) return res.status(400).json({ error: `Maximum withdrawal per request is $${max}` });
    const balanceResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM referral_rewards WHERE referrer_id = $1 AND status = 'pending'`,
      [userId]
    );
    const withdrawable_balance = parseFloat(balanceResult.rows[0]?.total || '0');
    if (numAmount > withdrawable_balance) {
      return res.status(400).json({ error: 'Amount exceeds available balance' });
    }
    await pool.query(
      `INSERT INTO withdraw_requests (user_id, amount, method, method_details, status) VALUES ($1, $2, $3, $4, 'pending')`,
      [userId, numAmount, method, method_details.trim()]
    );
    res.status(201).json({ success: true, message: 'Withdrawal request submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit withdrawal request' });
  }
});

router.get('/withdraw-requests', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as JwtPayload).userId;
    const r = await pool.query(
      `SELECT id, amount, method, method_details, status, created_at, processed_at FROM withdraw_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    res.json({
      requests: r.rows.map((row) => ({
        id: row.id,
        amount: parseFloat(row.amount),
        method: row.method,
        method_details: row.method_details,
        status: row.status,
        created_at: row.created_at,
        processed_at: row.processed_at,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
  }
});

export default router;
