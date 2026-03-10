import { Router } from 'express';
import { authMiddleware, hotelAuthMiddleware } from '../middleware/auth';
import type { JwtPayload, HotelJwtPayload } from '../middleware/auth';
import * as reviewModel from '../models/review';
import { pool } from '../config/db';

const router = Router();

router.get('/hotels/:hotelId', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId || '0');
    const sortVal = (req.query.sort as string) || 'recent';
    const sort = ['recent', 'rating_high', 'rating_low', 'verified_first'].includes(sortVal)
      ? (sortVal as reviewModel.ReviewSort)
      : 'recent';
    let userId: number | undefined;
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (token) {
        const jwt = await import('jsonwebtoken');
        const { config } = await import('../config');
        const decoded = jwt.verify(token, config.jwtSecret) as { userId?: number; type?: string };
        if (decoded?.type === 'user' && decoded.userId) userId = decoded.userId;
      }
    } catch {
      // no user
    }
    const [reviews, stats] = await Promise.all([
      reviewModel.findReviewsByHotelId(hotelId, sort, userId),
      reviewModel.getHotelAverageRating(hotelId),
    ]);
    res.json({
      reviews,
      averageRating: stats?.avg ?? null,
      totalCount: stats?.count ?? 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post(
  '/hotels/:hotelId',
  authMiddleware,
  async (req, res) => {
    try {
      const hotelId = parseInt(req.params.hotelId || '0');
      const { rating, comment } = req.body;
      const ratingNum = parseInt(String(rating), 10);
      if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      const userId = (req.user as JwtPayload).userId;
      const review = await reviewModel.createReview(hotelId, userId, ratingNum, comment);
      res.status(201).json(review);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  }
);

router.get('/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);
    const reviews = await reviewModel.findRecentReviews(limit);
    res.json({ reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalReviews = await reviewModel.getTotalReviewCount();
    res.json({ totalReviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.post(
  '/:reviewId/helpful',
  authMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.reviewId || '0');
      const { helpful } = req.body;
      const userId = (req.user as JwtPayload).userId;
      if (typeof helpful !== 'boolean') return res.status(400).json({ error: 'helpful must be true or false' });
      const { voteHelpful } = await import('../models/reviewHelpful');
      await voteHelpful(reviewId, userId, helpful);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to vote' });
    }
  }
);

router.post(
  '/:reviewId/response',
  hotelAuthMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.reviewId || '0');
      const { response_text } = req.body;
      const hotel = req.hotel as HotelJwtPayload;
      if (!hotel?.hotelId) return res.status(401).json({ error: 'Not authenticated' });
      if (!response_text || typeof response_text !== 'string' || response_text.trim().length === 0) {
        return res.status(400).json({ error: 'Response text required' });
      }
      const reviewCheck = await pool.query(
        'SELECT hotel_id FROM hotel_reviews WHERE id = $1',
        [reviewId]
      );
      if (!reviewCheck.rows[0] || reviewCheck.rows[0].hotel_id !== hotel.hotelId) {
        return res.status(403).json({ error: 'Cannot respond to this review' });
      }
      const hotelAccount = await pool.query(
        'SELECT id FROM hotel_accounts WHERE hotel_id = $1',
        [hotel.hotelId]
      );
      const hotelAccountId = hotelAccount.rows[0]?.id;
      if (!hotelAccountId) return res.status(500).json({ error: 'Hotel account not found' });
      await reviewModel.addHotelResponse(reviewId, hotelAccountId, response_text.trim());
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add response' });
    }
  }
);

router.get('/hotels/:hotelId/me', authMiddleware, async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId || '0');
    const userId = (req.user as JwtPayload).userId;
    const review = await reviewModel.findUserReview(hotelId, userId);
    res.json({ review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

export default router;
