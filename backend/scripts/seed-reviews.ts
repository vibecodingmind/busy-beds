/**
 * Seed a few reviews for all properties.
 * Run after migrate + seed (and optionally seed-test-users): npx tsx scripts/seed-reviews.ts
 *
 * Creates reviewer users if needed, then inserts 3–4 reviews per hotel with ratings and comments.
 */
import bcrypt from 'bcrypt';
import { pool } from '../src/config/db';

const REVIEWER_USERS = [
  { email: 'reviewer1@example.com', password: 'Review1!', name: 'Alex' },
  { email: 'reviewer2@example.com', password: 'Review2!', name: 'Sam' },
  { email: 'reviewer3@example.com', password: 'Review3!', name: 'Jordan' },
  { email: 'reviewer4@example.com', password: 'Review4!', name: 'Casey' },
];

const SAMPLE_COMMENTS = [
  'Great stay, would come back.',
  'Clean rooms and friendly staff.',
  'Good value for the location.',
  'Comfortable and quiet.',
  'Nice amenities and breakfast.',
  'Perfect for a weekend trip.',
  'Staff went above and beyond.',
  'Will recommend to friends.',
];

async function ensureReviewerUsers(): Promise<number[]> {
  const ids: number[] = [];
  for (const u of REVIEWER_USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    const res = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'user')
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = $3
       RETURNING id`,
      [u.email, hash, u.name]
    );
    ids.push(res.rows[0].id);
  }
  return ids;
}

async function getHotelIds(): Promise<number[]> {
  const res = await pool.query('SELECT id FROM hotels ORDER BY id');
  return res.rows.map((r: { id: number }) => r.id);
}

async function main() {
  const [userIds, hotelIds] = await Promise.all([ensureReviewerUsers(), getHotelIds()]);
  console.log(`Using ${userIds.length} reviewer users and ${hotelIds.length} hotels.`);

  if (hotelIds.length === 0) {
    console.log('No hotels found. Run database/seed.sql first.');
    process.exit(0);
    return;
  }

  let inserted = 0;
  let commentIndex = 0;

  for (const hotelId of hotelIds) {
    // Assign 3–4 different users to review this hotel
    const numReviews = Math.min(3 + (hotelId % 2), userIds.length);
    const shuffled = [...userIds].sort(() => Math.random() - 0.5);
    const reviewers = shuffled.slice(0, numReviews);

    for (const userId of reviewers) {
      const rating = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
      const comment = SAMPLE_COMMENTS[commentIndex % SAMPLE_COMMENTS.length];
      commentIndex++;

      await pool.query(
        `INSERT INTO hotel_reviews (hotel_id, user_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (hotel_id, user_id) DO UPDATE SET rating = $3, comment = $4, created_at = CURRENT_TIMESTAMP`,
        [hotelId, userId, rating, comment]
      );
      inserted++;
    }
  }

  console.log(`Seeded ${inserted} reviews across ${hotelIds.length} properties.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
