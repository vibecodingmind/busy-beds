import { pool } from '../config/db';

export interface HotelAccount {
  id: number;
  hotel_id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
}

export async function createHotelAccount(
  hotelId: number,
  email: string,
  passwordHash: string,
  name: string
): Promise<HotelAccount> {
  const result = await pool.query(
    `INSERT INTO hotel_accounts (hotel_id, email, password_hash, name)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [hotelId, email, passwordHash, name]
  );
  return result.rows[0]!;
}

export async function findHotelAccountByEmail(email: string): Promise<HotelAccount | null> {
  const result = await pool.query(
    'SELECT * FROM hotel_accounts WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

export async function findHotelAccountById(id: number): Promise<HotelAccount | null> {
  const result = await pool.query('SELECT * FROM hotel_accounts WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function findHotelsWithoutAccount(): Promise<{ id: number; name: string }[]> {
  const result = await pool.query(
    `SELECT h.id, h.name FROM hotels h
     LEFT JOIN hotel_accounts ha ON h.id = ha.hotel_id
     WHERE ha.id IS NULL`
  );
  return result.rows;
}

export async function findHotelAccountByHotelId(hotelId: number): Promise<HotelAccount | null> {
  const result = await pool.query('SELECT * FROM hotel_accounts WHERE hotel_id = $1', [hotelId]);
  return result.rows[0] || null;
}
