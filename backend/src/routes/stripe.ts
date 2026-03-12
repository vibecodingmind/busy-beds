import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import type { JwtPayload } from '../middleware/auth';
import * as subscriptionModel from '../models/subscription';
import { processReferralReward } from '../services/referralReward';
import { getSetting } from '../services/settings';
import { pool } from '../config/db';
import { config } from '../config';

const router = Router();

export async function webhookHandler(req: Request, res: Response) {
  const secret = await getSetting('stripe_webhook_secret');
  const key = await getSetting('stripe_secret_key');
  const stripe = key ? new Stripe(key) : null;
  if (!stripe || !secret) {
    res.status(503).send('Stripe webhook not configured');
    return;
  }
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    return;
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = parseInt(session.metadata?.user_id || (session.client_reference_id as string) || '0');
    const planId = parseInt(session.metadata?.plan_id || '0');
    const subId = session.subscription as string;
    if (userId && planId) {
      subscriptionModel.createStripeSubscription(userId, planId, subId).then(async () => {
        const plan = await subscriptionModel.findPlanById(planId);
        if (plan && plan.price > 0) {
          processReferralReward(userId, planId, Number(plan.price)).catch((e) => console.error('Referral reward:', e));
        }
      }).catch((e) => console.error('Webhook create sub:', e));
    }
  } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    if (sub.status === 'canceled' || sub.status === 'unpaid') {
      pool.query("UPDATE subscriptions SET status = 'cancelled' WHERE stripe_subscription_id = $1", [sub.id]).catch(() => {});
    }
  }
  res.json({ received: true });
}

router.post('/connect/onboard', authMiddleware, async (req, res) => {
  const key = await getSetting('stripe_secret_key');
  const stripe = key ? new Stripe(key) : null;
  const frontendUrl = config.frontendUrl;
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const userId = (req.user as JwtPayload).userId;
    const existing = await pool.query(
      'SELECT stripe_connect_account_id FROM users WHERE id = $1',
      [userId]
    );
    if (existing.rows[0]?.stripe_connect_account_id) {
      return res.json({ url: null, message: 'Already connected' });
    }
    const account = await stripe.accounts.create({
      type: 'express',
      metadata: { user_id: String(userId) },
    });
    await pool.query(
      'INSERT INTO stripe_connect_pending (account_id, user_id) VALUES ($1, $2) ON CONFLICT (account_id) DO UPDATE SET user_id = $2',
      [account.id, userId]
    );
    const returnUrl = `${frontendUrl}/referral?connected=1`;
    const refreshUrl = `${frontendUrl}/referral?refresh=1`;
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    res.json({ url: accountLink.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create Connect link' });
  }
});

router.post('/connect/complete', authMiddleware, async (req, res) => {
  const key = await getSetting('stripe_secret_key');
  const stripe = key ? new Stripe(key) : null;
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const userId = (req.user as JwtPayload).userId;
    const pending = await pool.query(
      'SELECT account_id FROM stripe_connect_pending WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    if (!pending.rows[0]) {
      return res.json({ success: false, message: 'No pending connection' });
    }
    const accountId = pending.rows[0].account_id;
    const account = await stripe.accounts.retrieve(accountId);
    if (!account.details_submitted) {
      return res.status(400).json({ error: 'Onboarding not complete' });
    }
    await pool.query(
      'UPDATE users SET stripe_connect_account_id = $1 WHERE id = $2',
      [accountId, userId]
    );
    await pool.query('DELETE FROM stripe_connect_pending WHERE user_id = $1', [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete Connect' });
  }
});

router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  const key = await getSetting('stripe_secret_key');
  const stripe = key ? new Stripe(key) : null;
  const frontendUrl = config.frontendUrl;
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured. Use direct subscription.' });
  }
  try {
    const userId = (req.user as JwtPayload).userId;
    const { plan_id, success_url, cancel_url, promo_code } = req.body;
    const plan = await subscriptionModel.findPlanById(parseInt(plan_id));
    if (!plan || !plan.stripe_price_id) {
      return res.status(400).json({ error: 'Invalid plan or Stripe not configured for this plan' });
    }
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: success_url || `${frontendUrl}/subscription?success=1`,
      cancel_url: cancel_url || `${frontendUrl}/subscription`,
      client_reference_id: String(userId),
      metadata: { user_id: String(userId), plan_id: String(plan.id) },
    };
    if (promo_code && typeof promo_code === 'string') {
      const promo = await import('../models/promo').then((m) => m.findPromoByCode(promo_code.trim()));
      if (promo?.valid) {
        const planCurrency = (plan.currency || 'USD').toLowerCase();
        let couponParams: Stripe.CouponCreateParams;
        if (promo.discount_type === 'percent') {
          couponParams = { percent_off: Math.min(100, Math.max(0, Number(promo.discount_value))) };
        } else if (promo.discount_type === 'fixed' && ['usd', 'eur', 'gbp'].includes(planCurrency)) {
          couponParams = { amount_off: Math.round(Number(promo.discount_value) * 100), currency: planCurrency };
        } else if (promo.discount_type === 'fixed') {
          couponParams = { percent_off: 0 };
        } else if (promo.discount_type === 'free_month') {
          couponParams = { percent_off: 100 };
        } else {
          couponParams = { percent_off: 0 };
        }
        if (couponParams.percent_off !== 0 || ('amount_off' in couponParams && couponParams.amount_off)) {
          const coupon = await stripe.coupons.create(couponParams);
          sessionParams.discounts = [{ coupon: coupon.id }];
        }
      }
    }
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/billing-portal', authMiddleware, async (req, res) => {
  const key = await getSetting('stripe_secret_key');
  const stripe = key ? new Stripe(key) : null;
  const frontendUrl = config.frontendUrl;
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const userId = (req.user as JwtPayload).userId;
    const sub = await subscriptionModel.findSubscriptionByUserId(userId);
    const stripeSubId = (sub as { stripe_subscription_id?: string } | null)?.stripe_subscription_id;
    if (!stripeSubId) {
      return res.status(400).json({ error: 'No Stripe subscription found. Subscribe via Stripe first.' });
    }
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
    const customerId = stripeSub.customer as string;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl}/profile/billing`,
    });
    res.json({ url: portalSession.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

export default router;
