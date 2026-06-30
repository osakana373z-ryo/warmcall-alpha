import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'warmcall.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function columnExists(table, column) {
  return db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .some((c) => c.name === column);
}

function tableExists(table) {
  return Boolean(
    db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)
  );
}

/** 生成唯一 4 位纯数字邀请码（1000–9999） */
export function generateInviteCode() {
  const exists = db.prepare('SELECT id FROM elders WHERE invite_code = ?');
  for (let i = 0; i < 200; i++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    if (!exists.get(code)) return code;
  }
  throw new Error('无法生成唯一邀请码，请稍后重试');
}

// Migrate MVP mock-login schema → Alpha
if (tableExists('users') && !columnExists('users', 'password_hash')) {
  if (tableExists('chat_messages')) db.exec('DELETE FROM chat_messages');
  if (tableExists('chat_sessions')) db.exec('DELETE FROM chat_sessions');
  if (tableExists('memories')) db.exec('DELETE FROM memories');
  if (tableExists('elders')) db.exec('DELETE FROM elders');
  db.exec('DROP TABLE IF EXISTS auth_sessions');
  db.exec('DROP TABLE IF EXISTS users');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    parent_consent_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (phone IS NOT NULL OR email IS NOT NULL)
  );

  CREATE TABLE IF NOT EXISTS elders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    age INTEGER,
    relationship TEXT,
    hobbies TEXT,
    health_reminders TEXT,
    family_members TEXT,
    elder_consent_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    elder_id INTEGER NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    summary TEXT,
    FOREIGN KEY (elder_id) REFERENCES elders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    elder_id INTEGER NOT NULL,
    session_id INTEGER,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (elder_id) REFERENCES elders(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL
  );
`);

if (tableExists('elders')) {
  if (!columnExists('elders', 'user_id')) {
    db.exec('ALTER TABLE elders ADD COLUMN user_id INTEGER REFERENCES users(id)');
    db.exec('DELETE FROM elders WHERE user_id IS NULL');
  }

  // 从旧版 access_token（字母数字长串）迁移到 invite_code（4 位数字）
  if (!columnExists('elders', 'invite_code')) {
    db.exec('ALTER TABLE elders ADD COLUMN invite_code TEXT');
    const elders = db.prepare('SELECT id FROM elders').all();
    const update = db.prepare('UPDATE elders SET invite_code = ? WHERE id = ?');
    for (const elder of elders) {
      update.run(generateInviteCode(), elder.id);
    }
  } else {
    const missing = db.prepare('SELECT id FROM elders WHERE invite_code IS NULL').all();
    const update = db.prepare('UPDATE elders SET invite_code = ? WHERE id = ?');
    for (const elder of missing) {
      update.run(generateInviteCode(), elder.id);
    }
  }

  if (!columnExists('elders', 'elder_consent_at')) {
    db.exec('ALTER TABLE elders ADD COLUMN elder_consent_at TEXT');
  }
}

if (tableExists('users')) {
  if (!columnExists('users', 'email')) {
    db.exec('ALTER TABLE users ADD COLUMN email TEXT UNIQUE');
  }
  if (!columnExists('users', 'parent_consent_at')) {
    db.exec('ALTER TABLE users ADD COLUMN parent_consent_at TEXT');
  }
}

if (tableExists('auth_sessions')) {
  db.exec('DROP TABLE auth_sessions');
}

export default db;
