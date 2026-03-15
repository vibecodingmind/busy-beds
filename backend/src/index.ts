import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import { config } from './config';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger, logStream } from './config/logger';
import { refreshTokenService } from './middleware/refreshToken';

import authRoutes from './routes/auth';
import stripeRoutes, { webhookHandler } from './routes/stripe';
import paypalRoutes, { webhookHandler as paypalWebhookHandler } from './routes/paypal';
import flutterwaveRoutes, { webhookHandler as flutterwaveWebhookHandler } from './routes/flutterwave';
import oauthRoutes from './routes/oauth';
import authHotelRoutes from './routes/authHotel';
import hotelsRoutes from './routes/hotels';
import couponsRoutes from './routes/coupons';
import subscriptionsRoutes from './routes/subscriptions';
import hotelDashboardRoutes from './routes/hotelDashboard';
import adminRoutes from './routes/admin';
import seedRoutes from './routes/seed';
import reviewsRoutes from './routes/reviews';
import referralsRoutes from './routes/referrals';
import cronRoutes from './routes/cron';
import favoritesRoutes from './routes/favorites';
import promoRoutes from './routes/promo';
import waitlistRoutes from './routes/waitlist';
import settingsRoutes from './routes/settings';
import pagesRoutes from './routes/pages';
import contactRoutes from './routes/contact';
import roomsRoutes from './routes/rooms';
import exchangeRatesRoutes from './routes/exchangeRates';
import { maintenanceMiddleware } from './middleware/maintenance';

const app = express();

app.use(helmet());
app.use(generalLimiter);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = config.frontendUrls;
      if (allowed.includes(origin) || origin.endsWith('.vercel.app')) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.post('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), webhookHandler);
app.post('/api/v1/paypal/webhook', express.raw({ type: 'application/json' }), paypalWebhookHandler);
app.post('/api/v1/flutterwave/webhook', express.raw({ type: 'application/json' }), flutterwaveWebhookHandler);
app.use(express.json());
app.use(maintenanceMiddleware());
app.use(passport.initialize());

// OAuth routes (at /auth for redirect flow)
app.use('/auth', oauthRoutes);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth/hotel', authHotelRoutes);
app.use('/api/v1/stripe', stripeRoutes);
app.use('/api/v1/hotels', hotelsRoutes);
app.use('/api/v1/coupons', couponsRoutes);
app.use('/api/v1/subscriptions', subscriptionsRoutes);
app.use('/api/v1/hotel', hotelDashboardRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/seed', seedRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/referrals', referralsRoutes);
app.use('/api/v1/favorites', favoritesRoutes);
app.use('/api/v1/promo', promoRoutes);
app.use('/api/v1/waitlist', waitlistRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/pages', pagesRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/cron', cronRoutes);
app.use('/api/v1/exchange-rates', exchangeRatesRoutes);
app.use('/api/v1', roomsRoutes);

// Health / status page: API, DB (optional deep check)
app.get('/health', async (_req, res) => {
  let database: 'ok' | 'error' = 'ok';
  try {
    const { pool } = await import('./config/db');
    await pool.query('SELECT 1');
  } catch {
    database = 'error';
  }
  res.json({
    status: database === 'ok' ? 'ok' : 'degraded',
    database,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize refresh token service
refreshTokenService.setupRefreshTokenTable().catch(error => {
  logger.error('Failed to setup refresh token service', { error });
});

const port = process.env.PORT || config.port;
app.listen(port, () => {
  logger.info(`Busy Beds API running on port ${port}`, { port, environment: process.env.NODE_ENV });
});
