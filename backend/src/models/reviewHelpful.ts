import { pool } from '../config/db';

export async function voteHelpful(reviewId: number, userId: number, helpful: boolean): Promise<void> {
  await pool.query(
    `INSERT INTO review_helpful_votes (review_id, user_id, helpful)
     VALUES ($1, $2, $3)
     ON CONFLICT (review_id, user_id) DO UPDATE SET helpful = $3`,
    [reviewId, userId, helpful]
  );
}

export async function getHelpfulCounts(reviewIds: number[]): Promise<Map<number, { helpful: number; notHelpful: number }>> {
  if (reviewIds.length === 0) return new Map();
  const result = await pool.query(
    `SELECT review_id, helpful, COUNT(*)::int as cnt
     FROM review_helpful_votes
     WHERE review_id = ANY($1::int[])
     GROUP BY review_id, helpful`,
    [reviewIds]
  );
  const map = new Map<number, { helpful: number; notHelpful: number }>();
  for (const id of reviewIds) {
    map.set(id, { helpful: 0, notHelpful: 0 });
  }
  for (const row of result.rows) {
    const current = map.get(row.review_id) || { helpful: 0, notHelpful: 0 };
    if (row.helpful) current.helpful = row.cnt;
    else current.notHelpful = row.cnt;
    map.set(row.review_id, current);
  }
  return map;
}

export async function getUserVotes(reviewIds: number[], userId: number): Promise<Map<number, boolean | null>> {
  if (reviewIds.length === 0 || !userId) return new Map();
  const result = await pool.query(
    'SELECT review_id, helpful FROM review_helpful_votes WHERE review_id = ANY($1::int[]) AND user_id = $2',
    [reviewIds, userId]
  );
  const map = new Map<number, boolean | null>();
  for (const row of result.rows) {
    map.set(row.review_id, row.helpful);
  }
  return map;
}
