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
import * as exchangeRateModel from '../models/exchangeRate';

interface CustomJwtPayload extends JwtPayload {
  name: string;
  email: string;
}

const router = Router();

function verifyFlutterwaveSignature(rawBody: Buffer, signature: string, secretHash: string): boolean {
  try {
    const hash = crypto.createHmac('sha256', secretHash).update(rawBody).digest('base64');
    return hash === signature;
  } catch (e) {
    return false;
  }
}

export async function webhookHandler(req: Request, res: Response) {
  const secretHash = await getSetting('flutterwave_secret_hash');
  if (!secretHash) {
    console.error('Flutterwave webhook failed: flutterwave_secret_hash not configured');
    return res.status(503).send('Flutterwave webhook not configured');
  }
  const signature = req.headers['flutterwave-signature'] as string;
  const rawBody = req.body as Buffer;

  if (!signature || !verifyFlutterwaveSignature(rawBody, signature, secretHash)) {
    console.warn('Flutterwave webhook: Invalid signature received');
    return res.status(401).send('Invalid signature');
  }

  let body;
  try {
    body = JSON.parse(rawBody.toString());
  } catch (e) {
    console.error('Flutterwave webhook: JSON parse error', e);
    return res.status(400).send('Invalid JSON');
  }

  const eventType = body?.type;
  const data = body?.data;

  console.log(`Flutterwave Webhook received: ${eventType}`, { tx_ref: data?.tx_ref });

  if (eventType === 'charge.completed' && data) {
    const txRef = data.tx_ref ?? data.reference;
    const status = data.status;
    if ((status === 'successful' || status === 'succeeded') && txRef) {
      try {
        const pending = await pool.query<{ user_id: number; plan_id: number }>(
          'SELECT user_id, plan_id FROM flutterwave_charge_pending WHERE tx_ref = $1',
          [txRef]
        );
        const row = pending.rows[0];
        if (row) {
          const subId = String(data.id || txRef);
          console.log(`Activating Flutterwave subscription ${subId} for user ${row.user_id}`);
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
        console.error('Flutterwave webhook capture error:', e);
      }
    }
  }
  res.status(200).send('');
}

router.post('/create-charge', authMiddleware, async (req, res) => {
  const secretKey = await getSetting('flutterwave_secret_key');
  if (!secretKey) {
    console.error('Flutterwave create-charge failed: flutterwave_secret_key not configured');
    return res.status(503).json({ error: 'Flutterwave not configured' });
  }

  try {
    const userId = (req.user as JwtPayload).userId;
    const { plan_id, success_url, cancel_url, currency: currencyOverride } = req.body;
    const planId = parseInt(plan_id);
    const plan = await subscriptionModel.findPlanById(planId);

    if (!plan) {
      console.error(`Flutterwave checkout failed: Plan ${planId} not found`);
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const currency = (currencyOverride || plan.currency || 'USD').toUpperCase();
    let amount = Number(plan.price);

    if (currencyOverride && currencyOverride.toUpperCase() !== (plan.currency || 'USD').toUpperCase()) {
      amount = await exchangeRateModel.convertPrice(amount, plan.currency || 'USD', currencyOverride);
      console.log(`Converting Flutterwave price for ${currencyOverride}: ${plan.price} -> ${amount}`);
    }

    const tx_ref = `flw_${userId}_${planId}_${Date.now()}`;
    const payload: any = {
      tx_ref,
      amount,
      currency,
      redirect_url: success_url || `${config.frontendUrl}/subscription?success=1`,
      customer: {
        email: (req.user as CustomJwtPayload).email,
        name: (req.user as CustomJwtPayload).name,
      },
      customizations: {
        title: 'Busy Beds Subscription',
        description: `Plan: ${plan.name}`,
        logo: 'https://busybeds.com/logo.png',
      },
    };

    if (plan.flutterwave_plan_id) {
      const parsedId = parseInt(plan.flutterwave_plan_id, 10);
      payload.payment_plan = isNaN(parsedId) ? plan.flutterwave_plan_id : parsedId;
    }

    console.log(`Creating Flutterwave payment link for user ${userId}, plan ${planId}, Currency: ${currency}, Amount: ${amount}`);

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
      console.error('Flutterwave create payment error response:', apiRes.status, errText);
      return res.status(502).json({ error: 'Flutterwave payment creation failed' });
    }

    const result = (await apiRes.json()) as { status?: string; data?: { link?: string } };
    const link = result.data?.link;
    if (!link) {
      console.error('Flutterwave create payment error: No link in response', result);
      return res.status(502).json({ error: 'Invalid Flutterwave response' });
    }

    // Save pending charge
    await pool.query(
      'INSERT INTO flutterwave_charge_pending (tx_ref, user_id, plan_id) VALUES ($1, $2, $3)',
      [tx_ref, userId, planId]
    );

    res.json({ url: link, tx_ref });
  } catch (err) {
    console.error('Flutterwave create-charge internal error:', err);
    res.status(500).json({ error: 'Failed to create Flutterwave payment' });
  }
});

export default router;
