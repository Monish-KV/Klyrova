import { exec } from './db';

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  customer_id TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'Digitally Inexperienced',
  digital_experience TEXT NOT NULL DEFAULT 'Beginner',
  protection_level TEXT NOT NULL DEFAULT 'Enhanced',
  phone TEXT,
  account_number TEXT,
  upi_id TEXT,
  balance REAL NOT NULL DEFAULT 0,
  habitual_max_amount REAL NOT NULL DEFAULT 5000,
  registered_device TEXT,
  registered_ip TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  recipient TEXT NOT NULL,
  recipient_upi TEXT NOT NULL,
  amount REAL NOT NULL,
  purpose TEXT,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  status TEXT NOT NULL,
  device TEXT,
  location TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaction_risk_signals (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  points INTEGER NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scam_analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  message TEXT NOT NULL,
  score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  categories TEXT NOT NULL,
  reasons TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL,
  related_transaction_id TEXT,
  related_scam_id TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS safety_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  transaction_monitoring INTEGER NOT NULL DEFAULT 1,
  scam_analysis INTEGER NOT NULL DEFAULT 1,
  high_risk_verification INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  upi_id TEXT NOT NULL,
  account_number TEXT,
  relationship TEXT,
  avatar TEXT,
  is_trusted INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_transaction_id ON transaction_risk_signals(transaction_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_id ON beneficiaries(user_id);
`;

export async function initializeSchema(): Promise<void> {
  await exec(SCHEMA_SQL);
  console.log('[Database] Schema verified and indexes created.');
}
