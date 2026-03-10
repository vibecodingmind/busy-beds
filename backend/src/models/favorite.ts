import { pool } from '../config/db';

export async function addFavorite(userId: number, hotelId: number): Promise<void> {
  await pool.query(
    'INSERT INTO user_favorites (user_id, hotel_id) VALUES ($1, $2) ON CONFLICT (user_id, hotel_id) DO NOTHING',
    [userId, hotelId]
  );
}

export async function removeFavorite(userId: number, hotelId: number): Promise<void> {
  await pool.query('DELETE FROM user_favorites WHERE user_id = $1 AND hotel_id = $2', [userId, hotelId]);
}

export async function isFavorite(userId: number, hotelId: number): Promise<boolean> {
  const r = await pool.query(
    'SELECT 1 FROM user_favorites WHERE user_id = $1 AND hotel_id = $2',
    [userId, hotelId]
  );
  return r.rowCount !== null && r.rowCount > 0;
}

export async function getFavoriteHotelIds(userId: number): Promise<number[]> {
  const r = await pool.query(
    'SELECT hotel_id FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return r.rows.map((row) => row.hotel_id);
}
