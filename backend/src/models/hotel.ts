import { pool } from '../config/db';

export interface Hotel {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  coupon_discount_value: string;
  coupon_limit: number;
  limit_period: 'daily' | 'weekly' | 'monthly';
  created_at: Date;
  updated_at: Date;
}

export async function findAllHotels(limit = 50, offset = 0): Promise<Hotel[]> {
  const result = await pool.query(
    `SELECT * FROM hotels ORDER BY name LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    ...r,
    images: (r.images as string[]) || [],
    latitude: r.latitude != null ? Number(r.latitude) : null,
    longitude: r.longitude != null ? Number(r.longitude) : null,
  })) as Hotel[];
}

export async function findHotelById(id: number): Promise<Hotel | null> {
  const result = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);
  const row = result.rows[0];
  if (!row) return null;
  return { ...row, images: row.images || [], latitude: row.latitude ? Number(row.latitude) : null, longitude: row.longitude ? Number(row.longitude) : null };
}

export async function createHotel(data: {
  name: string;
  description?: string;
  location?: string;
  contact_phone?: string;
  contact_email?: string;
  images?: string[];
  latitude?: number | null;
  longitude?: number | null;
  coupon_discount_value: string;
  coupon_limit: number;
  limit_period: string;
}): Promise<Hotel> {
  const result = await pool.query(
    `INSERT INTO hotels (name, description, location, contact_phone, contact_email, images, latitude, longitude, coupon_discount_value, coupon_limit, limit_period)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      data.name,
      data.description || null,
      data.location || null,
      data.contact_phone || null,
      data.contact_email || null,
      JSON.stringify(data.images || []),
      data.latitude ?? null,
      data.longitude ?? null,
      data.coupon_discount_value,
      data.coupon_limit,
      data.limit_period,
    ]
  );
  const row = result.rows[0]!;
  return { ...row, images: row.images || [], latitude: row.latitude ? Number(row.latitude) : null, longitude: row.longitude ? Number(row.longitude) : null };
}

export async function updateHotel(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    location: string;
    contact_phone: string;
    contact_email: string;
    images: string[];
    latitude: number | null;
    longitude: number | null;
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
  return { ...row, images: row.images || [], latitude: row.latitude ? Number(row.latitude) : null, longitude: row.longitude ? Number(row.longitude) : null };
}
