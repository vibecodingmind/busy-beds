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
ON CONFLICT (name) DO NOTHING;

-- Seed rooms for the hotels
INSERT INTO hotel_rooms (hotel_id, room_type, description, base_price, currency, amenities, max_occupancy)
SELECT h.id, 'Standard Room', 'Comfortable room with city view', 100, 'USD', '["WiFi", "TV", "AC"]'::jsonb, 2
FROM hotels h
WHERE h.name = 'Grand Plaza Hotel'
ON CONFLICT DO NOTHING;

INSERT INTO hotel_rooms (hotel_id, room_type, description, base_price, currency, amenities, max_occupancy)
SELECT h.id, 'Deluxe Room', 'Spacious room with premium amenities', 150, 'USD', '["WiFi", "TV", "AC", "Mini Bar", "Safe"]'::jsonb, 2
FROM hotels h
WHERE h.name = 'Grand Plaza Hotel'
ON CONFLICT DO NOTHING;

INSERT INTO hotel_rooms (hotel_id, room_type, description, base_price, currency, amenities, max_occupancy)
SELECT h.id, 'Suite', 'Luxurious suite with separate living area', 250, 'USD', '["WiFi", "TV", "AC", "Mini Bar", "Safe", "Jacuzzi", "Breakfast"]'::jsonb, 4
FROM hotels h
WHERE h.name = 'Grand Plaza Hotel'
ON CONFLICT DO NOTHING;

INSERT INTO hotel_rooms (hotel_id, room_type, description, base_price, currency, amenities, max_occupancy)
SELECT h.id, 'Standard Room', 'Cozy room with partial ocean view', 120, 'USD', '["WiFi", "TV", "AC", "Balcony"]'::jsonb, 2
FROM hotels h
WHERE h.name = 'Seaside Resort'
ON CONFLICT DO NOTHING;

INSERT INTO hotel_rooms (hotel_id, room_type, description, base_price, currency, amenities, max_occupancy)
SELECT h.id, 'Deluxe Room', 'Room with full ocean view and balcony', 180, 'USD', '["WiFi", "TV", "AC", "Balcony", "Mini Bar"]'::jsonb, 2
FROM hotels h
WHERE h.name = 'Seaside Resort'
ON CONFLICT DO NOTHING;

INSERT INTO hotel_rooms (hotel_id, room_type, description, base_price, currency, amenities, max_occupancy)
SELECT h.id, 'Beach Suite', 'Suite with direct beach access', 300, 'USD', '["WiFi", "TV", "AC", "Balcony", "Mini Bar", "Jacuzzi", "Beach Access"]'::jsonb, 4
FROM hotels h
WHERE h.name = 'Seaside Resort'
ON CONFLICT DO NOTHING;

INSERT INTO hotel_rooms (hotel_id, room_type, description, base_price, currency, amenities, max_occupancy)
SELECT h.id, 'Standard Room', 'Cozy room with mountain view', 80, 'USD', '["WiFi", "Heater", "Fireplace"]'::jsonb, 2
FROM hotels h
WHERE h.name = 'Mountain Lodge'
ON CONFLICT DO NOTHING;

INSERT INTO hotel_rooms (hotel_id, room_type, description, base_price, currency, amenities, max_occupancy)
SELECT h.id, 'Deluxe Room', 'Spacious room with balcony and mountain view', 120, 'USD', '["WiFi", "Heater", "Fireplace", "Balcony", "Bathtub"]'::jsonb, 2
FROM hotels h
WHERE h.name = 'Mountain Lodge'
ON CONFLICT DO NOTHING;

INSERT INTO hotel_rooms (hotel_id, room_type, description, base_price, currency, amenities, max_occupancy)
SELECT h.id, 'Mountain Cabin', 'Private cabin with full kitchen and fireplace', 200, 'USD', '["WiFi", "Heater", "Fireplace", "Kitchen", "Bathtub", "Balcony"]'::jsonb, 6
FROM hotels h
WHERE h.name = 'Mountain Lodge'
ON CONFLICT DO NOTHING;