/**
 * Seed admin user. Run from backend/ with DATABASE_URL pointing at your DB.
 * From your machine use Railway's *public* Postgres URL (not postgres.railway.internal).
 *
 * Usage (run from backend/ directory):
 *   DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/railway" ADMIN_EMAIL=your@email.com ADMIN_PASSWORD='YourPassword' npx tsx scripts/seed-admin.ts
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

import bcrypt from 'bcrypt';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !databaseUrl.startsWith('postgresql://') || databaseUrl.includes('railway.internal')) {
  console.error('DATABASE_URL must be set to a valid Postgres URL (use Railway public URL, not .internal).');
  console.error('Example: DATABASE_URL="postgresql://postgres:XXX@containers-us-west-XXX.railway.app:5432/railway" ADMIN_EMAIL=you@email.com ADMIN_PASSWORD="pwd" npx tsx scripts/seed-admin.ts');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

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
  await pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
