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

    // 2. Seed (plans + hotels)
    const seedPath = join(__dirname, '../../../database/seed.sql');
    const seed = readFileSync(seedPath, 'utf-8');
    await pool.query(seed);
    console.log('[seed] Plans + hotels seeded');

    // 3. Test users
    const users = [
      { email: 'admin@busybeds.com', password: 'admin123', name: 'Admin', role: 'admin' },
      { email: 'guest@busybeds.com', password: 'guest123', name: 'Test Guest', role: 'user' },
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

    const hotelRes = await pool.query('SELECT id FROM hotels WHERE name = $1', ['Grand Plaza Hotel']);
    const hotelId = hotelRes.rows[0]?.id;
    if (hotelId) {
      const hash = await bcrypt.hash('hotel123', 10);
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
