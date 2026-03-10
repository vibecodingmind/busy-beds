import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { config } from '../config';
import { pool } from '../config/db';
import { logger } from '../config/logger';
import { CustomError } from './errorHandler';

export interface RefreshTokenPayload {
  userId: number;
  email: string;
  role: string;
  type: 'refresh';
  tokenVersion: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class RefreshTokenService {
  // Generate a refresh token with longer expiration
  generateRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
    const refreshTokenPayload: RefreshTokenPayload = {
      ...payload,
      type: 'refresh',
    };
    
    return jwt.sign(refreshTokenPayload, config.jwtSecret, {
      expiresIn: config.refreshTokenExpiresIn || '30d',
    } as jwt.SignOptions);
  }

  // Generate an access token with shorter expiration
  generateAccessToken(payload: Omit<jwt.JwtPayload, 'type'>): string {
    const accessTokenPayload = {
      ...payload,
      type: 'user',
    };
    
    return jwt.sign(accessTokenPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn || '15m',
    } as jwt.SignOptions);
  }

  // Generate both tokens
  generateTokenPair(user: { id: number; email: string; role: string; token_version?: number }): TokenPair {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.token_version || 0,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  // Verify refresh token
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as RefreshTokenPayload;
      
      if (decoded.type !== 'refresh') {
        throw new CustomError('Invalid token type', 401);
      }

      // Check if user's token version has changed (token invalidated)
      const userResult = await pool.query(
        'SELECT id, token_version FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        throw new CustomError('User not found', 401);
      }

      const user = userResult.rows[0];
      if (user.token_version !== decoded.tokenVersion) {
        throw new CustomError('Token has been invalidated', 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid refresh token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new CustomError('Refresh token expired', 401);
      }
      throw error;
    }
  }

  // Invalidate all user tokens by incrementing token version
  async invalidateUserTokens(userId: number): Promise<void> {
    try {
      await pool.query(
        'UPDATE users SET token_version = token_version + 1 WHERE id = $1',
        [userId]
      );
      
      logger.info('User tokens invalidated', { userId });
    } catch (error) {
      logger.error('Failed to invalidate user tokens', { error, userId });
      throw new CustomError('Failed to invalidate tokens', 500);
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify the refresh token
      const decoded = await this.verifyRefreshToken(refreshToken);

      // Get fresh user data
      const userResult = await pool.query(
        'SELECT id, email, role, token_version FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        throw new CustomError('User not found', 401);
      }

      const user = userResult.rows[0];
      
      // Generate new token pair
      const tokenPair = this.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
        token_version: user.token_version,
      });

      logger.info('Tokens refreshed', { userId: user.id });

      return tokenPair;
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw error;
    }
  }

  // Setup refresh token database table if needed
  async setupRefreshTokenTable(): Promise<void> {
    try {
      // Add token_version column to users table if it doesn't exist
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='users' AND column_name='token_version'
          ) THEN
            ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0;
          END IF;
        END $$;
      `);

      logger.info('Refresh token table setup completed');
    } catch (error) {
      logger.error('Failed to setup refresh token table', { error });
      throw error;
    }
  }
}

export const refreshTokenService = new RefreshTokenService();

// Middleware to handle token refresh
export const refreshTokenHandler = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new CustomError('Refresh token is required', 400);
    }

    const tokenPair = await refreshTokenService.refreshAccessToken(refreshToken);

    res.json({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    });
  } catch (error) {
    throw error;
  }
};

// Middleware to invalidate tokens (logout)
export const invalidateTokensHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw new CustomError('User not authenticated', 401);
    }

    await refreshTokenService.invalidateUserTokens(userId);

    res.json({ message: 'Tokens invalidated successfully' });
  } catch (error) {
    throw error;
  }
};
