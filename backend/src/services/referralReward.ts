import Stripe from 'stripe';
import { pool } from '../config/db';
import { getSetting } from './settings';
import * as subscriptionModel from '../models/subscription';

const MIN_TRANSFER_CENTS = 50; // Stripe minimum $0.50
const STRIPE_CONNECT_CURRENCIES = ['usd', 'eur', 'gbp'];

export interface ReferralReward {
  id: number;
  referrer_id: number;
  referred_id: number;
  amount: number;
  plan_id: number;
  plan_price: number;
  status: 'pending' | 'paid' | 'failed';
  stripe_transfer_id?: string | null;
  created_at: Date;
  paid_at?: Date | null;
}

export async function processReferralReward(
  referredUserId: number,
  planId: number,
  planPrice: number
): Promise<ReferralReward | null> {
  if (planPrice <= 0) return null;

  const referrerResult = await pool.query(
    'SELECT referrer_id FROM referrals WHERE referred_id = $1',
    [referredUserId]
  );
  const referrerId = referrerResult.rows[0]?.referrer_id;
  if (!referrerId) return null;

  const existingResult = await pool.query(
    'SELECT id FROM referral_rewards WHERE referrer_id = $1 AND referred_id = $2',
    [referrerId, referredUserId]
  );
  if (existingResult.rows.length > 0) return null;

  const percentStr = await getSetting('referral_percent');
  const percent = percentStr ? Math.min(100, Math.max(0, parseInt(percentStr, 10) || 25)) : 25;
  const multiplier = percent / 100;
  const amount = Math.round(planPrice * multiplier * 100) / 100;
  const amountCents = Math.round(amount * 100);

  if (amountCents < MIN_TRANSFER_CENTS) return null;

  const insertResult = await pool.query(
    `INSERT INTO referral_rewards (referrer_id, referred_id, amount, plan_id, plan_price, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     ON CONFLICT (referrer_id, referred_id) DO NOTHING
     RETURNING *`,
    [referrerId, referredUserId, amount, planId, planPrice]
  );
  const reward = insertResult.rows[0];
  if (!reward) return null;

  const plan = await subscriptionModel.findPlanById(planId);
  const planCurrency = (plan?.currency || 'USD').toLowerCase();
  const stripeAccountIdResult = await pool.query(
    'SELECT stripe_connect_account_id FROM users WHERE id = $1',
    [referrerId]
  );
  const stripeAccountId = stripeAccountIdResult.rows[0]?.stripe_connect_account_id;
  const stripeKey = await getSetting('stripe_secret_key');
  const stripe = stripeKey ? new Stripe(stripeKey) : null;

  if (stripeAccountId && stripe && STRIPE_CONNECT_CURRENCIES.includes(planCurrency)) {
    try {
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: planCurrency,
        destination: stripeAccountId,
      });
      await pool.query(
        `UPDATE referral_rewards SET status = 'paid', stripe_transfer_id = $1, paid_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [transfer.id, reward.id]
      );
      return { ...reward, status: 'paid' as const, stripe_transfer_id: transfer.id, paid_at: new Date() };
    } catch (err) {
      console.error('Referral transfer failed:', err);
      await pool.query(
        `UPDATE referral_rewards SET status = 'failed' WHERE id = $1`,
        [reward.id]
      );
      return { ...reward, status: 'failed' as const };
    }
  }

  return reward;
}
