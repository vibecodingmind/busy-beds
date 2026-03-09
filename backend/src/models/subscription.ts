import { pool } from '../config/db';

export interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_coupon_limit: number;
  price: number;
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
  const result = await pool.query('SELECT id, name, monthly_coupon_limit, price FROM subscription_plans ORDER BY monthly_coupon_limit');
  return result.rows;
}

export async function findPlanById(id: number): Promise<SubscriptionPlan | null> {
  const result = await pool.query('SELECT * FROM subscription_plans WHERE id = $1', [id]);
  return result.rows[0] || null;
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
