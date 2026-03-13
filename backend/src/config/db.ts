import { Pool } from 'pg';
import { config } from './index';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,                // maximum pool size
  idleTimeoutMillis: 30_000,  // close idle connections after 30s
  connectionTimeoutMillis: 5_000, // fail if connection not acquired in 5s
});
