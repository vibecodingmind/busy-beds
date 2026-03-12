import { pool } from '../config/db';

export interface Hotel {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  images: string[];
  featured: boolean;
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  booking_url: string | null;
  coupon_discount_value: string;
  coupon_limit: number;
  limit_period: 'daily' | 'weekly' | 'monthly';
  created_at: Date;
  updated_at: Date;
}

export async function findAllHotels(
  limit = 50,
  offset = 0,
  opts?: {
    search?: string;
    sort?: 'name' | 'location' | 'rating' | 'distance';
    featured?: boolean;
    min_rating?: number;
    lat?: number;
    lng?: number;
    activeOnly?: boolean;
  }
): Promise<(Hotel & { avg_rating?: number | null; review_count?: number })[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (opts?.activeOnly !== false) {
    conditions.push('COALESCE(h.active, true) = true');
  }
  if (opts?.search?.trim()) {
    conditions.push(`(h.name ILIKE $${i} OR h.location ILIKE $${i} OR h.description ILIKE $${i})`);
    params.push(`%${opts.search.trim()}%`);
    i++;
  }
  if (opts?.featured === true) {
    conditions.push('COALESCE(h.featured, false) = true');
  }
  if (opts?.min_rating != null && opts.min_rating > 0) {
    conditions.push(`(SELECT AVG(r.rating) FROM hotel_reviews r WHERE r.hotel_id = h.id) >= $${i}`);
    params.push(opts.min_rating);
    i++;
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  let orderBy = 'COALESCE(h.featured, false) DESC, ';
  if (opts?.sort === 'location') {
    orderBy += 'h.location NULLS LAST, h.name';
  } else if (opts?.sort === 'rating') {
    orderBy = '(SELECT AVG(r.rating) FROM hotel_reviews r WHERE r.hotel_id = h.id) DESC NULLS LAST, ' + orderBy + 'h.name';
  } else if (opts?.sort === 'distance' && opts?.lat != null && opts?.lng != null) {
    params.push(opts.lat, opts.lng);
    orderBy = `(CASE WHEN h.latitude IS NOT NULL AND h.longitude IS NOT NULL
      THEN 6371 * acos(least(1, cos(radians($${i})) * cos(radians(h.latitude)) * cos(radians(h.longitude) - radians($${i + 1})) + sin(radians($${i})) * sin(radians(h.latitude))))
      ELSE 999999 END) NULLS LAST, ` + orderBy + 'h.name';
    i += 2;
  } else {
    orderBy += 'h.name';
  }
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT h.*,
      (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM hotel_reviews r WHERE r.hotel_id = h.id) as avg_rating,
      (SELECT COUNT(*)::int FROM hotel_reviews r WHERE r.hotel_id = h.id) as review_count,
      (SELECT COUNT(*)::int FROM redemptions rd JOIN coupons c ON c.id = rd.coupon_id WHERE c.hotel_id = h.id AND rd.redeemed_at >= date_trunc('month', CURRENT_DATE)) as redemptions_this_month,
      (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (hr.created_at - r.created_at)) / 3600)::numeric, 0) FROM hotel_reviews r JOIN hotel_review_responses hr ON hr.review_id = r.id WHERE r.hotel_id = h.id) as avg_response_hours
     FROM hotels h ${where}
     ORDER BY ${orderBy}
     LIMIT $${i} OFFSET $${i + 1}`,
    params
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    ...r,
    avg_rating: r.avg_rating != null ? Number(r.avg_rating) : null,
    review_count: r.review_count != null ? Number(r.review_count) : 0,
    redemptions_this_month: r.redemptions_this_month != null ? Number(r.redemptions_this_month) : 0,
    avg_response_hours: r.avg_response_hours != null ? Number(r.avg_response_hours) : null,
    images: (r.images as string[]) || [],
    latitude: r.latitude != null ? Number(r.latitude) : null,
    longitude: r.longitude != null ? Number(r.longitude) : null,
    featured: Boolean(r.featured),
    active: r.active !== false,
  })) as (Hotel & { avg_rating?: number | null; review_count?: number; redemptions_this_month?: number; avg_response_hours?: number | null })[];
}

export async function findHotelById(id: number, includeInactive = false): Promise<(Hotel & { redemptions_this_month?: number; avg_response_hours?: number | null }) | null> {
  const result = await pool.query(
    `SELECT h.*,
      (SELECT COUNT(*)::int FROM redemptions rd JOIN coupons c ON c.id = rd.coupon_id WHERE c.hotel_id = h.id AND rd.redeemed_at >= date_trunc('month', CURRENT_DATE)) as redemptions_this_month,
      (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (hr.created_at - r.created_at)) / 3600)::numeric, 0) FROM hotel_reviews r JOIN hotel_review_responses hr ON hr.review_id = r.id WHERE r.hotel_id = h.id) as avg_response_hours
     FROM hotels h WHERE h.id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  if (!includeInactive && row.active === false) return null;
  return {
    ...row,
    images: row.images || [],
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    featured: Boolean(row.featured),
    active: row.active !== false,
    redemptions_this_month: row.redemptions_this_month != null ? Number(row.redemptions_this_month) : 0,
    avg_response_hours: row.avg_response_hours != null ? Number(row.avg_response_hours) : null,
  };
}

export async function findHotelsByIds(ids: number[]): Promise<(Hotel & { avg_rating?: number | null; review_count?: number; redemptions_this_month?: number; avg_response_hours?: number | null })[]> {
  if (ids.length === 0) return [];
  const result = await pool.query(
    `SELECT h.*,
      (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM hotel_reviews r WHERE r.hotel_id = h.id) as avg_rating,
      (SELECT COUNT(*)::int FROM hotel_reviews r WHERE r.hotel_id = h.id) as review_count,
      (SELECT COUNT(*)::int FROM redemptions rd JOIN coupons c ON c.id = rd.coupon_id WHERE c.hotel_id = h.id AND rd.redeemed_at >= date_trunc('month', CURRENT_DATE)) as redemptions_this_month,
      (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (hr.created_at - r.created_at)) / 3600)::numeric, 0) FROM hotel_reviews r JOIN hotel_review_responses hr ON hr.review_id = r.id WHERE r.hotel_id = h.id) as avg_response_hours
     FROM hotels h WHERE h.id = ANY($1::int[])
     ORDER BY array_position($1::int[], h.id)`,
    [ids]
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    ...r,
    avg_rating: r.avg_rating != null ? Number(r.avg_rating) : null,
    review_count: r.review_count != null ? Number(r.review_count) : 0,
    redemptions_this_month: r.redemptions_this_month != null ? Number(r.redemptions_this_month) : 0,
    avg_response_hours: r.avg_response_hours != null ? Number(r.avg_response_hours) : null,
    images: (r.images as string[]) || [],
    latitude: r.latitude != null ? Number(r.latitude) : null,
    longitude: r.longitude != null ? Number(r.longitude) : null,
    featured: Boolean(r.featured),
    active: r.active !== false,
  })) as (Hotel & { avg_rating?: number | null; review_count?: number; redemptions_this_month?: number; avg_response_hours?: number | null })[];
}

export async function createHotel(data: {
  name: string;
  description?: string;
  location?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_whatsapp?: string | null;
  images?: string[];
  latitude?: number | null;
  longitude?: number | null;
  booking_url?: string | null;
  featured?: boolean;
  active?: boolean;
  coupon_discount_value: string;
  coupon_limit: number;
  limit_period: string;
}): Promise<Hotel> {
  const result = await pool.query(
    `INSERT INTO hotels (name, description, location, contact_phone, contact_email, contact_whatsapp, images, latitude, longitude, booking_url, featured, active, coupon_discount_value, coupon_limit, limit_period)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      data.name,
      data.description || null,
      data.location || null,
      data.contact_phone || null,
      data.contact_email || null,
      data.contact_whatsapp || null,
      JSON.stringify(data.images || []),
      data.latitude ?? null,
      data.longitude ?? null,
      data.booking_url || null,
      data.featured ?? false,
      data.active !== false,
      data.coupon_discount_value,
      data.coupon_limit,
      data.limit_period,
    ]
  );
  const row = result.rows[0]!;
  return { ...row, images: row.images || [], latitude: row.latitude ? Number(row.latitude) : null, longitude: row.longitude ? Number(row.longitude) : null, active: row.active !== false };
}

export async function updateHotel(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    location: string;
    contact_phone: string;
    contact_email: string;
    contact_whatsapp: string | null;
    images: string[];
    latitude: number | null;
    longitude: number | null;
    booking_url: string | null;
    featured: boolean;
    active: boolean;
    coupon_discount_value: string;
    coupon_limit: number;
    limit_period: string;
  }>
): Promise<Hotel | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = $${i}`);
      values.push(key === 'images' ? JSON.stringify(val) : val);
      i++;
    }
  }
  if (fields.length === 0) return findHotelById(id);
  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  const result = await pool.query(
    `UPDATE hotels SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  const row = result.rows[0];
  if (!row) return null;
  return { ...row, images: row.images || [], latitude: row.latitude ? Number(row.latitude) : null, longitude: row.longitude ? Number(row.longitude) : null, active: row.active !== false };
}
