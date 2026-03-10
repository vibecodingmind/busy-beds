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

export async function findCouponsByUserId(userId: number): Promise<CouponWithDetails[]> {
  const result = await pool.query(
    `SELECT c.*, h.name as hotel_name
     FROM coupons c
     JOIN hotels h ON c.hotel_id = h.id
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return result.rows;
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
