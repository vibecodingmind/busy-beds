import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import type { JwtPayload } from '../middleware/auth';
import * as subscriptionModel from '../models/subscription';
import { processReferralReward } from '../services/referralReward';
import { getSetting } from '../services/settings';
import { pool } from '../config/db';
import { config } from '../config';
import * as exchangeRateModel from '../models/exchangeRate';

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
  let body = req.body;
  if (Buffer.isBuffer(body)) {
    try {
      body = JSON.parse(body.toString());
    } catch (e) {
      console.error('PayPal webhook JSON parse error:', e);
      return res.status(400).send('Invalid JSON');
    }
  }

  const eventType = body?.event_type;
  const subscriptionId = body?.resource?.id;

  console.log(`PayPal Webhook received: ${eventType}`, { subscriptionId, resourceId: body?.resource?.id });

  if ((eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') && (subscriptionId || body?.resource?.id)) {
    const id = subscriptionId || body?.resource?.supplementary_data?.related_ids?.order_id || body?.resource?.custom_id || body?.resource?.id;
    try {
      // For orders, custom_id often contains userId_planId
      let userId: number | undefined;
      let planId: number | undefined;

      const customId = body?.resource?.custom_id || body?.resource?.purchase_units?.[0]?.custom_id;
      if (customId && customId.includes('_')) {
        const parts = customId.split('_');
        userId = parseInt(parts[0]);
        planId = parseInt(parts[1]);
      }

      // Fallback to pending table
      const pending = await pool.query<{ user_id: number; plan_id: number }>(
        'SELECT user_id, plan_id FROM paypal_subscription_pending WHERE subscription_id = $1',
        [id]
      );
      const row = pending.rows[0];

      const finalUserId = userId || row?.user_id;
      const finalPlanId = planId || row?.plan_id;

      if (finalUserId && finalPlanId) {
        console.log(`Activating PayPal payment/sub ${id} for user ${finalUserId}`);
        await subscriptionModel.createSubscription(finalUserId, finalPlanId);
        await pool.query('DELETE FROM paypal_subscription_pending WHERE subscription_id = $1', [id]);

        const plan = await subscriptionModel.findPlanById(finalPlanId);
        if (plan && plan.price > 0) {
          processReferralReward(finalUserId, finalPlanId, Number(plan.price)).catch((e) =>
            console.error('Referral reward:', e)
          );
        }
      } else {
        console.warn(`PayPal payment ${id} completed but no user/plan link found.`);
      }
    } catch (e) {
      console.error('PayPal webhook activation error:', e);
    }
  } else if (
    (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' || eventType === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
      eventType === 'BILLING.SUBSCRIPTION.EXPIRED') &&
    subscriptionId
  ) {
    console.log(`Cancelling PayPal subscription ${subscriptionId} due to ${eventType}`);
    await pool
      .query("UPDATE subscriptions SET status = 'cancelled' WHERE paypal_subscription_id = $1", [subscriptionId])
      .catch((e) => console.error('PayPal webhook cancellation error:', e));
  }

  res.status(200).send('');
}

router.post('/create-subscription', authMiddleware, async (req, res) => {
  const clientId = await getSetting('paypal_client_id');
  const clientSecret = await getSetting('paypal_client_secret');
  if (!clientId || !clientSecret) {
    console.error('PayPal checkout failed: PayPal not configured');
    return res.status(503).json({ error: 'PayPal not configured' });
  }
  try {
    const userId = (req.user as JwtPayload).userId;
    const { plan_id, success_url, cancel_url, currency: currencyOverride } = req.body;
    const planId = parseInt(plan_id);
    const plan = await subscriptionModel.findPlanById(planId);

    if (!plan) {
      console.error(`PayPal checkout failed: Plan ${planId} not found`);
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const currency = (currencyOverride || plan.currency || 'USD').toUpperCase();
    let price = Number(plan.price);

    if (currencyOverride && currencyOverride.toUpperCase() !== (plan.currency || 'USD').toUpperCase()) {
      price = await exchangeRateModel.convertPrice(price, plan.currency || 'USD', currencyOverride);
      console.log(`Converting PayPal price for ${currencyOverride}: ${plan.price} -> ${price}`);
    }

    const token = await getPayPalAccessToken();
    const returnUrl = success_url || `${config.frontendUrl}/subscription?success=1`;
    const cancelUrl = cancel_url || `${config.frontendUrl}/subscription`;

    const useSandbox = (await getSetting('paypal_sandbox')) === 'true';
    const baseUrl = useSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    console.log(`Creating PayPal order for user ${userId}, plan ${planId}, Price ${price} ${currency}`);

    // Create an Order (One-time payment) instead of a Subscription
    const createRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: price.toFixed(2),
            },
            description: `Subscription: ${plan.name}`,
            custom_id: `${userId}_${planId}`,
          },
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: 'Busy Beds',
          user_action: 'PAY_NOW',
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('PayPal create order error response:', createRes.status, errText);
      return res.status(502).json({ error: 'PayPal order creation failed' });
    }

    const data = (await createRes.json()) as { id?: string; links?: { rel: string; href: string }[] };
    const approvalLink = data.links?.find((l) => l.rel === 'approve' || l.rel === 'payer-action')?.href;
    if (!data.id || !approvalLink) {
      console.error('PayPal create order error: Invalid response data', data);
      return res.status(502).json({ error: 'Invalid PayPal response' });
    }

    // We reuse the pending table but use order_id (subscription_id column)
    await pool.query(
      `INSERT INTO paypal_subscription_pending (subscription_id, user_id, plan_id) VALUES ($1, $2, $3)
       ON CONFLICT (subscription_id) DO UPDATE SET user_id = $2, plan_id = $3`,
      [data.id, userId, planId]
    );

    console.log(`PayPal order created successfully: ${data.id}`);
    res.json({ url: approvalLink, orderId: data.id });
  } catch (err) {
    console.error('PayPal checkout internal error:', err);
    res.status(500).json({ error: 'Failed to create PayPal payment' });
  }
});

export default router;
