import { pool } from '../config/db';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  created_at: Date;
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
  data: { name?: string; email?: string; password_hash?: string }
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
  if (updates.length === 0) return findUserById(id);
  values.push(id);
  const result = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}
