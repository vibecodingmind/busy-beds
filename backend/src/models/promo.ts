import { pool } from '../config/db';

export interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed' | 'free_month';
  discount_value: number;
  valid_from: Date;
  valid_until: Date | null;
  max_uses: number | null;
  uses_count: number;
}

export async function findPromoByCode(code: string): Promise<(PromoCode & { valid: boolean }) | null> {
  const result = await pool.query(
    `SELECT * FROM promo_codes WHERE UPPER(TRIM(code)) = UPPER(TRIM($1))`,
    [code]
  );
  const row = result.rows[0];
  if (!row) return null;
  const now = new Date();
  const validFrom = new Date(row.valid_from);
  const validUntil = row.valid_until ? new Date(row.valid_until) : null;
  const valid =
    now >= validFrom &&
    (!validUntil || now <= validUntil) &&
    (row.max_uses == null || row.uses_count < row.max_uses);
  return { ...row, valid };
}

export async function incrementPromoUses(id: number): Promise<void> {
  await pool.query(
    'UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = $1',
    [id]
  );
}
