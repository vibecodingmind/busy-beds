import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import { config } from './config';

import authRoutes from './routes/auth';
import stripeRoutes, { webhookHandler } from './routes/stripe';
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

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = config.frontendUrls;
      if (allowed.includes(origin) || origin.endsWith('.vercel.app')) {
        return cb(null, true);
      }
      return cb(null, allowed[0] || true);
    },
    credentials: true,
  })
);
app.post('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), webhookHandler);
app.use(express.json());
app.use(passport.initialize());

// OAuth routes (at /auth for redirect flow)
app.use('/auth', oauthRoutes);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth/hotel', authHotelRoutes);
app.use('/api/v1/hotels', hotelsRoutes);
app.use('/api/v1/coupons', couponsRoutes);
app.use('/api/v1/subscriptions', subscriptionsRoutes);
app.use('/api/v1/hotel', hotelDashboardRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/seed', seedRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/referrals', referralsRoutes);
app.use('/api/v1/stripe', stripeRoutes);
app.use('/api/v1/cron', cronRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || config.port;
app.listen(port, () => {
  console.log(`Busy Beds API running on port ${port}`);
});
