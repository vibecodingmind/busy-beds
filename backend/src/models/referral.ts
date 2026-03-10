import { pool } from '../config/db';

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function ensureReferralCode(userId: number): Promise<string> {
  const r = await pool.query('SELECT referral_code FROM users WHERE id = $1', [userId]);
  const code = r.rows[0]?.referral_code;
  if (code) return code;
  let newCode: string;
  let exists = true;
  while (exists) {
    newCode = randomCode();
    const check = await pool.query('SELECT 1 FROM users WHERE referral_code = $1', [newCode]);
    exists = check.rows.length > 0;
  }
  await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [newCode!, userId]);
  const updated = await pool.query('SELECT referral_code FROM users WHERE id = $1', [userId]);
  return updated.rows[0]?.referral_code || newCode!;
}

export async function getReferralCode(userId: number): Promise<string | null> {
  const r = await pool.query('SELECT referral_code FROM users WHERE id = $1', [userId]);
  return r.rows[0]?.referral_code || null;
}

export async function createReferral(referrerId: number, referredId: number): Promise<void> {
  await pool.query(
    'INSERT INTO referrals (referrer_id, referred_id) VALUES ($1, $2) ON CONFLICT (referred_id) DO NOTHING',
    [referrerId, referredId]
  );
}

export async function findReferredUsers(referrerId: number): Promise<{ id: number; name: string; email: string; created_at: Date }[]> {
  const r = await pool.query(
    `SELECT u.id, u.name, u.email, ref.created_at
     FROM referrals ref
     JOIN users u ON ref.referred_id = u.id
     WHERE ref.referrer_id = $1
     ORDER BY ref.created_at DESC`,
    [referrerId]
  );
  return r.rows;
}

export async function findReferrerByCode(code: string): Promise<number | null> {
  const r = await pool.query('SELECT id FROM users WHERE referral_code = $1', [code.toUpperCase()]);
  return r.rows[0]?.id ?? null;
}

export interface ReferralRewardRow {
  id: number;
  referrer_id: number;
  referred_id: number;
  referred_name: string;
  amount: string;
  status: string;
  created_at: Date;
}

export async function findRewardsForReferrer(referrerId: number): Promise<ReferralRewardRow[]> {
  const r = await pool.query(
    `SELECT rr.id, rr.referrer_id, rr.referred_id, u.name AS referred_name, rr.amount::text, rr.status, rr.created_at
     FROM referral_rewards rr
     JOIN users u ON rr.referred_id = u.id
     WHERE rr.referrer_id = $1
     ORDER BY rr.created_at DESC`,
    [referrerId]
  );
  return r.rows;
}

export async function getStripeConnected(userId: number): Promise<boolean> {
  const r = await pool.query(
    'SELECT stripe_connect_account_id FROM users WHERE id = $1',
    [userId]
  );
  return !!r.rows[0]?.stripe_connect_account_id;
}
