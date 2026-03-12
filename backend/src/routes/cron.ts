import { Router } from 'express';
import { pool } from '../config/db';
import { sendCouponExpiryReminder, sendAdminWeeklyReport } from '../services/email';
import { getSetting } from '../services/settings';

const router = Router();

function checkCronSecret(req: { headers: { [key: string]: string | string[] | undefined }; query?: { secret?: string } }) {
  return async () => {
    const cronSecret = (await getSetting('cron_secret')) || process.env.CRON_SECRET || process.env.SEED_SECRET;
    const headerSecret = req.headers['x-cron-secret'];
    const secret = typeof headerSecret === 'string' ? headerSecret : Array.isArray(headerSecret) ? headerSecret[0] : undefined;
    if (cronSecret && secret !== cronSecret && req.query?.secret !== cronSecret) {
      return false;
    }
    return true;
  };
}

// 48h default reminders (all active coupons expiring in 48h)
router.post('/coupon-expiry-reminders', async (req, res) => {
  const ok = await (await checkCronSecret(req))();
  if (!ok) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await pool.query(
      `SELECT c.id, c.code, c.expires_at, u.email, u.name as user_name, h.name as hotel_name
       FROM coupons c
       JOIN users u ON c.user_id = u.id
       JOIN hotels h ON c.hotel_id = h.id
       WHERE c.status = 'active'
         AND c.expires_at > NOW()
         AND c.expires_at <= NOW() + INTERVAL '48 hours'
         AND NOT EXISTS (
           SELECT 1 FROM coupon_reminder_sent crs WHERE crs.coupon_id = c.id
         )
       LIMIT 50`
    );
    const rows = result.rows;
    let sent = 0;
    for (const row of rows) {
      const ok = await sendCouponExpiryReminder(
        row.email,
        row.user_name,
        row.hotel_name,
        row.code,
        new Date(row.expires_at).toLocaleDateString()
      );
      if (ok) {
        await pool.query('INSERT INTO coupon_reminder_sent (coupon_id) VALUES ($1) ON CONFLICT (coupon_id) DO NOTHING', [row.id]);
        sent++;
      }
    }
    res.json({ processed: rows.length, sent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

// 1-day reminders for users who opted in (remind_1_day_before)
router.post('/coupon-expiry-reminders-1d', async (req, res) => {
  const ok = await (await checkCronSecret(req))();
  if (!ok) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await pool.query(
      `SELECT c.id, c.code, c.expires_at, u.email, u.name as user_name, h.name as hotel_name
       FROM coupons c
       JOIN users u ON c.user_id = u.id
       JOIN hotels h ON c.hotel_id = h.id
       JOIN coupon_reminder_preferences crp ON crp.coupon_id = c.id AND crp.remind_1_day_before = true
       WHERE c.status = 'active'
         AND c.expires_at > NOW()
         AND c.expires_at <= NOW() + INTERVAL '24 hours'
         AND NOT EXISTS (
           SELECT 1 FROM coupon_reminder_1d_sent crs WHERE crs.coupon_id = c.id
         )
       LIMIT 50`
    );
    const rows = result.rows;
    let sent = 0;
    for (const row of rows) {
      const ok = await sendCouponExpiryReminder(
        row.email,
        row.user_name,
        row.hotel_name,
        row.code,
        new Date(row.expires_at).toLocaleDateString()
      );
      if (ok) {
        await pool.query('INSERT INTO coupon_reminder_1d_sent (coupon_id) VALUES ($1) ON CONFLICT (coupon_id) DO NOTHING', [row.id]);
        sent++;
      }
    }
    res.json({ processed: rows.length, sent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send 1-day reminders' });
  }
});

// Weekly admin report: new signups, redemptions, active subscriptions
router.post('/weekly-report', async (req, res) => {
  const ok = await (await checkCronSecret(req))();
  if (!ok) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const supportEmail = await getSetting('support_email');
    if (!supportEmail) {
      return res.json({ sent: false, message: 'support_email not set' });
    }
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const [signups, redemptions, subs, users] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as c FROM users WHERE created_at >= $1', [start]),
      pool.query('SELECT COUNT(*)::int as c FROM redemptions WHERE redeemed_at >= $1', [start]),
      pool.query("SELECT COUNT(*)::int as c FROM subscriptions WHERE status = 'active'"),
      pool.query('SELECT COUNT(*)::int as c FROM users'),
    ]);
    const sent = await sendAdminWeeklyReport(supportEmail, {
      newSignups: signups.rows[0]?.c ?? 0,
      redemptions: redemptions.rows[0]?.c ?? 0,
      activeSubscriptions: subs.rows[0]?.c ?? 0,
      totalUsers: users.rows[0]?.c ?? 0,
    });
    res.json({ sent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send weekly report' });
  }
});

export default router;
