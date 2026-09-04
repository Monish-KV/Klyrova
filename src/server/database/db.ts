import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_FILE = process.env.DATABASE_URL || path.join(process.cwd(), 'guardianpay.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
      console.log(`[Database] Loaded SQLite database from ${DB_FILE}`);
    } catch (err) {
      console.warn(`[Database] Could not read existing DB file, creating fresh:`, err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
    console.log(`[Database] Created fresh SQLite database in memory`);
  }

  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error(`[Database] Failed to persist SQLite file:`, err);
  }
}

export async function query<T = any>(sqlText: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sqlText);
  if (params && params.length > 0) {
    stmt.bind(params);
  }

  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

export async function queryOne<T = any>(sqlText: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sqlText, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function run(sqlText: string, params: any[] = []): Promise<{ changes: number }> {
  const db = await getDb();
  if (params && params.length > 0) {
    db.run(sqlText, params);
  } else {
    db.run(sqlText);
  }
  saveDb();
  return { changes: db.getRowsModified() };
}

export async function exec(sqlText: string): Promise<void> {
  const db = await getDb();
  db.exec(sqlText);
  saveDb();
}
