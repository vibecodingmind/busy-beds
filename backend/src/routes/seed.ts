/**
 * One-time seed endpoint for when local DB connection fails (e.g. Railway Postgres from Mac).
 * Call from browser or curl while backend is running on Railway.
 *
 * Usage: GET /api/v1/seed?secret=YOUR_SEED_SECRET
 * Set SEED_SECRET in Railway env vars.
 */
import { Router, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcrypt';
import { pool } from '../config/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const secret = req.query.secret as string;
  const expected = process.env.SEED_SECRET;
  if (!expected || secret !== expected) {
    res.status(403).json({ error: 'Invalid or missing secret' });
    return;
  }

  try {
    // 1. Migrate (schema)
    const schemaPath = join(__dirname, '../../scripts/schema.init.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('[seed] Migration completed');

    // 2. Seed (plans + hotels) - use backend/scripts/seed-data.sql (database/ not deployed with backend)
    const seedPath = join(__dirname, '../../scripts/seed-data.sql');
    const seed = readFileSync(seedPath, 'utf-8');
    await pool.query(seed);
    console.log('[seed] Plans + hotels seeded');

    // 3. Test users
    const users = [
      { email: 'admin@busybeds.com', password: 'Admin123!', name: 'Admin', role: 'admin' },
      { email: 'guest@busybeds.com', password: 'Guest123!', name: 'Test Guest', role: 'user' },
      { email: 'demo@busybeds.com', password: 'Demo123!', name: 'Demo User', role: 'user' },
    ];
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      await pool.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = $3, role = $4`,
        [u.email, hash, u.name, u.role]
      );
    }

    // 4. Give guests an active Basic subscription so they can generate coupons
    const planRes = await pool.query('SELECT id FROM subscription_plans WHERE name = $1', ['Basic']);
    const planId = planRes.rows[0]?.id;
    if (planId) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      for (const email of ['guest@busybeds.com', 'demo@busybeds.com']) {
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        const userId = userRes.rows[0]?.id;
        if (userId) {
          await pool.query(
            `INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
             VALUES ($1, $2, 'active', $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET plan_id = $2, status = 'active',
               current_period_start = $3, current_period_end = $4`,
            [userId, planId, now, periodEnd]
          );
        }
      }
    }

    // 5. Hotel account
    const hotelRes = await pool.query('SELECT id FROM hotels WHERE name = $1', ['Grand Plaza Hotel']);
    const hotelId = hotelRes.rows[0]?.id;
    if (hotelId) {
      const hash = await bcrypt.hash('Hotel123!', 10);
      const existing = await pool.query('SELECT id FROM hotel_accounts WHERE hotel_id = $1', [hotelId]);
      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE hotel_accounts SET password_hash = $1, name = $2, approved = true WHERE hotel_id = $3',
          [hash, 'Hotel Manager', hotelId]
        );
      } else {
        await pool.query(
          `INSERT INTO hotel_accounts (hotel_id, email, password_hash, name, approved)
           VALUES ($1, $2, $3, $4, true)`,
          [hotelId, 'hotel@busybeds.com', hash, 'Hotel Manager']
        );
      }
    }
    console.log('[seed] Test users created');

    res.json({ success: true, message: 'Seed completed. See TEST-USERS.md for credentials.' });
  } catch (err) {
    console.error('[seed] Failed:', err);
    res.status(500).json({ error: 'Seed failed', details: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
