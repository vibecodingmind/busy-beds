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
    const { plan_id, success_url, cancel_url } = req.body;
    const plan = await subscriptionModel.findPlanById(parseInt(plan_id));
    if (!plan || !plan.stripe_price_id) {
      return res.status(400).json({ error: 'Invalid plan or Stripe not configured for this plan' });
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: success_url || `${frontendUrl}/subscription?success=1`,
      cancel_url: cancel_url || `${frontendUrl}/subscription`,
      client_reference_id: String(userId),
      metadata: { user_id: String(userId), plan_id: String(plan.id) },
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

export default router;
