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
import * as exchangeRateModel from '../models/exchangeRate';

const router = Router();

export async function webhookHandler(req: Request, res: Response) {
  const secret = await getSetting('stripe_webhook_secret');
  const key = await getSetting('stripe_secret_key');
  const stripe = key ? new Stripe(key) : null;
  if (!stripe || !secret) {
    console.error('Stripe webhook failed: Stripe not configured (key or secret missing)');
    res.status(503).send('Stripe webhook not configured');
    return;
  }
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err instanceof Error ? err.message : 'Unknown');
    res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    return;
  }

  console.log(`Stripe Webhook received: ${event.type}`, { eventId: event.id });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = parseInt(session.metadata?.user_id || (session.client_reference_id as string) || '0');
    const planId = parseInt(session.metadata?.plan_id || '0');
    const subId = session.subscription as string;
    if (userId && planId) {
      console.log(`Activating Stripe subscription ${subId} for user ${userId}, plan ${planId}`);
      subscriptionModel.createStripeSubscription(userId, planId, subId).then(async () => {
        const plan = await subscriptionModel.findPlanById(planId);
        if (plan && plan.price > 0) {
          processReferralReward(userId, planId, Number(plan.price)).catch((e) => console.error('Referral reward:', e));
        }
      }).catch((e) => console.error('Webhook create sub error:', e));
    } else {
      console.warn('Stripe checkout.session.completed received but userId or planId missing in metadata', { userId, planId });
    }
  } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    if (sub.status === 'canceled' || sub.status === 'unpaid') {
      console.log(`Stripe subscription ${sub.id} status update: ${sub.status}. Marking as cancelled in DB.`);
      pool.query("UPDATE subscriptions SET status = 'cancelled' WHERE stripe_subscription_id = $1", [sub.id]).catch((e) => console.error('Stripe webhook cancellation error:', e));
    }
  }
  res.json({ received: true });
}

router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  const key = await getSetting('stripe_secret_key');
  const stripe = key ? new Stripe(key) : null;
  const frontendUrl = config.frontendUrl;
  if (!stripe) {
    console.error('Stripe create-checkout-session failed: Stripe not configured');
    return res.status(503).json({ error: 'Stripe not configured. Use direct subscription.' });
  }
  try {
    const userId = (req.user as JwtPayload).userId;
    const { plan_id, success_url, cancel_url, promo_code, currency: currencyOverride } = req.body;
    const planId = parseInt(plan_id);
    const plan = await subscriptionModel.findPlanById(planId);

    if (!plan) {
      console.error(`Stripe checkout failed: Plan ${planId} not found`);
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const currency = (currencyOverride || plan.currency || 'USD').toLowerCase();
    let price = Number(plan.price);

    // If currency is overridden, we need to convert the price
    if (currencyOverride && currencyOverride.toUpperCase() !== (plan.currency || 'USD').toUpperCase()) {
      price = await exchangeRateModel.convertPrice(price, plan.currency || 'USD', currencyOverride);
      console.log(`Converting Stripe price for ${currencyOverride}: ${plan.price} -> ${price}`);
    }

    if (!plan.stripe_price_id) {
      console.error(`Stripe create-checkout-session failed: Plan ${planId} (${plan.name}) has no stripe_price_id`);
      return res.status(400).json({ error: 'Stripe not configured for this plan' });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: plan.name,
              description: `${plan.monthly_coupon_limit} coupons per ${plan.interval || 'month'}`,
            },
            unit_amount: Math.round(price * 100),
            recurring: {
              interval: (plan.interval as Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring.Interval) || 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: success_url || `${frontendUrl}/subscription?success=1`,
      cancel_url: cancel_url || `${frontendUrl}/subscription`,
      client_reference_id: String(userId),
      metadata: { user_id: String(userId), plan_id: String(plan.id) },
    };

    console.log(`Creating Stripe checkout session for user ${userId}, plan ${plan_id}, Stripe Price ${plan.stripe_price_id}`);

    if (promo_code && typeof promo_code === 'string') {
      const promo = await import('../models/promo').then((m) => m.findPromoByCode(promo_code.trim()));
      if (promo?.valid) {
        console.log(`Applying promo code ${promo_code} to Stripe session`);
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
    console.log(`Stripe checkout session created: ${session.id}`);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe create-checkout-session internal error:', err);
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
      console.warn(`Stripe billing-portal failed: No Stripe subscription for user ${userId}`);
      return res.status(400).json({ error: 'No Stripe subscription found. Subscribe via Stripe first.' });
    }
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
    const customerId = stripeSub.customer as string;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl}/profile/billing`,
    });
    console.log(`Stripe billing portal session created for user ${userId}, customer ${customerId}`);
    res.json({ url: portalSession.url });
  } catch (err) {
    console.error('Stripe billing-portal internal error:', err);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

export default router;
