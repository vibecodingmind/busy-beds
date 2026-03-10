-- Hotel Coupon Membership System - Seed Data (copy for API seed - database/ lives outside backend deploy)

INSERT INTO subscription_plans (name, monthly_coupon_limit, price) VALUES
    ('Basic', 3, 9.99),
    ('Standard', 10, 24.99),
    ('Premium', 30, 49.99)
ON CONFLICT (name) DO NOTHING;

INSERT INTO hotels (name, description, location, contact_phone, contact_email, images, latitude, longitude, coupon_discount_value, coupon_limit, limit_period) VALUES
    ('Grand Plaza Hotel', 'Luxury hotel in the heart of the city with stunning views.', '123 Main Street, Downtown', '+1-555-0101', 'info@grandplaza.com',
     '["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80","https://images.unsplash.com/photo-1582719478250-c89c6d9cba22?w=800&q=80","https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80"]'::jsonb,
     37.7749, -122.4194, '15% off', 20, 'daily'),
    ('Seaside Resort', 'Beachfront resort with private beach and spa facilities.', '456 Ocean Drive, Coast', '+1-555-0102', 'contact@seasideresort.com',
     '["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80"]'::jsonb,
     25.7907, -80.1300, '$50 off', 15, 'weekly'),
    ('Mountain Lodge', 'Cozy lodge with mountain views and hiking trails.', '789 Pine Road, Highlands', '+1-555-0103', 'hello@mountainlodge.com',
     '["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80","https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80"]'::jsonb,
     39.1911, -106.8175, '20% off', 10, 'monthly')
;
