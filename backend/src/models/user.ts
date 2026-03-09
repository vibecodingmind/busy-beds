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
