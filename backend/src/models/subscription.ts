import { pool } from '../config/db';

export interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_coupon_limit: number;
  price: number;
  stripe_price_id?: string | null;
  paypal_plan_id?: string | null;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
}

export async function findAllPlans(): Promise<SubscriptionPlan[]> {
  const result = await pool.query(
    'SELECT id, name, monthly_coupon_limit, price, stripe_price_id, paypal_plan_id FROM subscription_plans ORDER BY monthly_coupon_limit'
  );
  return result.rows;
}

export async function findPlanById(id: number): Promise<SubscriptionPlan | null> {
  const result = await pool.query('SELECT * FROM subscription_plans WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createStripeSubscription(userId: number, planId: number, stripeSubscriptionId: string): Promise<Subscription> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  const result = await pool.query(
    `INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end, stripe_subscription_id)
     VALUES ($1, $2, 'active', $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       plan_id = EXCLUDED.plan_id,
       status = 'active',
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       paypal_subscription_id = NULL
     RETURNING *`,
    [userId, planId, now, periodEnd, stripeSubscriptionId]
  );
  return result.rows[0]!;
}

export async function createPayPalSubscription(userId: number, planId: number, paypalSubscriptionId: string): Promise<Subscription> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  const result = await pool.query(
    `INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end, paypal_subscription_id)
     VALUES ($1, $2, 'active', $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       plan_id = EXCLUDED.plan_id,
       status = 'active',
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end,
       paypal_subscription_id = EXCLUDED.paypal_subscription_id,
       stripe_subscription_id = NULL
     RETURNING *`,
    [userId, planId, now, periodEnd, paypalSubscriptionId]
  );
  return result.rows[0]!;
}

export async function findSubscriptionByUserId(userId: number): Promise<(Subscription & { plan: SubscriptionPlan }) | null> {
  const result = await pool.query(
    `SELECT s.*, p.name as plan_name, p.monthly_coupon_limit, p.price
     FROM subscriptions s
     JOIN subscription_plans p ON s.plan_id = p.id
     WHERE s.user_id = $1`,
    [userId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    plan: {
      id: row.plan_id,
      name: row.plan_name,
      monthly_coupon_limit: row.monthly_coupon_limit,
      price: row.price,
    },
  };
}

export async function createSubscription(
  userId: number,
  planId: number
): Promise<Subscription> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const result = await pool.query(
    `INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
     VALUES ($1, $2, 'active', $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       plan_id = EXCLUDED.plan_id,
       status = 'active',
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end
     RETURNING *`,
    [userId, planId, now, periodEnd]
  );
  return result.rows[0]!;
}

export async function cancelSubscription(userId: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 RETURNING id`,
    [userId]
  );
  return (result.rowCount ?? 0) > 0;
}
