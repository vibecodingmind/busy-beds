import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import * as hotelModel from '../models/hotel';
import * as hotelAccountModel from '../models/hotelAccount';
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
    res.json({ success: true, account });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve' });
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
