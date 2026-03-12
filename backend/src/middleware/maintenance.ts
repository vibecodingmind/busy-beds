import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getSetting } from '../services/settings';

const SKIP_PATHS = ['/health', '/api/v1/settings/public', '/api/v1/cron', '/api/v1/stripe/webhook', '/api/v1/paypal/webhook'];

export function maintenanceMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    if (SKIP_PATHS.some((p) => path === p || path.startsWith(p + '/'))) return next();

    const mode = await getSetting('maintenance_mode');
    if (mode !== 'true' && mode !== '1') return next();

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as { role?: string; type?: string };
        if (decoded?.role === 'admin' || decoded?.type === 'hotel') return next();
      } catch {
        // invalid token
      }
    }

    res.setHeader('Retry-After', '3600');
    res.status(503).json({
      error: "We'll be back soon. Maintenance in progress.",
      maintenance: true,
    });
  };
}
