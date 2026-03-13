import { pool } from '../config/db';
import { getSetting } from './settings';

const MIN_REWARD_CENTS = 50; // minimum reward to create (e.g. $0.50)

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

  if (amountCents < MIN_REWARD_CENTS) return null;

  const insertResult = await pool.query(
    `INSERT INTO referral_rewards (referrer_id, referred_id, amount, plan_id, plan_price, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     ON CONFLICT (referrer_id, referred_id) DO NOTHING
     RETURNING *`,
    [referrerId, referredUserId, amount, planId, planPrice]
  );
  const reward = insertResult.rows[0];
  if (!reward) return null;

  return reward as ReferralReward;
}
