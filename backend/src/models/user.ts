import { pool } from '../config/db';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  created_at: Date;
  avatar_url?: string | null;
  phone?: string | null;
  email_verified?: boolean | null;
  whatsapp_opt_in?: boolean | null;
  active?: boolean | null;
  notif_coupon_expiry?: boolean | null;
  notif_promos?: boolean | null;
  notif_new_hotels?: boolean | null;
  totp_secret?: string | null;
  totp_enabled?: boolean | null;
  totp_backup_codes?: string | null;
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string,
  role: string = 'user'
): Promise<User> {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, password_hash, name, role, created_at`,
    [email, passwordHash, name, role]
  );
  return result.rows[0]!;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

export async function findUserById(id: number): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function updateUser(
  id: number,
  data: { name?: string; email?: string; password_hash?: string; avatar_url?: string | null; phone?: string | null; whatsapp_opt_in?: boolean | null; active?: boolean | null; notif_coupon_expiry?: boolean | null; notif_promos?: boolean | null; notif_new_hotels?: boolean | null; totp_secret?: string | null; totp_enabled?: boolean | null; totp_backup_codes?: string | null }
): Promise<User | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (data.name !== undefined) {
    updates.push(`name = $${i++}`);
    values.push(data.name);
  }
  if (data.email !== undefined) {
    updates.push(`email = $${i++}`);
    values.push(data.email);
  }
  if (data.password_hash !== undefined) {
    updates.push(`password_hash = $${i++}`);
    values.push(data.password_hash);
  }
  if (data.avatar_url !== undefined) {
    updates.push(`avatar_url = $${i++}`);
    values.push(data.avatar_url);
  }
  if (data.phone !== undefined) {
    updates.push(`phone = $${i++}`);
    values.push(data.phone);
  }
  if (data.whatsapp_opt_in !== undefined) {
    updates.push(`whatsapp_opt_in = $${i++}`);
    values.push(!!data.whatsapp_opt_in);
  }
  if (data.active !== undefined) {
    updates.push(`active = $${i++}`);
    values.push(!!data.active);
  }
  if (data.notif_coupon_expiry !== undefined) {
    updates.push(`notif_coupon_expiry = $${i++}`);
    values.push(!!data.notif_coupon_expiry);
  }
  if (data.notif_promos !== undefined) {
    updates.push(`notif_promos = $${i++}`);
    values.push(!!data.notif_promos);
  }
  if (data.notif_new_hotels !== undefined) {
    updates.push(`notif_new_hotels = $${i++}`);
    values.push(!!data.notif_new_hotels);
  }
  if (data.totp_secret !== undefined) {
    updates.push(`totp_secret = $${i++}`);
    values.push(data.totp_secret);
  }
  if (data.totp_enabled !== undefined) {
    updates.push(`totp_enabled = $${i++}`);
    values.push(!!data.totp_enabled);
  }
  if (data.totp_backup_codes !== undefined) {
    updates.push(`totp_backup_codes = $${i++}`);
    values.push(data.totp_backup_codes);
  }
  if (updates.length === 0) return findUserById(id);
  values.push(id);
  const result = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}
