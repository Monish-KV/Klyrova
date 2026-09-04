import { query, queryOne, run } from '../database/db';

export async function getAlerts(userId?: string, unreadOnly = false) {
  let sql = `SELECT * FROM alerts`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (userId) {
    conditions.push(`(user_id = ? OR user_id IS NULL)`);
    params.push(userId);
  }

  if (unreadOnly) {
    conditions.push(`read = 0`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }

  sql += ` ORDER BY created_at DESC LIMIT 100`;

  return query(sql, params);
}

export async function markAlertRead(id: string) {
  const result = await run(`UPDATE alerts SET read = 1 WHERE id = ?`, [id]);
  if (result.changes === 0) {
    throw new Error(`Alert ${id} not found.`);
  }
  return queryOne(`SELECT * FROM alerts WHERE id = ?`, [id]);
}

export async function getUnreadAlertsCount(userId?: string) {
  let sql = `SELECT COUNT(*) as count FROM alerts WHERE read = 0`;
  const params: any[] = [];

  if (userId) {
    sql += ` AND (user_id = ? OR user_id IS NULL)`;
    params.push(userId);
  }

  const res = await queryOne(sql, params);
  return res ? res.count : 0;
}
