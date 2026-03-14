import { pool } from '../config/db';

export interface UserActivity {
  id: number;
  user_id: number;
  action: string;
  details: Record<string, any>;
  created_at: Date;
}

export async function logUserActivity(userId: number, action: string, details: Record<string, any> = {}): Promise<UserActivity> {
  const result = await pool.query(
    `INSERT INTO user_activity_log (user_id, action, details)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, action, details, created_at`,
    [userId, action, details]
  );
  return result.rows[0]!;
}

export async function getUserActivity(userId: number, limit: number = 50): Promise<UserActivity[]> {
  const result = await pool.query(
    `SELECT id, user_id, action, details, created_at
     FROM user_activity_log
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}