import * as couponModel from '../models/coupon';
import * as subscriptionModel from '../models/subscription';
import * as hotelModel from '../models/hotel';
import { generateCouponCode } from '../utils/couponCode';
import { pool } from '../config/db';

const COUPON_EXPIRY_DAYS = 7;

function getPeriodBounds(period: 'daily' | 'weekly' | 'monthly'): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'weekly') {
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  }
  return { start, end };
}

export async function checkUserLimit(userId: number): Promise<{ ok: boolean; used: number; limit: number }> {
  const sub = await subscriptionModel.findSubscriptionByUserId(userId);
  if (!sub) return { ok: false, used: 0, limit: 0 };

  const used = await couponModel.countUserCouponsInPeriod(
    userId,
    sub.current_period_start,
    sub.current_period_end
  );
  const limit = sub.plan.monthly_coupon_limit;
  return { ok: used < limit, used, limit };
}

export async function checkHotelLimit(hotelId: number): Promise<{ ok: boolean; used: number; limit: number }> {
  const hotel = await hotelModel.findHotelById(hotelId);
  if (!hotel) return { ok: false, used: 0, limit: 0 };

  const { start, end } = getPeriodBounds(hotel.limit_period);
  const used = await couponModel.countHotelCouponsInPeriod(hotelId, start, end);
  const limit = hotel.coupon_limit;
  return { ok: used < limit, used, limit };
}

export async function generateCoupon(userId: number, hotelId: number): Promise<couponModel.Coupon> {
  const userLimit = await checkUserLimit(userId);
  if (!userLimit.ok) {
    throw new Error('Subscribe to get coupons.');
  }

  const hotelLimit = await checkHotelLimit(hotelId);
  if (!hotelLimit.ok) {
    throw new Error(`Hotel coupon limit reached. Used ${hotelLimit.used}/${hotelLimit.limit}.`);
  }

  const hotel = await hotelModel.findHotelById(hotelId);
  if (!hotel) throw new Error('Hotel not found');

  let code = generateCouponCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await couponModel.findCouponByCode(code);
    if (!existing) break;
    code = generateCouponCode();
    attempts++;
  }
  if (attempts >= 5) throw new Error('Failed to generate unique coupon code');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + COUPON_EXPIRY_DAYS);

  return couponModel.createCoupon({
    code,
    userId,
    hotelId,
    discountValue: hotel.coupon_discount_value,
    expiresAt,
  });
}

export async function validateCoupon(code: string): Promise<couponModel.CouponWithDetails | null> {
  const coupon = await couponModel.findCouponByCode(code);
  if (!coupon) return null;
  if (coupon.status !== 'active') return null;
  if (new Date() > new Date(coupon.expires_at)) return null;
  return coupon;
}

export async function redeemCoupon(
  code: string,
  hotelAccountId: number,
  hotelId: number
): Promise<void> {
  const coupon = await couponModel.findCouponByCode(code);
  if (!coupon) throw new Error('Coupon not found');
  if (coupon.status !== 'active') throw new Error('Coupon already redeemed or expired');
  if (new Date() > new Date(coupon.expires_at)) throw new Error('Coupon has expired');
  if (coupon.hotel_id !== hotelId) throw new Error('This coupon belongs to a different hotel');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await couponModel.redeemCoupon(coupon.id, hotelAccountId, client);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
