import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  type: 'user';
}

export interface HotelJwtPayload {
  hotelAccountId: number;
  hotelId: number;
  email: string;
  type: 'hotel';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      hotel?: HotelJwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    if (decoded.type !== 'user') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function hotelAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Hotel authentication required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as HotelJwtPayload;
    if (decoded.type !== 'hotel') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    req.hotel = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
