import { Router } from 'express';
import { pool } from '../config/db';
import { sendCouponExpiryReminder } from '../services/email';
import { getSetting } from '../services/settings';

const router = Router();

router.post('/coupon-expiry-reminders', async (req, res) => {
  const cronSecret = (await getSetting('cron_secret')) || process.env.CRON_SECRET || process.env.SEED_SECRET;
  if (cronSecret && req.headers['x-cron-secret'] !== cronSecret && req.query?.secret !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
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

export default router;
