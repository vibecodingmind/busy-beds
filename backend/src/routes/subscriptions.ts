import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, type JwtPayload } from '../middleware/auth';
import * as subscriptionModel from '../models/subscription';

const router = Router();

router.get('/plans', async (_req, res) => {
  try {
    const plans = await subscriptionModel.findAllPlans();
    res.json({ plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const sub = await subscriptionModel.findSubscriptionByUserId((req.user as JwtPayload).userId);
    if (!sub) {
      return res.json({ subscription: null });
    }
    res.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        plan: sub.plan,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

router.post(
  '/subscribe',
  authMiddleware,
  body('plan_id').isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { plan_id } = req.body;
      const plan = await subscriptionModel.findPlanById(plan_id);
      if (!plan) {
        return res.status(400).json({ error: 'Invalid plan' });
      }

      const sub = await subscriptionModel.createSubscription((req.user as JwtPayload).userId, plan_id);
      res.json({ subscription: sub });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  }
);

export default router;
