/**
 * Run idempotent schema migration. Safe to run on every deploy.
 * Usage: DATABASE_URL=... node scripts/migrate.js
 */
const { readFileSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('DATABASE_URL not set, skipping migration');
    process.exit(0);
    return;
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const schemaPath = join(__dirname, 'schema.init.sql');
    const sql = readFileSync(schemaPath, 'utf-8');
    await pool.query(sql);
    console.log('Migration completed');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
