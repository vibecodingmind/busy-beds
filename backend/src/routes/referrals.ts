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
    res.json({ code, referred });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch referral info' });
  }
});

export default router;
