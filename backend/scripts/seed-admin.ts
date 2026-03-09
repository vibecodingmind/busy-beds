/**
 * Seed admin user. Run: npx tsx scripts/seed-admin.ts
 * Usage: ADMIN_EMAIL=admin@busybeds.com ADMIN_PASSWORD=admin123 npx tsx scripts/seed-admin.ts
 */
import bcrypt from 'bcrypt';
import { pool } from '../src/config/db';

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@busybeds.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, 'Admin', 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
    [email, hash]
  );
  console.log(`Admin user ${email} created/updated.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
