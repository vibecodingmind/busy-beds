import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import * as userModel from '../models/user';
import * as referralModel from '../models/referral';
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from '../services/email';
import { logUserActivity, getUserActivity } from '../services/activityLog';
import { authMiddleware, type JwtPayload } from '../middleware/auth';
import { config } from '../config';
import { pool } from '../config/db';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { logger } from '../config/logger';
import { validate, validationSchemas, sanitizeInput, commonValidations } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { refreshTokenHandler, invalidateTokensHandler, refreshTokenService } from '../middleware/refreshToken';
import { authenticator } from '@otplib/preset-default';
import qrcode from 'qrcode';

const router = Router();

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
          whatsapp_opt_in: (fullUser as { whatsapp_opt_in?: boolean }).whatsapp_opt_in ?? false,
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
      const isInactive = (user as { active?: boolean }).active === false;
      if (isInactive) {
        return res.status(403).json({ error: 'Account is inactive. Please contact support.' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Log login activity (non-blocking — never fail the login if logging fails)
      logUserActivity(user.id, 'login', {
        ip: req.ip,
        user_agent: req.get('User-Agent'),
      }).catch((err: unknown) => console.error('Activity log error:', err));

      // Check if 2FA is enabled
      if ((user as { totp_enabled?: boolean }).totp_enabled) {
        // Return temporary token for 2FA challenge
        const tempToken = jwt.sign(
          { userId: user.id, email: user.email, role: user.role, type: '2fa_pending' },
          config.jwtSecret,
          { expiresIn: '5m' }
        );
        return res.json({
          requires_2fa: true,
          temp_token: tempToken,
        });
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
          whatsapp_opt_in: (user as { whatsapp_opt_in?: boolean }).whatsapp_opt_in ?? false,
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
    whatsapp_opt_in: (user as { whatsapp_opt_in?: boolean }).whatsapp_opt_in ?? false,
    notif_coupon_expiry: (user as { notif_coupon_expiry?: boolean }).notif_coupon_expiry ?? true,
    notif_promos: (user as { notif_promos?: boolean }).notif_promos ?? true,
    notif_new_hotels: (user as { notif_new_hotels?: boolean }).notif_new_hotels ?? false,
    totp_enabled: (user as { totp_enabled?: boolean }).totp_enabled ?? false,
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
      const { name, email, phone, avatar_url, whatsapp_opt_in, notif_coupon_expiry, notif_promos, notif_new_hotels } = req.body;
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
        whatsapp_opt_in: whatsapp_opt_in !== undefined ? !!whatsapp_opt_in : undefined,
        notif_coupon_expiry: notif_coupon_expiry !== undefined ? !!notif_coupon_expiry : undefined,
        notif_promos: notif_promos !== undefined ? !!notif_promos : undefined,
        notif_new_hotels: notif_new_hotels !== undefined ? !!notif_new_hotels : undefined,
      });
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Log profile update activity
      await logUserActivity((req.user as JwtPayload).userId, 'profile_update', {
        changes: Object.keys(req.body),
      });

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url ?? null,
        phone: user.phone ?? null,
        email_verified: user.email_verified ?? false,
        whatsapp_opt_in: (user as { whatsapp_opt_in?: boolean }).whatsapp_opt_in ?? false,
        notif_coupon_expiry: (user as { notif_coupon_expiry?: boolean }).notif_coupon_expiry ?? true,
        notif_promos: (user as { notif_promos?: boolean }).notif_promos ?? true,
        notif_new_hotels: (user as { notif_new_hotels?: boolean }).notif_new_hotels ?? false,
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

      // Log password change activity
      await logUserActivity((req.user as JwtPayload).userId, 'password_change', {});

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
      // Use a transaction: update password + delete token + invalidate sessions atomically
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          'UPDATE users SET password_hash = $1, token_version = COALESCE(token_version, 0) + 1 WHERE id = $2',
          [hash, userId]
        );
        await client.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }
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
      const verifyClient = await pool.connect();
      try {
        await verifyClient.query('BEGIN');
        await verifyClient.query('UPDATE users SET email_verified = true WHERE id = $1', [userId]);
        await verifyClient.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
        await verifyClient.query('COMMIT');
      } catch (txErr) {
        await verifyClient.query('ROLLBACK');
        throw txErr;
      } finally {
        verifyClient.release();
      }
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
router.get(
  '/providers',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      
      const userId = (req.user as JwtPayload).userId;
      const result = await pool.query(
        `SELECT provider, provider_id, provider_email, created_at
         FROM user_oauth_providers
         WHERE user_id = $1`,
        [userId]
      );
      
      res.json({ providers: result.rows });
    })
  );

router.post(
  '/2fa/setup',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      
      const userId = (req.user as JwtPayload).userId;
      const user = await userModel.findUserById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      // Generate TOTP secret
      const secret = authenticator.generateSecret();
      const serviceName = 'BusyBeds';
      const issuer = 'BusyBeds';
      const totpUri = authenticator.keyuri(user.email, issuer, secret);
      
      // Generate QR code
      const qrImage = await qrcode.toDataURL(totpUri);
      
      // Save secret (but don't enable yet)
      await userModel.updateUser(userId, {
        totp_secret: secret,
        totp_enabled: false,
      });
      
      res.json({
        secret,
        qr_url: totpUri,
        qr_image: qrImage,
      });
    })
  );

router.post(
  '/2fa/verify-setup',
  sanitizeInput,
  authMiddleware,
  validate([body('code').notEmpty().withMessage('Code is required')]),
  asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      
      const userId = (req.user as JwtPayload).userId;
      const user = await userModel.findUserById(userId);
      if (!user || !user.totp_secret) return res.status(404).json({ error: 'Setup required' });
      
      const { code } = req.body;
      const isValid = authenticator.verify({
        token: code,
        secret: user.totp_secret,
      });
      
      if (!isValid) return res.status(400).json({ error: 'Invalid code' });
      
      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      });
      
      // Hash backup codes for storage
      const hashedCodes = await Promise.all(
        backupCodes.map(async (code) => {
          return bcrypt.hash(code, 10);
        })
      );
      
      await userModel.updateUser(userId, {
        totp_enabled: true,
        totp_backup_codes: JSON.stringify(hashedCodes),
      });
      
      await logUserActivity(userId, '2fa_enabled', {});
      
      res.json({ backup_codes: backupCodes });
    })
  );

router.post(
  '/2fa/disable',
  sanitizeInput,
  authMiddleware,
  validate([
    body('password').optional().isString(),
    body('code').optional().isString(),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      
      const userId = (req.user as JwtPayload).userId;
      const user = await userModel.findUserById(userId);
      if (!user || !user.totp_enabled) return res.status(400).json({ error: '2FA not enabled' });
      
      const { password, code } = req.body;
      
      // Verify password or backup code
      if (password) {
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(400).json({ error: 'Incorrect password' });
      } else if (code) {
        // Check backup codes
        const hashedCodes = JSON.parse(user.totp_backup_codes || '[]');
        const isValid = await Promise.all(
          hashedCodes.map(async (hashed: string) => bcrypt.compare(code, hashed))
        );
        if (!isValid.some(Boolean)) {
          return res.status(400).json({ error: 'Invalid backup code' });
        }
      } else {
        return res.status(400).json({ error: 'Password or backup code required' });
      }
      
      await userModel.updateUser(userId, {
        totp_secret: null,
        totp_enabled: false,
        totp_backup_codes: null,
      });
      
      await logUserActivity(userId, '2fa_disabled', {});
      
      res.json({ success: true });
    })
  );

router.post(
  '/2fa/validate',
  sanitizeInput,
  validate([
    body('temp_token').notEmpty().withMessage('Temp token required'),
    body('code').notEmpty().withMessage('Code required'),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
      const { temp_token, code } = req.body;
      
      // Verify temp token
      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(temp_token, config.jwtSecret) as JwtPayload;
        if (decoded.type !== '2fa_pending') {
          return res.status(400).json({ error: 'Invalid temp token type' });
        }
      } catch {
        return res.status(400).json({ error: 'Invalid or expired temp token' });
      }
      
      const user = await userModel.findUserById(decoded.userId);
      if (!user || !user.totp_enabled || !user.totp_secret) {
        return res.status(400).json({ error: '2FA not enabled' });
      }
      
      // Validate TOTP code
      const isValid = authenticator.verify({
        token: code,
        secret: user.totp_secret,
      });
      
      if (!isValid) {
        // Check if it's a backup code
        const hashedCodes = JSON.parse(user.totp_backup_codes || '[]');
        const isValidBackup = await Promise.all(
          hashedCodes.map(async (hashed: string) => bcrypt.compare(code, hashed))
        );
        if (!isValidBackup.some(Boolean)) {
          return res.status(400).json({ error: 'Invalid code' });
        }
        
        // Remove used backup code
        const remainingCodes = hashedCodes.filter((_: string, i: number) => !isValidBackup[i]);
        await userModel.updateUser(decoded.userId, {
          totp_backup_codes: JSON.stringify(remainingCodes),
        });
      }
      
      // Generate full JWT
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
          whatsapp_opt_in: (user as { whatsapp_opt_in?: boolean }).whatsapp_opt_in ?? false,
          notif_coupon_expiry: (user as { notif_coupon_expiry?: boolean }).notif_coupon_expiry ?? true,
          notif_promos: (user as { notif_promos?: boolean }).notif_promos ?? true,
          notif_new_hotels: (user as { notif_new_hotels?: boolean }).notif_new_hotels ?? false,
        },
        token: tokenPair.accessToken,
      });
    })
  );

router.delete(
  '/providers/:provider',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      
      const userId = (req.user as JwtPayload).userId;
      const provider = req.params.provider.toLowerCase();
      
      // Check if user has at least one other login method
      const [userResult, providersResult] = await Promise.all([
        userModel.findUserById(userId),
        pool.query('SELECT provider FROM user_oauth_providers WHERE user_id = $1', [userId])
      ]);
      
      const hasPassword = userResult?.password_hash && userResult.password_hash !== '';
      const hasOtherProviders = providersResult.rows.length > 1;
      
      if (!hasPassword && !hasOtherProviders) {
        return res.status(400).json({ error: 'Cannot unlink last login method' });
      }
      
      await pool.query(
        'DELETE FROM user_oauth_providers WHERE user_id = $1 AND provider = $2',
        [userId, provider]
      );
      
      res.json({ success: true });
    })
  );

router.get(
  '/activity',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      
      const userId = (req.user as JwtPayload).userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const activity = await getUserActivity(userId, limit);
      
      res.json({ activity });
    })
  );

router.delete(
  '/account',
  sanitizeInput,
  authMiddleware,
  validate([body('password').optional().isString().withMessage('Password is required')]),
  asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      
      const userId = (req.user as JwtPayload).userId;
      const user = await userModel.findUserById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Check if user has a password (OAuth users might not)
      const hasPassword = user.password_hash && user.password_hash !== '';
      if (hasPassword) {
        if (!req.body.password) {
          return res.status(400).json({ error: 'Password confirmation required' });
        }
        const match = await bcrypt.compare(req.body.password, user.password_hash);
        if (!match) {
          return res.status(400).json({ error: 'Incorrect password' });
        }
      }

      // Start transaction to ensure all operations succeed or fail together
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Cancel active subscription
        await client.query('UPDATE subscriptions SET status = $1 WHERE user_id = $2 AND status = $3', ['canceled', userId, 'active']);
        
        // Delete referrals and rewards
        await client.query('DELETE FROM referrals WHERE referrer_id = $1 OR referred_id = $1', [userId]);
        await client.query('DELETE FROM referral_rewards WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM withdraw_requests WHERE user_id = $1', [userId]);
        
        // Delete user data (cascade will handle coupons, redemptions, favorites, etc.)
        await client.query('DELETE FROM users WHERE id = $1', [userId]);

        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }

      res.json({ success: true });
    })
  );

router.post(
  '/logout',
  authMiddleware,
  asyncHandler(invalidateTokensHandler)
);

export default router;
