/**
 * One-time seed endpoint for when local DB connection fails (e.g. Railway Postgres from Mac).
 * Call from browser or curl while backend is running on Railway.
 *
 * Usage: GET /api/v1/seed?secret=YOUR_SEED_SECRET
 *        GET /api/v1/seed/reviews?secret=YOUR_SEED_SECRET  (reviews only)
 * Set SEED_SECRET in Railway env vars.
 */
import { Router, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcrypt';
import { pool } from '../config/db';

const router = Router();

const REVIEWER_USERS = [
  { email: 'reviewer1@example.com', password: 'Review1!', name: 'Alex' },
  { email: 'reviewer2@example.com', password: 'Review2!', name: 'Sam' },
  { email: 'reviewer3@example.com', password: 'Review3!', name: 'Jordan' },
  { email: 'reviewer4@example.com', password: 'Review4!', name: 'Casey' },
];

const SAMPLE_COMMENTS = [
  'Great stay, would come back.',
  'Clean rooms and friendly staff.',
  'Good value for the location.',
  'Comfortable and quiet.',
  'Nice amenities and breakfast.',
  'Perfect for a weekend trip.',
  'Staff went above and beyond.',
  'Will recommend to friends.',
];

function checkSecret(req: Request): boolean {
  const secret = (req.query.secret as string) || (req.headers['x-seed-secret'] as string);
  const expected = process.env.SEED_SECRET;
  return !!expected && secret === expected;
}

router.get('/', async (req: Request, res: Response) => {
  if (!checkSecret(req)) {
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

/** Seed reviews only – adds 3–4 reviews per hotel. Use when you already have hotels and just need review data. */
router.get('/reviews', async (req: Request, res: Response) => {
  if (!checkSecret(req)) {
    res.status(403).json({ error: 'Invalid or missing secret' });
    return;
  }

  try {
    const ids: number[] = [];
    for (const u of REVIEWER_USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      const res = await pool.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'user')
         ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = $3
         RETURNING id`,
        [u.email, hash, u.name]
      );
      ids.push(res.rows[0].id);
    }

    const hotelsRes = await pool.query('SELECT id FROM hotels ORDER BY id');
    const hotelIds = hotelsRes.rows.map((r: { id: number }) => r.id);

    if (hotelIds.length === 0) {
      res.json({ success: true, message: 'No hotels to seed. Add hotels first.', inserted: 0 });
      return;
    }

    let inserted = 0;
    let commentIndex = 0;
    for (const hotelId of hotelIds) {
      const numReviews = Math.min(3 + (hotelId % 2), ids.length);
      const shuffled = [...ids].sort(() => Math.random() - 0.5);
      const reviewers = shuffled.slice(0, numReviews);
      for (const userId of reviewers) {
        const rating = 3 + Math.floor(Math.random() * 3);
        const comment = SAMPLE_COMMENTS[commentIndex % SAMPLE_COMMENTS.length];
        commentIndex++;
        await pool.query(
          `INSERT INTO hotel_reviews (hotel_id, user_id, rating, comment)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (hotel_id, user_id) DO UPDATE SET rating = $3, comment = $4, created_at = CURRENT_TIMESTAMP`,
          [hotelId, userId, rating, comment]
        );
        inserted++;
      }
    }

    console.log('[seed] Reviews:', inserted, 'across', hotelIds.length, 'hotels');
    res.json({ success: true, message: `Seeded ${inserted} reviews across ${hotelIds.length} properties.`, inserted });
  } catch (err) {
    console.error('[seed] Reviews failed:', err);
    res.status(500).json({ error: 'Seed reviews failed', details: err instanceof Error ? err.message : String(err) });
  }
});

/**
 * Create or update admin user from the server (e.g. on Railway). No local DB connection needed.
 * POST /api/v1/seed/admin?secret=SEED_SECRET
 * Body: { "email": "admin@example.com", "password": "YourPassword" }
 */
router.post('/admin', async (req: Request, res: Response) => {
  if (!checkSecret(req)) {
    res.status(403).json({ error: 'Invalid or missing secret. Use ?secret=YOUR_SEED_SECRET or header x-seed-secret.' });
    return;
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    res.status(400).json({ error: 'Body must include email and password.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, 'Admin', 'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = 'Admin', role = 'admin'`,
      [email, hash]
    );
    console.log('[seed] Admin user', email, 'created/updated');
    res.json({ success: true, message: `Admin user ${email} created/updated. You can log in now.` });
  } catch (err) {
    console.error('[seed] Admin create failed:', err);
    res.status(500).json({ error: 'Failed to create admin', details: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
