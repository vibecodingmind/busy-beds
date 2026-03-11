import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import type { JwtPayload } from '../middleware/auth';
import * as subscriptionModel from '../models/subscription';
import { processReferralReward } from '../services/referralReward';
import { getSetting } from '../services/settings';
import { pool } from '../config/db';
import { config } from '../config';

const router = Router();

async function getPayPalAccessToken(): Promise<string> {
  const clientId = await getSetting('paypal_client_id');
  const clientSecret = await getSetting('paypal_client_secret');
  const useSandbox = (await getSetting('paypal_sandbox')) === 'true';
  const baseUrl = useSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  if (!clientId || !clientSecret) throw new Error('PayPal not configured');
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal token failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function webhookHandler(req: Request, res: Response) {
  const body = req.body as { event_type?: string; resource?: { id?: string } };
  const eventType = body?.event_type;
  const subscriptionId = body?.resource?.id;

  if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' && subscriptionId) {
    try {
      const pending = await pool.query<{ user_id: number; plan_id: number }>(
        'SELECT user_id, plan_id FROM paypal_subscription_pending WHERE subscription_id = $1',
        [subscriptionId]
      );
      const row = pending.rows[0];
      if (row) {
        await subscriptionModel.createPayPalSubscription(row.user_id, row.plan_id, subscriptionId);
        await pool.query('DELETE FROM paypal_subscription_pending WHERE subscription_id = $1', [subscriptionId]);
        const plan = await subscriptionModel.findPlanById(row.plan_id);
        if (plan && plan.price > 0) {
          processReferralReward(row.user_id, row.plan_id, Number(plan.price)).catch((e) =>
            console.error('Referral reward:', e)
          );
        }
      }
    } catch (e) {
      console.error('PayPal webhook ACTIVATED:', e);
    }
  } else if (
    (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' || eventType === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
      eventType === 'BILLING.SUBSCRIPTION.EXPIRED') &&
    subscriptionId
  ) {
    await pool
      .query("UPDATE subscriptions SET status = 'cancelled' WHERE paypal_subscription_id = $1", [subscriptionId])
      .catch(() => {});
  }

  res.status(200).send('');
}

router.post('/create-subscription', authMiddleware, async (req, res) => {
  const clientId = await getSetting('paypal_client_id');
  const clientSecret = await getSetting('paypal_client_secret');
  if (!clientId || !clientSecret) {
    return res.status(503).json({ error: 'PayPal not configured' });
  }
  try {
    const userId = (req.user as JwtPayload).userId;
    const planId = parseInt(req.body?.plan_id);
    const plan = await subscriptionModel.findPlanById(planId);
    if (!plan?.paypal_plan_id) {
      return res.status(400).json({ error: 'Invalid plan or PayPal not configured for this plan' });
    }

    const token = await getPayPalAccessToken();
    const returnUrl = req.body.success_url || `${config.frontendUrl}/subscription?success=1`;
    const cancelUrl = req.body.cancel_url || `${config.frontendUrl}/subscription`;

    const useSandbox = (await getSetting('paypal_sandbox')) === 'true';
    const baseUrl = useSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    const createRes = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        plan_id: plan.paypal_plan_id,
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: 'Busy Beds',
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('PayPal create subscription:', createRes.status, errText);
      return res.status(502).json({ error: 'PayPal subscription creation failed' });
    }

    const data = (await createRes.json()) as { id?: string; links?: { rel: string; href: string }[] };
    const approvalLink = data.links?.find((l) => l.rel === 'approve')?.href;
    if (!data.id || !approvalLink) {
      return res.status(502).json({ error: 'Invalid PayPal response' });
    }

    await pool.query(
      `INSERT INTO paypal_subscription_pending (subscription_id, user_id, plan_id) VALUES ($1, $2, $3)
       ON CONFLICT (subscription_id) DO UPDATE SET user_id = $2, plan_id = $3`,
      [data.id, userId, planId]
    );

    res.json({ url: approvalLink, subscriptionId: data.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create PayPal subscription' });
  }
});

export default router;
