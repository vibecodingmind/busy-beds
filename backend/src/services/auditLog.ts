import { pool } from '../config/db';

export async function logAdminAction(
  adminUserId: number,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO admin_audit_log (admin_user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)`,
    [adminUserId, action, entityType ?? null, entityId ?? null, details ?? null]
  );
}
