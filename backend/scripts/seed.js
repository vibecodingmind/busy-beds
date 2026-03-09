/**
 * Run seed data (subscription plans + sample hotels).
 * Usage: DATABASE_URL=... node scripts/seed.js
 */
const { readFileSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const seedPath = join(__dirname, '../../database/seed.sql');
    const sql = readFileSync(seedPath, 'utf-8');
    await pool.query(sql);
    console.log('Seed completed');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
