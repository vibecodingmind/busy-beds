import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import * as hotelModel from '../models/hotel';
import * as hotelAccountModel from '../models/hotelAccount';
import * as roomModel from '../models/room';
import { sendHotelApprovalEmail } from '../services/email';
import * as userModel from '../models/user';
import { getAllForAdmin, updateSettings, getAllPagesForAdmin, updatePageContent } from '../services/settings';
import { logAdminAction } from '../services/auditLog';
import type { JwtPayload } from '../middleware/auth';
import { pool } from '../config/db';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// Hotels CRUD (with managing_account for admin visibility)
router.get('/hotels', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.*,
        CASE WHEN ha.id IS NOT NULL THEN json_build_object('id', ha.id, 'email', ha.email, 'name', ha.name, 'approved', ha.approved)
             ELSE NULL END AS managing_account
       FROM hotels h
       LEFT JOIN hotel_accounts ha ON h.id = ha.hotel_id
       ORDER BY h.name`
    );
    const hotels = result.rows.map((row: Record<string, unknown>) => {
      const { managing_account, ...hotel } = row;
      return { ...hotel, managing_account: managing_account ?? null };
    });
    res.json({ hotels });
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
        country: req.body.country || undefined,
        region: req.body.region || undefined,
        city: req.body.city || undefined,
        contact_phone: req.body.contact_phone,
        contact_email: req.body.contact_email,
        contact_whatsapp: req.body.contact_whatsapp || null,
        images: Array.isArray(req.body.images) ? req.body.images : undefined,
        latitude: req.body.latitude != null ? parseFloat(req.body.latitude) : undefined,
        longitude: req.body.longitude != null ? parseFloat(req.body.longitude) : undefined,
        booking_url: req.body.booking_url || null,
        featured: Boolean(req.body.featured),
        active: req.body.active !== false,
        coupon_discount_value: req.body.coupon_discount_value,
        coupon_limit: req.body.coupon_limit,
        limit_period: req.body.limit_period,
        social_facebook: req.body.social_facebook || null,
        social_instagram: req.body.social_instagram || null,
        social_x: req.body.social_x || null,
        social_linkedin: req.body.social_linkedin || null,
        social_tiktok: req.body.social_tiktok || null,
        booking_airbnb: req.body.booking_airbnb || null,
        booking_bookingcom: req.body.booking_bookingcom || null,
        booking_agoda: req.body.booking_agoda || null,
        booking_expedia: req.body.booking_expedia || null,
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
    const hotel = await hotelModel.findHotelById(parseInt(req.params?.id ?? '0'), true);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    const account = await hotelAccountModel.findHotelAccountByHotelId(hotel.id);
    const managing_account = account
      ? { id: account.id, email: account.email, name: account.name, approved: account.approved }
      : null;
    res.json({ ...hotel, managing_account });
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
    const id = req.params?.id ?? '0';
    const result = await pool.query('DELETE FROM hotels WHERE id = $1 RETURNING id, name', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Hotel not found' });
    const userId = (req.user as JwtPayload)?.userId;
    if (userId) logAdminAction(userId, 'hotel.delete', 'hotel', id, result.rows[0]?.name).catch(() => { });
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
      'SELECT id, email, name, role, created_at, COALESCE(active, true) as active FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user id' });
    const row = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (!row.rows[0]) return res.status(404).json({ error: 'User not found' });
    if (row.rows[0].role === 'admin') {
      return res.status(403).json({ error: 'Admin users cannot be deleted' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user id' });
    const { active } = req.body as { active?: boolean };
    if (typeof active !== 'boolean') return res.status(400).json({ error: 'active must be a boolean' });
    const row = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (!row.rows[0]) return res.status(404).json({ error: 'User not found' });
    if (row.rows[0].role === 'admin') {
      return res.status(403).json({ error: 'Admin users cannot be deactivated' });
    }
    await userModel.updateUser(id, { active });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
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

router.get('/analytics/chart', async (_req, res) => {
  try {
    const days = 14;
    const [signupsRes, redemptionsRes] = await Promise.all([
      pool.query(
        `SELECT DATE(created_at) as date, COUNT(*)::int as count FROM users WHERE created_at >= CURRENT_DATE - $1::int GROUP BY DATE(created_at) ORDER BY date`,
        [days]
      ),
      pool.query(
        `SELECT DATE(redeemed_at) as date, COUNT(*)::int as count FROM redemptions WHERE redeemed_at >= CURRENT_DATE - $1::int GROUP BY DATE(redeemed_at) ORDER BY date`,
        [days]
      ),
    ]);
    res.json({
      signups: signupsRes.rows,
      redemptions: redemptionsRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chart data' });
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
    if (hotel) sendHotelApprovalEmail(account.email, hotel.name).catch(() => { });
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
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'TZS']),
  body('stripe_price_id').optional().trim(),
  body('paypal_plan_id').optional().trim(),
  body('flutterwave_plan_id').optional().trim(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { name, monthly_coupon_limit, price, currency, stripe_price_id, paypal_plan_id, flutterwave_plan_id } = req.body;
      const planCurrency = currency || 'USD';
      const result = await pool.query(
        `INSERT INTO subscription_plans (name, monthly_coupon_limit, price, currency, stripe_price_id, paypal_plan_id, flutterwave_plan_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, monthly_coupon_limit, price, planCurrency, stripe_price_id || null, paypal_plan_id || null, flutterwave_plan_id || null]
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
    const { name, monthly_coupon_limit, price, currency, stripe_price_id, paypal_plan_id, flutterwave_plan_id } = req.body;
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 2;
    if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
    if (monthly_coupon_limit !== undefined) { updates.push(`monthly_coupon_limit = $${i++}`); values.push(monthly_coupon_limit); }
    if (price !== undefined) { updates.push(`price = $${i++}`); values.push(price); }
    if (currency !== undefined && ['USD', 'EUR', 'GBP', 'TZS'].includes(currency)) { updates.push(`currency = $${i++}`); values.push(currency); }
    if (stripe_price_id !== undefined) { updates.push(`stripe_price_id = $${i++}`); values.push(stripe_price_id || null); }
    if (paypal_plan_id !== undefined) { updates.push(`paypal_plan_id = $${i++}`); values.push(paypal_plan_id || null); }
    if (flutterwave_plan_id !== undefined) { updates.push(`flutterwave_plan_id = $${i++}`); values.push(flutterwave_plan_id || null); }
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

// Settings (API keys, secrets - admin only)
router.get('/settings', async (_req, res) => {
  try {
    const settings = await getAllForAdmin();
    res.json({ settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    const updates = req.body as Record<string, string>;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Body must be an object of key-value pairs' });
    }
    await updateSettings(updates);
    const userId = (req.user as JwtPayload)?.userId;
    if (userId) logAdminAction(userId, 'settings.update', 'settings', undefined, Object.keys(updates).join(', ')).catch(() => { });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Pages (privacy, terms, about, contact details) — admin editable
router.get('/pages', async (_req, res) => {
  try {
    const pages = await getAllPagesForAdmin();
    res.json(pages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

router.patch('/pages', async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Body must be an object' });
    }
    await updatePageContent(body);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update pages' });
  }
});

// Audit log
router.get('/audit-log', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '100'), 10), 200);
    const result = await pool.query(
      `SELECT a.id, a.admin_user_id, a.action, a.entity_type, a.entity_id, a.details, a.created_at, u.email as admin_email
       FROM admin_audit_log a
       LEFT JOIN users u ON a.admin_user_id = u.id
       ORDER BY a.created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ entries: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Contact form inbox
router.get('/contact-submissions', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, message, status, admin_notes, created_at FROM contact_submissions ORDER BY created_at DESC LIMIT 500'
    );
    res.json({ submissions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch contact submissions' });
  }
});

router.patch('/contact-submissions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params?.id ?? '0');
    const { status, admin_notes } = req.body as { status?: string; admin_notes?: string };
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (status !== undefined && ['new', 'read', 'replied', 'archived'].includes(status)) {
      updates.push(`status = $${i++}`);
      values.push(status);
    }
    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${i++}`);
      values.push(String(admin_notes).trim());
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    values.push(id);
    const result = await pool.query(
      `UPDATE contact_submissions SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, email, message, status, admin_notes, created_at`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update submission' });
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

// Export CSV helpers
function escapeCsv(val: unknown): string {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

router.get('/export/users', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );
    const headers = ['id', 'email', 'name', 'role', 'created_at'];
    const rows = [headers.join(','), ...result.rows.map((r: Record<string, unknown>) => headers.map((h) => escapeCsv(r[h])).join(','))];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send('\uFEFF' + rows.join('\r\n'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/export/coupons', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.code, c.user_id, c.hotel_id, c.discount_value, c.status, c.created_at, c.expires_at, u.name as user_name, h.name as hotel_name
       FROM coupons c
       JOIN users u ON c.user_id = u.id
       JOIN hotels h ON c.hotel_id = h.id
       ORDER BY c.created_at DESC LIMIT 5000`
    );
    const headers = ['id', 'code', 'user_id', 'user_name', 'hotel_id', 'hotel_name', 'discount_value', 'status', 'created_at', 'expires_at'];
    const rows = [headers.join(','), ...result.rows.map((r: Record<string, unknown>) => headers.map((h) => escapeCsv(r[h])).join(','))];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=coupons.csv');
    res.send('\uFEFF' + rows.join('\r\n'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/export/redemptions', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.redeemed_at, c.code, c.discount_value, h.name as hotel_name, u.name as user_name
       FROM redemptions r
       JOIN coupons c ON r.coupon_id = c.id
       JOIN hotels h ON c.hotel_id = h.id
       JOIN users u ON c.user_id = u.id
       ORDER BY r.redeemed_at DESC LIMIT 5000`
    );
    const headers = ['id', 'redeemed_at', 'code', 'discount_value', 'hotel_name', 'user_name'];
    const rows = [headers.join(','), ...result.rows.map((r: Record<string, unknown>) => headers.map((h) => escapeCsv(r[h])).join(','))];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=redemptions.csv');
    res.send('\uFEFF' + rows.join('\r\n'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/export/subscriptions', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.user_id, s.status, s.current_period_start, s.current_period_end, u.email, u.name, p.name as plan_name, p.monthly_coupon_limit, p.price
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       JOIN subscription_plans p ON s.plan_id = p.id
       ORDER BY s.current_period_end DESC NULLS LAST LIMIT 5000`
    );
    const headers = ['id', 'user_id', 'email', 'name', 'plan_name', 'monthly_coupon_limit', 'price', 'status', 'current_period_start', 'current_period_end'];
    const rows = [headers.join(','), ...result.rows.map((r: Record<string, unknown>) => headers.map((h) => escapeCsv(r[h])).join(','))];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=subscriptions.csv');
    res.send('\uFEFF' + rows.join('\r\n'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Withdraw requests (referral payouts)
router.get('/withdraw-requests', async (req, res) => {
  try {
    const statusFilter = (req.query.status as string) || '';
    let query = `SELECT wr.id, wr.user_id, wr.amount, wr.method, wr.method_details, wr.status, wr.admin_notes, wr.created_at, wr.processed_at, u.email, u.name
      FROM withdraw_requests wr JOIN users u ON wr.user_id = u.id ORDER BY wr.created_at DESC`;
    const result = statusFilter && ['pending', 'approved', 'paid', 'rejected'].includes(statusFilter)
      ? await pool.query(
        `SELECT wr.id, wr.user_id, wr.amount, wr.method, wr.method_details, wr.status, wr.admin_notes, wr.created_at, wr.processed_at, u.email, u.name
           FROM withdraw_requests wr JOIN users u ON wr.user_id = u.id WHERE wr.status = $1 ORDER BY wr.created_at DESC`,
        [statusFilter]
      )
      : await pool.query(
        `SELECT wr.id, wr.user_id, wr.amount, wr.method, wr.method_details, wr.status, wr.admin_notes, wr.created_at, wr.processed_at, u.email, u.name
           FROM withdraw_requests wr JOIN users u ON wr.user_id = u.id ORDER BY wr.created_at DESC`
      );
    const requests = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      user_id: row.user_id,
      user_email: row.email,
      user_name: row.name,
      amount: parseFloat(String(row.amount)),
      method: row.method,
      method_details: row.method_details,
      status: row.status,
      admin_notes: row.admin_notes,
      created_at: row.created_at,
      processed_at: row.processed_at,
    }));
    const countResult = await pool.query(
      "SELECT COUNT(*)::int AS c FROM withdraw_requests WHERE status = 'pending'"
    );
    res.json({ requests, pending_count: countResult.rows[0]?.c ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch withdraw requests' });
  }
});

router.patch('/withdraw-requests/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    const { status, admin_notes } = req.body;
    if (!['approved', 'paid', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const row = await pool.query(
      'SELECT id, user_id, amount, status FROM withdraw_requests WHERE id = $1',
      [id]
    );
    if (!row.rows[0]) return res.status(404).json({ error: 'Withdraw request not found' });
    const reqRow = row.rows[0];
    if (reqRow.status !== 'pending' && reqRow.status !== 'approved') {
      return res.status(400).json({ error: 'Request already processed' });
    }
    if (status === 'paid') {
      const userId = reqRow.user_id;
      const amount = parseFloat(reqRow.amount);
      const rewards = await pool.query(
        `SELECT id, amount FROM referral_rewards WHERE referrer_id = $1 AND status = 'pending' ORDER BY created_at ASC`,
        [userId]
      );
      let remaining = amount;
      for (const r of rewards.rows) {
        if (remaining <= 0) break;
        const rewardAmount = parseFloat(r.amount);
        await pool.query(
          `UPDATE referral_rewards SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [r.id]
        );
        remaining -= rewardAmount;
      }
    }
    await pool.query(
      `UPDATE withdraw_requests SET status = $1, admin_notes = COALESCE($2, admin_notes), processed_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [status, admin_notes ?? null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update withdraw request' });
  }
});

// ============ Amenities Management ============

// --- Categories ---
router.get('/amenities/categories', async (req, res) => {
  try {
    const { include_amenities } = req.query;

    if (include_amenities === 'true') {
      const result = await pool.query(`
        SELECT 
            ac.id as category_id,
            ac.name as category_name,
            ac.display_order as category_display_order,
            COALESCE(
              json_agg(
                json_build_object('id', a.id, 'name', a.name, 'icon', a.icon)
              ) FILTER (WHERE a.id IS NOT NULL), '[]'
            ) as amenities
        FROM amenity_categories ac
        LEFT JOIN amenities a ON ac.id = a.category_id
        GROUP BY ac.id, ac.name, ac.display_order
        ORDER BY ac.display_order ASC;
      `);
      return res.json({ categories: result.rows });
    }

    const result = await pool.query('SELECT * FROM amenity_categories ORDER BY display_order ASC');
    res.json({ categories: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch amenity categories' });
  }
});

router.post(
  '/amenities/categories',
  body('name').trim().notEmpty(),
  body('description').optional().trim(),
  body('display_order').optional().isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, description, display_order } = req.body;
      const result = await pool.query(
        'INSERT INTO amenity_categories (name, description, display_order) VALUES ($1, $2, $3) RETURNING *',
        [name, description || null, display_order || 0]
      );
      res.status(201).json({ category: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create amenity category' });
    }
  }
);

router.put('/amenities/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id || '0');
    const { name, description, display_order } = req.body;

    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 2;

    if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${i++}`); values.push(description); }
    if (display_order !== undefined) { updates.push(`display_order = $${i++}`); values.push(display_order); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.unshift(id);

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await pool.query(
      `UPDATE amenity_categories SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ category: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/amenities/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id || '0');
    const result = await pool.query('DELETE FROM amenity_categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// --- Amenities ---
router.get('/amenities', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM amenities ORDER BY name ASC');
    res.json({ amenities: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch amenities' });
  }
});

router.post(
  '/amenities',
  body('category_id').isInt(),
  body('name').trim().notEmpty(),
  body('icon').optional().trim(),
  body('description').optional().trim(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { category_id, name, icon, description } = req.body;
      const result = await pool.query(
        'INSERT INTO amenities (category_id, name, icon, description) VALUES ($1, $2, $3, $4) RETURNING *',
        [category_id, name, icon || null, description || null]
      );
      res.status(201).json({ amenity: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create amenity' });
    }
  }
);

router.put('/amenities/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id || '0');
    const { category_id, name, icon, description } = req.body;

    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 2;

    if (category_id !== undefined) { updates.push(`category_id = $${i++}`); values.push(category_id); }
    if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
    if (icon !== undefined) { updates.push(`icon = $${i++}`); values.push(icon); }
    if (description !== undefined) { updates.push(`description = $${i++}`); values.push(description); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.unshift(id);

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await pool.query(
      `UPDATE amenities SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Amenity not found' });
    res.json({ amenity: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update amenity' });
  }
});

router.delete('/amenities/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id || '0');
    const result = await pool.query('DELETE FROM amenities WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Amenity not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete amenity' });
  }
});

// --- Property Amenities Assignment ---
router.post('/hotels/:hotelId/amenities', async (req, res) => {
  const client = await pool.connect();
  try {
    const hotelId = parseInt(req.params?.hotelId ?? '0', 10);
    const { amenity_ids } = req.body;

    if (isNaN(hotelId)) return res.status(400).json({ error: 'Invalid hotel ID' });
    if (!Array.isArray(amenity_ids)) return res.status(400).json({ error: 'amenity_ids must be an array' });

    await client.query('BEGIN');

    // Validate hotel exists
    const hotelCheck = await client.query('SELECT id FROM hotels WHERE id = $1', [hotelId]);
    if (hotelCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Hotel not found' });
    }

    // Overwrite method: Delete existing and insert new
    await client.query('DELETE FROM property_amenities WHERE property_id = $1', [hotelId]);

    if (amenity_ids.length > 0) {
      const values: string[] = [];
      const queryParams: unknown[] = [hotelId];
      let paramCounter = 2;

      for (const id of amenity_ids) {
        if (!Number.isInteger(id)) continue;
        values.push(`($1, $${paramCounter})`);
        queryParams.push(id);
        paramCounter++;
      }

      if (values.length > 0) {
        await client.query(
          `INSERT INTO property_amenities (property_id, amenity_id) VALUES ${values.join(', ')} ON CONFLICT DO NOTHING`,
          queryParams
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Amenities updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to map amenities' });
  } finally {
    client.release();
  }
});

router.get('/hotels/:hotelId/amenities', async (req, res) => {
  try {
    const hotelId = parseInt(req.params?.hotelId ?? '0', 10);
    if (isNaN(hotelId)) return res.status(400).json({ error: 'Invalid hotel ID' });

    const result = await pool.query(`
      SELECT a.id, a.name, a.icon, ac.id as category_id, ac.name as category_name
      FROM property_amenities pa
      JOIN amenities a ON pa.amenity_id = a.id
      JOIN amenity_categories ac ON a.category_id = ac.id
      WHERE pa.property_id = $1
      ORDER BY ac.display_order ASC, a.name ASC
    `, [hotelId]);

    // Format output structurally
    const mapped = result.rows.reduce((acc: any, row) => {
      const catIndex = acc.findIndex((c: any) => c.category_id === row.category_id);
      if (catIndex > -1) {
        acc[catIndex].amenities.push({ id: row.id, name: row.name, icon: row.icon });
      } else {
        acc.push({
          category_id: row.category_id,
          category_name: row.category_name,
          amenities: [{ id: row.id, name: row.name, icon: row.icon }]
        });
      }
      return acc;
    }, []);

    res.json({ amenities: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch property amenities' });
  }
});

// ============ Hotel Rooms Management ============

// Get all rooms for a hotel (admin)
router.get('/hotels/:hotelId/rooms', async (req, res) => {
  try {
    const hotelId = parseInt(req.params?.hotelId ?? '', 10);
    if (isNaN(hotelId)) {
      return res.status(400).json({ error: 'Invalid hotel ID' });
    }
    const rooms = await roomModel.findAllRoomsForHotelAdmin(hotelId);
    res.json({ rooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Add room to hotel
router.post(
  '/hotels/:hotelId/rooms',
  body('room_type').trim().notEmpty().withMessage('Room type is required'),
  body('base_price').isFloat({ min: 0 }).withMessage('Base price must be positive'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const hotelId = parseInt(req.params?.hotelId ?? '', 10);
      if (isNaN(hotelId)) {
        return res.status(400).json({ error: 'Invalid hotel ID' });
      }
      const { room_type, description, base_price, currency, amenities, max_occupancy, is_active } = req.body;
      const room = await roomModel.createRoom({
        hotel_id: hotelId,
        room_type,
        description,
        base_price,
        currency,
        amenities,
        max_occupancy,
        is_active,
      });
      res.status(201).json({ room });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create room' });
    }
  }
);

// Update room
router.put('/rooms/:id', async (req, res) => {
  try {
    const id = parseInt(req.params?.id ?? '', 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid room ID' });
    }
    const { room_type, description, base_price, currency, amenities, max_occupancy, is_active } = req.body;
    const room = await roomModel.updateRoom(id, {
      room_type,
      description,
      base_price,
      currency,
      amenities,
      max_occupancy,
      is_active,
    });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room
router.delete('/rooms/:id', async (req, res) => {
  try {
    const id = parseInt(req.params?.id ?? '', 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid room ID' });
    }
    const deleted = await roomModel.deleteRoom(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
