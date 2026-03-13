import { pool } from '../config/db';

export interface HotelRoom {
  id: number;
  hotel_id: number;
  room_type: string;
  description: string | null;
  base_price: number;
  currency: string;
  amenities: string[];
  max_occupancy: number;
  is_active: boolean;
  created_at: Date;
}

export interface CreateRoomInput {
  hotel_id: number;
  room_type: string;
  description?: string;
  base_price: number;
  currency?: string;
  amenities?: string[];
  max_occupancy?: number;
  is_active?: boolean;
}

export async function findRoomsByHotelId(hotelId: number): Promise<HotelRoom[]> {
  const result = await pool.query(
    `SELECT * FROM hotel_rooms WHERE hotel_id = $1 AND is_active = true ORDER BY base_price ASC`,
    [hotelId]
  );
  return result.rows.map((r) => ({
    ...r,
    amenities: r.amenities || [],
  }));
}

export async function findRoomById(id: number): Promise<HotelRoom | null> {
  const result = await pool.query('SELECT * FROM hotel_rooms WHERE id = $1', [id]);
  if (!result.rows[0]) return null;
  return {
    ...result.rows[0],
    amenities: result.rows[0].amenities || [],
  };
}

export async function createRoom(data: CreateRoomInput): Promise<HotelRoom> {
  const result = await pool.query(
    `INSERT INTO hotel_rooms (hotel_id, room_type, description, base_price, currency, amenities, max_occupancy, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.hotel_id,
      data.room_type,
      data.description || null,
      data.base_price,
      data.currency || 'USD',
      JSON.stringify(data.amenities || []),
      data.max_occupancy || 2,
      data.is_active !== false,
    ]
  );
  return {
    ...result.rows[0],
    amenities: result.rows[0].amenities || [],
  };
}

export async function updateRoom(
  id: number,
  data: Partial<CreateRoomInput>
): Promise<HotelRoom | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (data.room_type !== undefined) {
    fields.push(`room_type = $${i++}`);
    values.push(data.room_type);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${i++}`);
    values.push(data.description);
  }
  if (data.base_price !== undefined) {
    fields.push(`base_price = $${i++}`);
    values.push(data.base_price);
  }
  if (data.currency !== undefined) {
    fields.push(`currency = $${i++}`);
    values.push(data.currency);
  }
  if (data.amenities !== undefined) {
    fields.push(`amenities = $${i++}`);
    values.push(JSON.stringify(data.amenities));
  }
  if (data.max_occupancy !== undefined) {
    fields.push(`max_occupancy = $${i++}`);
    values.push(data.max_occupancy);
  }
  if (data.is_active !== undefined) {
    fields.push(`is_active = $${i++}`);
    values.push(data.is_active);
  }

  if (fields.length === 0) return findRoomById(id);

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(
    `UPDATE hotel_rooms SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (!result.rows[0]) return null;
  return {
    ...result.rows[0],
    amenities: result.rows[0].amenities || [],
  };
}

export async function deleteRoom(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM hotel_rooms WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function findAllRoomsForHotelAdmin(hotelId: number): Promise<HotelRoom[]> {
  const result = await pool.query(
    `SELECT * FROM hotel_rooms WHERE hotel_id = $1 ORDER BY base_price ASC`,
    [hotelId]
  );
  return result.rows.map((r) => ({
    ...r,
    amenities: r.amenities || [],
  }));
}
