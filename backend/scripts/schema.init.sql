-- Idempotent schema for auto-deploy (uses IF NOT EXISTS)
-- Run on every deploy; safe to run multiple times

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    monthly_coupon_limit INTEGER NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0,
    stripe_price_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(500),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    images JSONB DEFAULT '[]',
    coupon_discount_value VARCHAR(100) NOT NULL,
    coupon_limit INTEGER NOT NULL DEFAULT 10,
    limit_period VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (limit_period IN ('daily', 'weekly', 'monthly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hotel_accounts (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL UNIQUE REFERENCES hotels(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add approved column if table exists without it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotel_accounts' AND column_name='approved') THEN
    ALTER TABLE hotel_accounts ADD COLUMN approved BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    discount_value VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

CREATE TABLE IF NOT EXISTS redemptions (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    hotel_account_id INTEGER NOT NULL REFERENCES hotel_accounts(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_hotel_id ON coupons(hotel_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_hotel_account_id ON redemptions(hotel_account_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_redeemed_at ON redemptions(redeemed_at);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Email verification (optional for resend link)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);

-- Add email_verified to users if not exists (via ALTER)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add avatar_url and phone to users for account settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
    ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
    ALTER TABLE users ADD COLUMN phone VARCHAR(50);
  END IF;
END $$;

-- Add latitude/longitude to hotels for map and distance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotels' AND column_name='latitude') THEN
    ALTER TABLE hotels ADD COLUMN latitude DECIMAL(10, 8);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotels' AND column_name='longitude') THEN
    ALTER TABLE hotels ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotels' AND column_name='booking_url') THEN
    ALTER TABLE hotels ADD COLUMN booking_url VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotels' AND column_name='contact_whatsapp') THEN
    ALTER TABLE hotels ADD COLUMN contact_whatsapp VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotels' AND column_name='featured') THEN
    ALTER TABLE hotels ADD COLUMN featured BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Allow 'cancelled' status on coupons
DO $$
BEGIN
  ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_status_check;
  ALTER TABLE coupons ADD CONSTRAINT coupons_status_check
    CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Reviews (hotel ratings by users)
CREATE TABLE IF NOT EXISTS hotel_reviews (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_hotel_reviews_hotel_id ON hotel_reviews(hotel_id);

-- Referral codes (user gets unique code, referred users get tracked)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referral_code') THEN
    ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referred_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);

-- Track which coupons have had expiry reminder sent
CREATE TABLE IF NOT EXISTS coupon_reminder_sent (
    coupon_id INTEGER PRIMARY KEY REFERENCES coupons(id) ON DELETE CASCADE
);

-- User favorites (wishlist)
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, hotel_id)
);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);

-- Hotel response to reviews
CREATE TABLE IF NOT EXISTS hotel_review_responses (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES hotel_reviews(id) ON DELETE CASCADE,
    hotel_account_id INTEGER NOT NULL REFERENCES hotel_accounts(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id)
);

-- Promo codes for signup/subscription
CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'free_month')),
    discount_value DECIMAL(10, 2) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT NULL,
    uses_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Waitlist: notify when new hotels join
CREATE TABLE IF NOT EXISTS hotel_waitlist (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email)
);

-- Review helpfulness votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES hotel_reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON review_helpful_votes(review_id);

-- Referral payouts: 25% of referred user's first subscription
CREATE TABLE IF NOT EXISTS referral_rewards (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    plan_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    stripe_transfer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(referrer_id, referred_id)
);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referred_id ON referral_rewards(referred_id);

-- Stripe Connect account for referrer payouts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='stripe_connect_account_id') THEN
    ALTER TABLE users ADD COLUMN stripe_connect_account_id VARCHAR(255);
  END IF;
END $$;

-- Temp mapping for Connect onboarding (account_id -> user_id)
CREATE TABLE IF NOT EXISTS stripe_connect_pending (
    account_id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
