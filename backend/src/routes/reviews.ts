import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import type { JwtPayload } from '../middleware/auth';
import * as reviewModel from '../models/review';

const router = Router();

router.get('/hotels/:hotelId', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId || '0');
    const [reviews, stats] = await Promise.all([
      reviewModel.findReviewsByHotelId(hotelId),
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
