import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { hotelAuthMiddleware } from '../middleware/auth';
import { pool } from '../config/db';
import * as couponService from '../services/couponService';

const router = Router();

router.get('/redemptions', hotelAuthMiddleware, async (req, res) => {
  try {
    if (!req.hotel) return res.status(401).json({ error: 'Not authenticated' });

    const { start, end } = req.query;
    let query = `
      SELECT r.id, r.redeemed_at, c.code, c.discount_value, u.name as user_name
      FROM redemptions r
      JOIN coupons c ON r.coupon_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE r.hotel_account_id IN (SELECT id FROM hotel_accounts WHERE hotel_id = $1)
    `;
    const params: (string | number)[] = [req.hotel.hotelId];

    if (start && end) {
      query += ` AND r.redeemed_at >= $2 AND r.redeemed_at <= $3`;
      params.push(start as string, end as string);
    }

    query += ` ORDER BY r.redeemed_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json({ redemptions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch redemptions' });
  }
});

router.get('/chart', hotelAuthMiddleware, async (req, res) => {
  try {
    if (!req.hotel) return res.status(401).json({ error: 'Not authenticated' });
    const days = Math.min(14, parseInt(String(req.query.days || '7'), 10) || 7);
    const result = await pool.query(
      `SELECT DATE(r.redeemed_at) as date, COUNT(*)::int as count
       FROM redemptions r
       JOIN hotel_accounts ha ON r.hotel_account_id = ha.id
       WHERE ha.hotel_id = $1 AND r.redeemed_at >= CURRENT_DATE - $2::int
       GROUP BY DATE(r.redeemed_at)
       ORDER BY date`,
      [req.hotel.hotelId, days]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

router.post(
  '/redemptions/bulk',
  hotelAuthMiddleware,
  body('codes').isArray(),
  body('codes.*').isString().trim().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'codes must be an array of strings' });
      if (!req.hotel) return res.status(401).json({ error: 'Not authenticated' });
      const codes = (req.body.codes as string[]).map((c: string) => String(c).trim()).filter(Boolean);
      if (codes.length === 0) return res.status(400).json({ error: 'At least one code required' });
      if (codes.length > 50) return res.status(400).json({ error: 'Maximum 50 codes per request' });
      const results: { code: string; success: boolean; error?: string }[] = [];
      for (const code of codes) {
        try {
          await couponService.redeemCoupon(code, req.hotel!.hotelAccountId, req.hotel!.hotelId);
          results.push({ code, success: true });
        } catch (err) {
          results.push({ code, success: false, error: err instanceof Error ? err.message : 'Failed' });
        }
      }
      res.json({ results });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Bulk redeem failed' });
    }
  }
);

router.get('/stats', hotelAuthMiddleware, async (req, res) => {
  try {
    if (!req.hotel) return res.status(401).json({ error: 'Not authenticated' });

    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE r.redeemed_at >= CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE r.redeemed_at >= date_trunc('week', CURRENT_DATE)) as this_week,
        COUNT(*) FILTER (WHERE r.redeemed_at >= date_trunc('month', CURRENT_DATE)) as this_month
       FROM redemptions r
       JOIN hotel_accounts ha ON r.hotel_account_id = ha.id
       WHERE ha.hotel_id = $1`,
      [req.hotel.hotelId]
    );

    res.json({
      today: parseInt(result.rows[0]?.today || '0', 10),
      this_week: parseInt(result.rows[0]?.this_week || '0', 10),
      this_month: parseInt(result.rows[0]?.this_month || '0', 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
