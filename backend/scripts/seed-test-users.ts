/**
 * Seed test users for development/staging.
 * Run after migrate + seed: npx tsx scripts/seed-test-users.ts
 *
 * Creates: Admin, Guest, Hotel Owner (all with known passwords)
 */
import bcrypt from 'bcrypt';
import { pool } from '../src/config/db';

const TEST_USERS = [
  { email: 'admin@busybeds.com', password: 'admin123', name: 'Admin', role: 'admin' },
  { email: 'guest@busybeds.com', password: 'guest123', name: 'Test Guest', role: 'user' },
];

const HOTEL_ACCOUNTS = [
  { email: 'hotel@busybeds.com', password: 'hotel123', name: 'Hotel Manager', hotelName: 'Grand Plaza Hotel' },
];

async function main() {
  for (const u of TEST_USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = $3, role = $4`,
      [u.email, hash, u.name, u.role]
    );
    console.log(`User ${u.email} (${u.role}) created/updated.`);
  }

  for (const h of HOTEL_ACCOUNTS) {
    const hotelRes = await pool.query('SELECT id FROM hotels WHERE name = $1', [h.hotelName]);
    const hotelId = hotelRes.rows[0]?.id;
    if (!hotelId) {
      console.warn(`Hotel "${h.hotelName}" not found, skipping hotel account.`);
      continue;
    }

    const existing = await pool.query('SELECT id FROM hotel_accounts WHERE hotel_id = $1', [hotelId]);
    if (existing.rows.length > 0) {
      const hash = await bcrypt.hash(h.password, 10);
      await pool.query(
        'UPDATE hotel_accounts SET password_hash = $1, name = $2, approved = true WHERE hotel_id = $3',
        [hash, h.name, hotelId]
      );
      console.log(`Hotel account ${h.email} updated.`);
    } else {
      const hash = await bcrypt.hash(h.password, 10);
      await pool.query(
        `INSERT INTO hotel_accounts (hotel_id, email, password_hash, name, approved)
         VALUES ($1, $2, $3, $4, true)`,
        [hotelId, h.email, hash, h.name]
      );
      console.log(`Hotel account ${h.email} created.`);
    }
  }

  console.log('\nTest users ready. See TEST-USERS.md for credentials.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
