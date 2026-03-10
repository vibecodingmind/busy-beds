import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import * as hotelModel from '../models/hotel';
import * as hotelAccountModel from '../models/hotelAccount';
import { sendHotelApprovalEmail } from '../services/email';
import * as userModel from '../models/user';
import { pool } from '../config/db';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// Hotels CRUD
router.get('/hotels', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hotels ORDER BY name');
    res.json({ hotels: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

router.post(
  '/hotels',
  body('name').trim().notEmpty(),
  body('coupon_discount_value').trim().notEmpty(),
  body('coupon_limit').isInt({ min: 1 }),
  body('limit_period').isIn(['daily', 'weekly', 'monthly']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const hotel = await hotelModel.createHotel({
        name: req.body.name,
        description: req.body.description,
        location: req.body.location,
        contact_phone: req.body.contact_phone,
        contact_email: req.body.contact_email,
        images: Array.isArray(req.body.images) ? req.body.images : undefined,
        latitude: req.body.latitude != null ? parseFloat(req.body.latitude) : undefined,
        longitude: req.body.longitude != null ? parseFloat(req.body.longitude) : undefined,
        booking_url: req.body.booking_url || null,
        coupon_discount_value: req.body.coupon_discount_value,
        coupon_limit: req.body.coupon_limit,
        limit_period: req.body.limit_period,
      });
      res.status(201).json(hotel);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create hotel' });
    }
  }
);

router.get('/hotels/:id', async (req, res) => {
  try {
    const hotel = await hotelModel.findHotelById(parseInt(req.params?.id ?? '0'));
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hotel' });
  }
});

router.put('/hotels/:id', async (req, res) => {
  try {
    const hotel = await hotelModel.updateHotel(parseInt(req.params?.id ?? '0'), req.body);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update hotel' });
  }
});

router.delete('/hotels/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM hotels WHERE id = $1 RETURNING id', [
      req.params?.id ?? '0',
    ]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Hotel not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete hotel' });
  }
});

// Create hotel account
router.post(
  '/hotels/:id/account',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const hotelId = parseInt(req.params?.id ?? '0');
      const hotel = await hotelModel.findHotelById(hotelId);
      if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

      const existing = await hotelAccountModel.findHotelAccountByHotelId(hotelId);
      if (existing) return res.status(400).json({ error: 'Hotel already has an account' });

      const hash = await bcrypt.hash(req.body.password, 10);
      const account = await hotelAccountModel.createHotelAccountApproved(
        hotelId,
        req.body.email,
        hash,
        req.body.name
      );
      res.status(201).json({ id: account.id, hotel_id: account.hotel_id, email: account.email });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create hotel account' });
    }
  }
);

// Users
router.get('/users', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Coupons
router.get('/coupons', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as user_name, h.name as hotel_name
       FROM coupons c
       JOIN users u ON c.user_id = u.id
       JOIN hotels h ON c.hotel_id = h.id
       ORDER BY c.created_at DESC
       LIMIT 200`
    );
    res.json({ coupons: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Admin analytics
router.get('/analytics', async (req, res) => {
  try {
    const [usersRes, hotelsRes, subsRes, couponsRes, redemptionsRes] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as c FROM users'),
      pool.query('SELECT COUNT(*)::int as c FROM hotels'),
      pool.query('SELECT COUNT(*)::int as c FROM subscriptions WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*)::int as c FROM coupons WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*)::int as c FROM redemptions'),
    ]);
    res.json({
      total_users: usersRes.rows[0]!.c,
      total_hotels: hotelsRes.rows[0]!.c,
      active_subscriptions: subsRes.rows[0]!.c,
      active_coupons: couponsRes.rows[0]!.c,
      total_redemptions: redemptionsRes.rows[0]!.c,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Pending hotel accounts (awaiting approval)
router.get('/hotel-accounts/pending', async (_req, res) => {
  try {
    const accounts = await hotelAccountModel.findPendingHotelAccounts();
    res.json({ accounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending accounts' });
  }
});

router.post('/hotel-accounts/:id/approve', async (req, res) => {
  try {
    const id = parseInt(req.params?.id ?? '0');
    const account = await hotelAccountModel.approveHotelAccount(id);
    if (!account) return res.status(404).json({ error: 'Hotel account not found' });
    const hotel = await hotelModel.findHotelById(account.hotel_id);
    if (hotel) sendHotelApprovalEmail(account.email, hotel.name).catch(() => {});
    res.json({ success: true, account });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve' });
  }
});

// Subscription plans
router.get('/plans', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscription_plans ORDER BY monthly_coupon_limit');
    res.json({ plans: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

router.post(
  '/plans',
  body('name').trim().notEmpty(),
  body('monthly_coupon_limit').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('stripe_price_id').optional().trim(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { name, monthly_coupon_limit, price, stripe_price_id } = req.body;
      const result = await pool.query(
        `INSERT INTO subscription_plans (name, monthly_coupon_limit, price, stripe_price_id)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, monthly_coupon_limit, price, stripe_price_id || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create plan' });
    }
  }
);

router.put('/plans/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id || '0');
    const { name, monthly_coupon_limit, price, stripe_price_id } = req.body;
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 2;
    if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
    if (monthly_coupon_limit !== undefined) { updates.push(`monthly_coupon_limit = $${i++}`); values.push(monthly_coupon_limit); }
    if (price !== undefined) { updates.push(`price = $${i++}`); values.push(price); }
    if (stripe_price_id !== undefined) { updates.push(`stripe_price_id = $${i++}`); values.push(stripe_price_id || null); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.unshift(id);
    const result = await pool.query(
      `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM subscription_plans WHERE id = $1 RETURNING id', [
      parseInt(req.params.id || '0'),
    ]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// Redemptions
router.get('/redemptions', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, c.code, h.name as hotel_name, u.name as user_name
       FROM redemptions r
       JOIN coupons c ON r.coupon_id = c.id
       JOIN hotels h ON c.hotel_id = h.id
       JOIN users u ON c.user_id = u.id
       ORDER BY r.redeemed_at DESC
       LIMIT 200`
    );
    res.json({ redemptions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch redemptions' });
  }
});

export default router;
