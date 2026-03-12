import { pool } from '../config/db';
import type { PoolClient } from 'pg';

export interface Coupon {
  id: number;
  code: string;
  user_id: number;
  hotel_id: number;
  discount_value: string;
  status: string;
  created_at: Date;
  expires_at: Date;
}

export interface CouponWithDetails extends Coupon {
  user_name: string;
  hotel_name: string;
}

export async function createCoupon(data: {
  code: string;
  userId: number;
  hotelId: number;
  discountValue: string;
  expiresAt: Date;
}): Promise<Coupon> {
  const result = await pool.query(
    `INSERT INTO coupons (code, user_id, hotel_id, discount_value, status, expires_at)
     VALUES ($1, $2, $3, $4, 'active', $5)
     RETURNING *`,
    [data.code, data.userId, data.hotelId, data.discountValue, data.expiresAt]
  );
  return result.rows[0]!;
}

export async function findCouponByCode(code: string): Promise<CouponWithDetails | null> {
  const result = await pool.query(
    `SELECT c.*, u.name as user_name, h.name as hotel_name
     FROM coupons c
     JOIN users u ON c.user_id = u.id
     JOIN hotels h ON c.hotel_id = h.id
     WHERE c.code = $1`,
    [code.toUpperCase()]
  );
  return result.rows[0] || null;
}

export interface CouponWithDetailsAndReminder extends CouponWithDetails {
  remind_1_day_before?: boolean;
}

export async function findCouponsByUserId(userId: number): Promise<CouponWithDetailsAndReminder[]> {
  const result = await pool.query(
    `SELECT c.*, h.name as hotel_name, COALESCE(crp.remind_1_day_before, false) as remind_1_day_before
     FROM coupons c
     JOIN hotels h ON c.hotel_id = h.id
     LEFT JOIN coupon_reminder_preferences crp ON crp.coupon_id = c.id
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    ...r,
    remind_1_day_before: Boolean(r.remind_1_day_before),
  })) as CouponWithDetailsAndReminder[];
}

export async function getReminderPreference(couponId: number, userId: number): Promise<boolean> {
  const r = await pool.query(
    'SELECT remind_1_day_before FROM coupon_reminder_preferences WHERE coupon_id = $1',
    [couponId]
  );
  if (r.rows.length === 0) return false;
  const row = await pool.query('SELECT user_id FROM coupons WHERE id = $1', [couponId]);
  if (row.rows[0]?.user_id !== userId) return false;
  return Boolean(r.rows[0]?.remind_1_day_before);
}

export async function setReminderPreference(couponId: number, userId: number, remind1Day: boolean): Promise<boolean> {
  const owner = await pool.query('SELECT user_id FROM coupons WHERE id = $1', [couponId]);
  if (owner.rows[0]?.user_id !== userId) return false;
  await pool.query(
    `INSERT INTO coupon_reminder_preferences (coupon_id, remind_1_day_before)
     VALUES ($1, $2)
     ON CONFLICT (coupon_id) DO UPDATE SET remind_1_day_before = $2`,
    [couponId, remind1Day]
  );
  return true;
}

export async function countUserCouponsInPeriod(
  userId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*)::int as count FROM coupons
     WHERE user_id = $1 AND created_at >= $2 AND created_at < $3`,
    [userId, periodStart, periodEnd]
  );
  return result.rows[0]!.count;
}

export async function countHotelCouponsInPeriod(
  hotelId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*)::int as count FROM coupons
     WHERE hotel_id = $1 AND created_at >= $2 AND created_at < $3`,
    [hotelId, periodStart, periodEnd]
  );
  return result.rows[0]!.count;
}

export async function cancelCoupon(couponId: number, userId: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE coupons SET status = 'cancelled' WHERE id = $1 AND user_id = $2 AND status = 'active' RETURNING id`,
    [couponId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function findCouponById(id: number): Promise<Coupon | null> {
  const result = await pool.query('SELECT * FROM coupons WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function redeemCoupon(
  couponId: number,
  hotelAccountId: number,
  client?: PoolClient
): Promise<void> {
  const db = client || pool;
  await db.query(
    `UPDATE coupons SET status = 'redeemed' WHERE id = $1`,
    [couponId]
  );
  await db.query(
    `INSERT INTO redemptions (coupon_id, hotel_account_id) VALUES ($1, $2)`,
    [couponId, hotelAccountId]
  );
}
