import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import type { JwtPayload } from '../middleware/auth';
import * as subscriptionModel from '../models/subscription';
import { pool } from '../config/db';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const router = Router();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

export function webhookHandler(req: Request, res: Response) {
  if (!stripe || !webhookSecret) {
    res.status(503).send('Stripe webhook not configured');
    return;
  }
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
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
      subscriptionModel.createStripeSubscription(userId, planId, subId).catch((e) => console.error('Webhook create sub:', e));
    }
  } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    if (sub.status === 'canceled' || sub.status === 'unpaid') {
      pool.query("UPDATE subscriptions SET status = 'cancelled' WHERE stripe_subscription_id = $1", [sub.id]).catch(() => {});
    }
  }
  res.json({ received: true });
}

router.post('/create-checkout-session', authMiddleware, async (req, res) => {
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
