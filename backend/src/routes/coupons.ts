import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, hotelAuthMiddleware, type JwtPayload } from '../middleware/auth';
import * as couponService from '../services/couponService';
import * as couponModel from '../models/coupon';

const router = Router();

// Generate coupon (traveler auth)
router.post(
  '/generate',
  authMiddleware,
  body('hotel_id').isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { hotel_id } = req.body;
      const coupon = await couponService.generateCoupon((req.user as JwtPayload).userId, hotel_id);
      res.status(201).json(coupon);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate coupon';
      res.status(400).json({ error: msg });
    }
  }
);

// Cancel coupon (traveler auth)
router.post(
  '/cancel',
  authMiddleware,
  body('coupon_id').isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const ok = await couponModel.cancelCoupon(req.body.coupon_id, (req.user as JwtPayload).userId);
      if (!ok) return res.status(404).json({ error: 'Coupon not found or already used' });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to cancel' });
    }
  }
);

// Get user's coupons (traveler auth) – includes remind_1_day_before preference
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const coupons = await couponModel.findCouponsByUserId((req.user as JwtPayload).userId);
    res.json({ coupons });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Set "Remind me 1 day before" for a coupon (traveler auth). Body: { coupon_id, remind_1_day_before }
router.post(
  '/set-reminder',
  authMiddleware,
  body('coupon_id').isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const couponId = parseInt(String(req.body.coupon_id), 10);
      const remind1Day = req.body.remind_1_day_before !== false;
      const ok = await couponModel.setReminderPreference(couponId, (req.user as JwtPayload).userId, remind1Day);
      if (!ok) return res.status(404).json({ error: 'Coupon not found' });
      res.json({ remind_1_day_before: remind1Day });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update reminder' });
    }
  }
);

// Validate coupon (public - for redemption page)
router.get('/:code/validate', async (req, res) => {
  try {
    const coupon = await couponService.validateCoupon(req.params?.code ?? '');
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found or invalid' });
    }
    res.json({
      code: coupon.code,
      user_name: coupon.user_name,
      hotel_name: coupon.hotel_name,
      hotel_id: coupon.hotel_id,
      discount_value: coupon.discount_value,
      status: coupon.status,
      expires_at: coupon.expires_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// Redeem coupon (hotel auth required)
router.post(
  '/:code/redeem',
  hotelAuthMiddleware,
  async (req, res) => {
    try {
      if (!req.hotel) return res.status(401).json({ error: 'Hotel authentication required' });

      await couponService.redeemCoupon(
        req.params?.code ?? '',
        req.hotel.hotelAccountId,
        req.hotel.hotelId
      );
      res.json({ success: true, message: 'Coupon redeemed successfully' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Redemption failed';
      res.status(400).json({ error: msg });
    }
  }
);

export default router;
