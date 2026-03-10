import { pool } from '../config/db';

export interface HotelReview {
  id: number;
  hotel_id: number;
  user_id: number;
  rating: number;
  comment: string | null;
  created_at: Date;
}

export async function findReviewsByHotelId(hotelId: number): Promise<(HotelReview & { user_name: string })[]> {
  const result = await pool.query(
    `SELECT r.*, u.name as user_name
     FROM hotel_reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.hotel_id = $1
     ORDER BY r.created_at DESC`,
    [hotelId]
  );
  return result.rows;
}

export async function getHotelAverageRating(hotelId: number): Promise<{ avg: number; count: number } | null> {
  const result = await pool.query(
    'SELECT AVG(rating)::float as avg, COUNT(*)::int as count FROM hotel_reviews WHERE hotel_id = $1',
    [hotelId]
  );
  const row = result.rows[0];
  return row ? { avg: parseFloat(row.avg) || 0, count: row.count || 0 } : null;
}

export async function createReview(
  hotelId: number,
  userId: number,
  rating: number,
  comment?: string
): Promise<HotelReview> {
  const result = await pool.query(
    `INSERT INTO hotel_reviews (hotel_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (hotel_id, user_id) DO UPDATE SET rating = $3, comment = $4, created_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [hotelId, userId, rating, comment || null]
  );
  return result.rows[0];
}

export async function findUserReview(hotelId: number, userId: number): Promise<HotelReview | null> {
  const result = await pool.query(
    'SELECT * FROM hotel_reviews WHERE hotel_id = $1 AND user_id = $2',
    [hotelId, userId]
  );
  return result.rows[0] || null;
}
