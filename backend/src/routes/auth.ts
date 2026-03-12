import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import * as userModel from '../models/user';
import * as referralModel from '../models/referral';
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from '../services/email';
import { authMiddleware, type JwtPayload } from '../middleware/auth';
import { config } from '../config';
import { Pool } from 'pg';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { logger } from '../config/logger';
import { validate, validationSchemas, sanitizeInput, commonValidations } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { refreshTokenHandler, invalidateTokensHandler, refreshTokenService } from '../middleware/refreshToken';

const router = Router();
const pool = new Pool({ connectionString: config.databaseUrl });

router.post(
  '/register',
  sanitizeInput,
  authLimiter,
  validate(validationSchemas.register),
  asyncHandler(async (req: Request, res: Response) => {
      const { email, password, name } = req.body;

      const existing = await userModel.findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hash = await bcrypt.hash(password, 10);
      const user = await userModel.createUser(email, hash, name);

      const refCode = req.body.referral_code || (req.query && req.query.ref);
      if (refCode) {
        const referrerId = await referralModel.findReferrerByCode(String(refCode));
        if (referrerId && referrerId !== user.id) {
          await referralModel.createReferral(referrerId, user.id).catch(() => {});
        }
      }

      sendWelcomeEmail(user.email, user.name).catch(() => {});

      // Generate token pair
      const tokenPair = refreshTokenService.generateTokenPair(user);

      const fullUser = await userModel.findUserById(user.id);
      res.status(201).json({
        user: {
          id: fullUser!.id,
          email: fullUser!.email,
          name: fullUser!.name,
          role: fullUser!.role,
          avatar_url: fullUser!.avatar_url ?? null,
          phone: fullUser!.phone ?? null,
          email_verified: fullUser!.email_verified ?? false,
        },
        token: tokenPair.accessToken,
      });
    })
  );

router.post(
  '/login',
  sanitizeInput,
  authLimiter,
  validate(validationSchemas.login),
  asyncHandler(async (req: Request, res: Response) => {
      const { email, password } = req.body;

      const user = await userModel.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token pair
      const tokenPair = refreshTokenService.generateTokenPair(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar_url: user.avatar_url ?? null,
          phone: user.phone ?? null,
          email_verified: user.email_verified ?? false,
        },
        token: tokenPair.accessToken,
      });
    })
  );

router.get('/me', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const user = await userModel.findUserById((req.user as JwtPayload).userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar_url: user.avatar_url ?? null,
    phone: user.phone ?? null,
    email_verified: user.email_verified ?? false,
  });
}));

// User stats: redemptions this month (loyalty / streaks)
router.get('/me/stats', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const userId = (req.user as JwtPayload).userId;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const r = await pool.query(
    `SELECT COUNT(*)::int as count FROM redemptions rd
     JOIN coupons c ON c.id = rd.coupon_id
     WHERE c.user_id = $1 AND rd.redeemed_at >= $2`,
    [userId, startOfMonth]
  );
  res.json({ redemptions_this_month: r.rows[0]?.count ?? 0 });
}));

router.put(
  '/profile',
  sanitizeInput,
  authMiddleware,
  validate(validationSchemas.updateProfile),
  asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const { name, email, phone, avatar_url } = req.body;
      if (email) {
        const existing = await userModel.findUserByEmail(email);
        if (existing && existing.id !== (req.user as JwtPayload).userId) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }
      const user = await userModel.updateUser((req.user as JwtPayload).userId, {
        name,
        email,
        phone: phone !== undefined ? phone : undefined,
        avatar_url: avatar_url !== undefined ? avatar_url : undefined,
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url ?? null,
        phone: user.phone ?? null,
        email_verified: user.email_verified ?? false,
      });
    })
  );

router.put(
  '/change-password',
  sanitizeInput,
  authMiddleware,
  validate(validationSchemas.changePassword),
  asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const user = await userModel.findUserById((req.user as JwtPayload).userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const match = await bcrypt.compare(req.body.current_password, user.password_hash);
      if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
      const hash = await bcrypt.hash(req.body.new_password, 10);
      await userModel.updateUser(user.id, { password_hash: hash });
      res.json({ message: 'Password updated successfully' });
    })
  );

// Forgot password
router.post(
  '/forgot-password',
  sanitizeInput,
  passwordResetLimiter,
  validate(validationSchemas.forgotPassword),
  asyncHandler(async (req: Request, res: Response) => {
      const { email } = req.body;
      const user = await userModel.findUserByEmail(email);
      if (!user) {
        return res.json({ message: 'If that email exists, we sent a reset link' });
      }
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt]
      );
      const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);
      if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
        return res.json({ message: 'Reset link (dev only)', resetUrl });
      }
      return res.json({ message: 'If that email exists, we sent a reset link' });
    })
  );

// Reset password
router.post(
  '/reset-password',
  sanitizeInput,
  validate(validationSchemas.resetPassword),
  asyncHandler(async (req: Request, res: Response) => {
      const { token, password } = req.body;
      const r = await pool.query(
        'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
        [token]
      );
      if (r.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset link' });
      }
      const userId = r.rows[0].user_id;
      const hash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
      await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
      res.json({ message: 'Password reset successfully' });
    })
  );

// Resend verification email
router.post(
  '/resend-verification',
  sanitizeInput,
  validate([commonValidations.email]),
  asyncHandler(async (req: Request, res: Response) => {
      const { email } = req.body;
      const user = await userModel.findUserByEmail(email);
      if (!user) {
        return res.json({ message: 'If that email exists, we sent a verification link' });
      }
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await pool.query(
        'DELETE FROM email_verification_tokens WHERE user_id = $1',
        [user.id]
      );
      await pool.query(
        'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt]
      );
      const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;
      sendVerificationEmail(user.email, verifyUrl).catch((err) => console.error('Verification email send error:', err));
      if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
        return res.json({ message: 'Verification link (dev only)', verifyUrl });
      }
      return res.json({ message: 'If that email exists, we sent a verification link' });
    })
  );

// Verify email
router.post(
  '/verify-email',
  sanitizeInput,
  validate([body('token').notEmpty().withMessage('Token is required')]),
  asyncHandler(async (req: Request, res: Response) => {
      const { token } = req.body;
      const r = await pool.query(
        'SELECT user_id FROM email_verification_tokens WHERE token = $1 AND expires_at > NOW()',
        [token]
      );
      if (r.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired verification link' });
      }
      const userId = r.rows[0].user_id;
      await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [userId]);
      await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
      res.json({ message: 'Email verified successfully' });
    })
  );

// Refresh token endpoint
router.post(
  '/refresh-token',
  sanitizeInput,
  validate([body('refreshToken').notEmpty().withMessage('Refresh token is required')]),
  asyncHandler(refreshTokenHandler)
);

// Logout/invalidate tokens endpoint
router.post(
  '/logout',
  authMiddleware,
  asyncHandler(invalidateTokensHandler)
);

export default router;
