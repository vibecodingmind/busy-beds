import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth';
import type { JwtPayload } from '../middleware/auth';
import * as userModel from '../models/user';
import * as subscriptionModel from '../models/subscription';
import { processReferralReward } from '../services/referralReward';
import { getSetting } from '../services/settings';
import { pool } from '../config/db';
import { config } from '../config';

const router = Router();

function verifyFlutterwaveSignature(rawBody: Buffer, signature: string, secretHash: string): boolean {
  const hash = crypto.createHmac('sha256', secretHash).update(rawBody).digest('base64');
  return hash === signature;
}

export async function webhookHandler(req: Request, res: Response) {
  const secretHash = await getSetting('flutterwave_secret_hash');
  if (!secretHash) {
    res.status(503).send('Flutterwave webhook not configured');
    return;
  }
  const signature = req.headers['flutterwave-signature'] as string;
  const rawBody = req.body as Buffer;
  if (!signature || !verifyFlutterwaveSignature(rawBody, signature, secretHash)) {
    res.status(401).send('Invalid signature');
    return;
  }
  const body = JSON.parse(rawBody.toString()) as {
    type?: string;
    data?: { id?: string; tx_ref?: string; reference?: string; status?: string };
  };
  const eventType = body?.type;
  const data = body?.data;

  if (eventType === 'charge.completed' && data) {
    const txRef = data.tx_ref ?? data.reference;
    const chargeId = data.id;
    const status = data.status;
    if ((status === 'successful' || status === 'succeeded') && txRef) {
      try {
        const pending = await pool.query<{ user_id: number; plan_id: number }>(
          'SELECT user_id, plan_id FROM flutterwave_charge_pending WHERE tx_ref = $1',
          [txRef]
        );
        const row = pending.rows[0];
        if (row) {
          const subId = chargeId || txRef;
          await subscriptionModel.createFlutterwaveSubscription(row.user_id, row.plan_id, subId);
          await pool.query('DELETE FROM flutterwave_charge_pending WHERE tx_ref = $1', [txRef]);
          const plan = await subscriptionModel.findPlanById(row.plan_id);
          if (plan && plan.price > 0) {
            processReferralReward(row.user_id, row.plan_id, Number(plan.price)).catch((e) =>
              console.error('Referral reward:', e)
            );
          }
        }
      } catch (e) {
        console.error('Flutterwave webhook charge.completed:', e);
      }
    }
  }
  res.status(200).send('');
}

router.post('/create-charge', authMiddleware, async (req, res) => {
  const secretKey = await getSetting('flutterwave_secret_key');
  if (!secretKey) {
    return res.status(503).json({ error: 'Flutterwave not configured' });
  }
  try {
    const userId = (req.user as JwtPayload).userId;
    const planId = parseInt(req.body?.plan_id);
    const plan = await subscriptionModel.findPlanById(planId);
    if (!plan?.flutterwave_plan_id) {
      return res.status(400).json({ error: 'Invalid plan or Flutterwave not configured for this plan' });
    }

    const user = await userModel.findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const txRef = `busybeds_sub_${userId}_${planId}_${Date.now()}`;
    const redirectUrl = req.body.success_url || `${config.frontendUrl}/subscription?success=1`;

    await pool.query(
      'INSERT INTO flutterwave_charge_pending (tx_ref, user_id, plan_id) VALUES ($1, $2, $3)',
      [txRef, userId, planId]
    );

    const currency = (plan.currency || 'USD').toUpperCase();
    const amount = Number(plan.price);

    const payload: Record<string, unknown> = {
      tx_ref: txRef,
      amount,
      currency,
      redirect_url: redirectUrl,
      customer: {
        email: user.email,
        name: user.name,
      },
      customizations: { title: 'Busy Beds Subscription' },
    };

    if (plan.flutterwave_plan_id) {
      payload.payment_plan = parseInt(plan.flutterwave_plan_id, 10) || plan.flutterwave_plan_id;
    }

    const apiRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Flutterwave create payment:', apiRes.status, errText);
      await pool.query('DELETE FROM flutterwave_charge_pending WHERE tx_ref = $1', [txRef]).catch(() => {});
      return res.status(502).json({ error: 'Flutterwave payment creation failed' });
    }

    const result = (await apiRes.json()) as { status?: string; data?: { link?: string } };
    const link = result.data?.link;
    if (!link) {
      await pool.query('DELETE FROM flutterwave_charge_pending WHERE tx_ref = $1', [txRef]).catch(() => {});
      return res.status(502).json({ error: 'Invalid Flutterwave response' });
    }

    res.json({ url: link, tx_ref: txRef });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create Flutterwave payment' });
  }
});

export default router;
