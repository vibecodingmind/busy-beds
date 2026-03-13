-- Hotel Coupon Membership System - Database Schema
-- PostgreSQL

-- Enable UUID extension (optional, for cleaner IDs)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (travelers)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url VARCHAR(512),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscription plans
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    monthly_coupon_limit INTEGER NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0,
    stripe_price_id VARCHAR(255),
    paypal_plan_id VARCHAR(255),
    flutterwave_plan_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    paypal_subscription_id VARCHAR(255),
    flutterwave_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Hotels
CREATE TABLE hotels (
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

-- Hotel accounts (one per hotel for MVP)
CREATE TABLE hotel_accounts (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL UNIQUE REFERENCES hotels(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coupons
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    discount_value VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE UNIQUE INDEX idx_coupons_code ON coupons(code);

-- Redemptions
CREATE TABLE redemptions (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    hotel_account_id INTEGER NOT NULL REFERENCES hotel_accounts(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_coupons_user_id ON coupons(user_id);
CREATE INDEX idx_coupons_hotel_id ON coupons(hotel_id);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_redemptions_hotel_account_id ON redemptions(hotel_account_id);
CREATE INDEX idx_redemptions_redeemed_at ON redemptions(redeemed_at);

-- Pending Flutterwave charges (tx_ref -> user_id, plan_id) until webhook charge.completed
CREATE TABLE flutterwave_charge_pending (
    tx_ref VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin-configurable settings (keys, API keys, secrets) - env vars used as fallback
CREATE TABLE settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
