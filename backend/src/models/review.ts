import { pool } from '../config/db';

export interface HotelReview {
  id: number;
  hotel_id: number;
  user_id: number;
  rating: number;
  comment: string | null;
  created_at: Date;
}

export interface ReviewWithExtras extends HotelReview {
  user_name: string;
  verified_guest?: boolean;
  hotel_response?: { response_text: string; created_at: string };
}

export type ReviewSort = 'recent' | 'rating_high' | 'rating_low' | 'verified_first';

export interface ReviewWithHelpful extends ReviewWithExtras {
  helpful_count?: number;
  not_helpful_count?: number;
  user_vote?: boolean | null;
}

export async function findReviewsByHotelId(
  hotelId: number,
  sort: ReviewSort = 'recent',
  userId?: number
): Promise<ReviewWithHelpful[]> {
  const orderBy =
    sort === 'rating_high'
      ? 'r.rating DESC, r.created_at DESC'
      : sort === 'rating_low'
        ? 'r.rating ASC, r.created_at DESC'
        : sort === 'verified_first'
          ? 'verified_guest DESC, r.created_at DESC'
          : 'r.created_at DESC';
  const result = await pool.query(
    `SELECT r.*, u.name as user_name,
       EXISTS(SELECT 1 FROM coupons c WHERE c.user_id = r.user_id AND c.hotel_id = r.hotel_id AND c.status = 'redeemed') as verified_guest,
       hr.response_text as hotel_response_text,
       hr.created_at as hotel_response_at,
       (SELECT COUNT(*)::int FROM review_helpful_votes rhv WHERE rhv.review_id = r.id AND rhv.helpful = true) as helpful_count,
       (SELECT COUNT(*)::int FROM review_helpful_votes rhv WHERE rhv.review_id = r.id AND rhv.helpful = false) as not_helpful_count
     FROM hotel_reviews r
     JOIN users u ON r.user_id = u.id
     LEFT JOIN hotel_review_responses hr ON hr.review_id = r.id
     WHERE r.hotel_id = $1
     ORDER BY ${orderBy}`,
    [hotelId]
  );
  let rows = result.rows;
  let userVotes: Map<number, boolean> | null = null;
  if (userId) {
    const r2 = await pool.query(
      'SELECT review_id, helpful FROM review_helpful_votes WHERE review_id IN (SELECT id FROM hotel_reviews WHERE hotel_id = $1) AND user_id = $2',
      [hotelId, userId]
    );
    userVotes = new Map(r2.rows.map((r: { review_id: number; helpful: boolean }) => [r.review_id, r.helpful]));
  }
  return rows.map((row) => ({
    ...row,
    verified_guest: Boolean(row.verified_guest),
    hotel_response: row.hotel_response_text
      ? { response_text: row.hotel_response_text, created_at: row.hotel_response_at }
      : undefined,
    helpful_count: row.helpful_count ?? 0,
    not_helpful_count: row.not_helpful_count ?? 0,
    user_vote: userVotes?.get(row.id) ?? null,
  }));
}

export async function addHotelResponse(
  reviewId: number,
  hotelAccountId: number,
  responseText: string
): Promise<void> {
  await pool.query(
    `INSERT INTO hotel_review_responses (review_id, hotel_account_id, response_text)
     VALUES ($1, $2, $3)
     ON CONFLICT (review_id) DO UPDATE SET response_text = $3, hotel_account_id = $2`,
    [reviewId, hotelAccountId, responseText]
  );
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

export async function findRecentReviews(limit = 5): Promise<{ id: number; rating: number; comment: string | null; user_name: string; hotel_name: string; created_at: Date }[]> {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name, h.name as hotel_name
     FROM hotel_reviews r
     JOIN users u ON r.user_id = u.id
     JOIN hotels h ON r.hotel_id = h.id
     ORDER BY r.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getTotalReviewCount(): Promise<number> {
  const result = await pool.query('SELECT COUNT(*)::int as count FROM hotel_reviews');
  return result.rows[0]?.count || 0;
}
