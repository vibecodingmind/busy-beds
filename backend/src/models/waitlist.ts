import { pool } from '../config/db';

export async function addToWaitlist(email: string): Promise<void> {
  await pool.query(
    'INSERT INTO hotel_waitlist (email) VALUES (LOWER(TRIM($1))) ON CONFLICT (email) DO NOTHING',
    [email]
  );
}
