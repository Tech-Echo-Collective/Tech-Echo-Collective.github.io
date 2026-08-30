import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

const DEFAULT_FOUNDER_GITHUB_USER_ID = '267296498';
let databaseReady: Promise<void> | undefined;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS member_number_allocations (
    member_number INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT UNIQUE,
    reserved_github_user_id TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    member_number INTEGER NOT NULL UNIQUE,
    github_user_id TEXT NOT NULL UNIQUE,
    github_node_id TEXT NOT NULL UNIQUE,
    github_username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('founder','admin','moderator','member')),
    preferred_locale TEXT NOT NULL DEFAULT 'en' CHECK (preferred_locale IN ('en','zh','fr','es')),
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    onboarded_at TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_number) REFERENCES member_number_allocations(member_number)
  )`,
  `CREATE TABLE IF NOT EXISTS github_credentials (
    member_id TEXT PRIMARY KEY,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_type TEXT NOT NULL DEFAULT 'bearer',
    expires_at TEXT,
    refresh_token_expires_at TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS oauth_states (
    state_hash TEXT PRIMARY KEY,
    verifier_encrypted TEXT NOT NULL,
    intent TEXT NOT NULL CHECK (intent IN ('signin','join')),
    locale TEXT NOT NULL CHECK (locale IN ('en','zh','fr','es')),
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    bucket_key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_sessions_member_id ON sessions(member_id)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
  'CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at)',
  'CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at)',
  `CREATE TRIGGER IF NOT EXISTS members_member_number_immutable
   BEFORE UPDATE OF member_number ON members
   WHEN OLD.member_number <> NEW.member_number
   BEGIN SELECT RAISE(ABORT, 'member_number is immutable'); END`,
  `CREATE TRIGGER IF NOT EXISTS member_allocations_never_deleted
   BEFORE DELETE ON member_number_allocations
   BEGIN SELECT RAISE(ABORT, 'member numbers are never reused'); END`,
  `CREATE TRIGGER IF NOT EXISTS members_never_deleted
   BEFORE DELETE ON members
   BEGIN SELECT RAISE(ABORT, 'members are retained to preserve member numbers'); END`,
  `CREATE TRIGGER IF NOT EXISTS member_allocation_assignment_immutable
   BEFORE UPDATE OF member_id ON member_number_allocations
   WHEN OLD.member_id IS NOT NULL AND OLD.member_id IS NOT NEW.member_id
   BEGIN SELECT RAISE(ABORT, 'member number assignment is immutable'); END`,
];

export function getD1(): D1Database {
  if (!env.DB) {
    throw new Error('D1 binding `DB` is unavailable.');
  }
  return env.DB;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}

export async function ensureDatabase(): Promise<void> {
  databaseReady ??= (async () => {
    const d1 = getD1();
    await d1.batch(schemaStatements.map((statement) => d1.prepare(statement)));

    const founderId = env.FOUNDER_GITHUB_USER_ID || DEFAULT_FOUNDER_GITHUB_USER_ID;
    await d1
      .prepare(
        `INSERT OR IGNORE INTO member_number_allocations
         (member_number, reserved_github_user_id) VALUES (1, ?)`,
      )
      .bind(founderId)
      .run();
    await d1
      .prepare(
        `UPDATE member_number_allocations SET reserved_github_user_id = ?
         WHERE member_number = 1 AND member_id IS NULL`,
      )
      .bind(founderId)
      .run();
    await d1.prepare('PRAGMA optimize').run();
  })();

  return databaseReady;
}
