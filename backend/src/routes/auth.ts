import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import * as userModel from '../models/user';
import * as referralModel from '../models/referral';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email';
import { authMiddleware, type JwtPayload } from '../middleware/auth';
import { config } from '../config';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: config.databaseUrl });

router.post(
  '/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
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

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'user',
      };
      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);

      res.status(201).json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password } = req.body;

      const user = await userModel.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'user',
      };
      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);

      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.get('/me', authMiddleware, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const user = await userModel.findUserById((req.user as JwtPayload).userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.put(
  '/profile',
  authMiddleware,
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const { name, email } = req.body;
      if (email) {
        const existing = await userModel.findUserByEmail(email);
        if (existing && existing.id !== (req.user as JwtPayload).userId) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }
      const user = await userModel.updateUser((req.user as JwtPayload).userId, { name, email });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

router.put(
  '/change-password',
  authMiddleware,
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const user = await userModel.findUserById((req.user as JwtPayload).userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const match = await bcrypt.compare(req.body.current_password, user.password_hash);
      if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
      const hash = await bcrypt.hash(req.body.new_password, 10);
      await userModel.updateUser(user.id, { password_hash: hash });
      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// Forgot password
router.post(
  '/forgot-password',
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
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
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// Reset password
router.post(
  '/reset-password',
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
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
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// Resend verification email
router.post(
  '/resend-verification',
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
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
      if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
        return res.json({ message: 'Verification link (dev only)', verifyUrl });
      }
      return res.json({ message: 'If that email exists, we sent a verification link' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// Verify email
router.post(
  '/verify-email',
  body('token').notEmpty(),
  async (req, res) => {
    try {
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
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  }
);

export default router;
