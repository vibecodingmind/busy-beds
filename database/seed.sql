-- Hotel Coupon Membership System - Seed Data

-- Subscription plans
INSERT INTO subscription_plans (name, monthly_coupon_limit, price) VALUES
    ('Basic', 3, 9.99),
    ('Standard', 10, 24.99),
    ('Premium', 30, 49.99)
ON CONFLICT (name) DO NOTHING;

-- Admin user: create via backend seed script (bcrypt hash required)
-- Run: node backend/scripts/seed-admin.js

-- Sample hotels (password hash will be set when hotel account is created)
INSERT INTO hotels (name, description, location, contact_phone, contact_email, coupon_discount_value, coupon_limit, limit_period) VALUES
    ('Grand Plaza Hotel', 'Luxury hotel in the heart of the city with stunning views.', '123 Main Street, Downtown', '+1-555-0101', 'info@grandplaza.com', '15% off', 20, 'daily'),
    ('Seaside Resort', 'Beachfront resort with private beach and spa facilities.', '456 Ocean Drive, Coast', '+1-555-0102', 'contact@seasideresort.com', '$50 off', 15, 'weekly'),
    ('Mountain Lodge', 'Cozy lodge with mountain views and hiking trails.', '789 Pine Road, Highlands', '+1-555-0103', 'hello@mountainlodge.com', '20% off', 10, 'monthly')
;
