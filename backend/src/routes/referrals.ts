import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import type { JwtPayload } from '../middleware/auth';
import * as referralModel from '../models/referral';

const router = Router();

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as JwtPayload).userId;
    const code = await referralModel.ensureReferralCode(userId);
    const referred = await referralModel.findReferredUsers(userId);
    const stripe_connected = await referralModel.getStripeConnected(userId);
    const rewards = await referralModel.findRewardsForReferrer(userId);
    const total_earned = rewards
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const total_pending = rewards
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const earnings_this_month = rewards
      .filter((r) => new Date(r.created_at) >= startOfMonth && (r.status === 'paid' || r.status === 'pending'))
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    res.json({
      code,
      referred,
      stripe_connected,
      rewards: rewards.map((r) => ({
        referred_id: r.referred_id,
        referred_name: r.referred_name,
        amount: parseFloat(r.amount),
        status: r.status,
        created_at: r.created_at,
      })),
      total_earned,
      total_pending,
      earnings_this_month: Math.round(earnings_this_month * 100) / 100,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch referral info' });
  }
});

export default router;
