import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const exportPath = process.argv[2];
const expectedFounderGithubId = '267296498';
const requiredTables = [
  'member_number_allocations',
  'members',
  'github_credentials',
  'pending_registrations',
];
const requiredIndexes = ['idx_pending_registrations_expires_at'];
const requiredTriggers = [
  'members_member_number_immutable',
  'member_allocations_never_deleted',
  'members_never_deleted',
  'member_allocation_assignment_immutable',
  'members_github_identity_immutable',
  'members_reserved_identity_matches',
];

class VerificationError extends Error {}

function fail(message) {
  throw new VerificationError(message);
}

function expectBlocked(database, sql, parameters, label, expectedMessage) {
  database.exec('SAVEPOINT verify_invariant');
  try {
    database.prepare(sql).run(...parameters);
    fail(`${label} is not enforced.`);
  } catch (error) {
    if (error instanceof VerificationError) throw error;
    if (!(error instanceof Error) || !error.message.includes(expectedMessage)) {
      fail(`${label} did not raise its expected invariant error.`);
    }
  } finally {
    database.exec('ROLLBACK TO verify_invariant');
    database.exec('RELEASE verify_invariant');
  }
}

try {
  if (!exportPath) fail('Usage: npm run backup:verify -- /path/to/d1-export.sql');
  let sql;
  try {
    sql = readFileSync(exportPath, 'utf8');
  } catch {
    fail('Backup file could not be read.');
  }
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(sql);
  } catch {
    fail('Backup could not be imported as SQLite.');
  }
  database.exec('PRAGMA foreign_keys = ON');

  const integrity = database.prepare('PRAGMA integrity_check').get();
  if (integrity?.integrity_check !== 'ok') fail('SQLite integrity check failed.');
  if (database.prepare('PRAGMA foreign_key_check').all().length > 0) {
    fail('Foreign-key validation failed.');
  }

  const schemaNames = new Set(
    database
      .prepare("SELECT name FROM sqlite_schema WHERE type IN ('table', 'index', 'trigger')")
      .all()
      .map((row) => row.name),
  );
  for (const table of requiredTables) {
    if (!schemaNames.has(table)) fail(`Required table ${table} is missing.`);
  }
  for (const trigger of requiredTriggers) {
    if (!schemaNames.has(trigger)) fail(`Required trigger ${trigger} is missing.`);
  }
  for (const index of requiredIndexes) {
    if (!schemaNames.has(index)) fail(`Required index ${index} is missing.`);
  }

  const founder = database
    .prepare(
      `SELECT a.reserved_github_user_id, a.member_id, m.github_user_id
       FROM member_number_allocations a
       LEFT JOIN members m ON m.id = a.member_id
       WHERE a.member_number = 1`,
    )
    .get();
  if (
    !founder?.member_id ||
    founder.reserved_github_user_id !== expectedFounderGithubId ||
    founder.github_user_id !== expectedFounderGithubId
  ) {
    fail('Founder Member #001 binding is invalid.');
  }

  expectBlocked(
    database,
    'UPDATE members SET member_number = 2 WHERE member_number = 1',
    [],
    'Member Number immutability',
    'member_number is immutable',
  );
  expectBlocked(
    database,
    'DELETE FROM members WHERE member_number = 1',
    [],
    'Member retention',
    'members are retained to preserve member numbers',
  );
  expectBlocked(
    database,
    'DELETE FROM member_number_allocations WHERE member_number = 1',
    [],
    'Member Number retention',
    'member numbers are never reused',
  );
  expectBlocked(
    database,
    'UPDATE member_number_allocations SET member_id = ? WHERE member_number = 1',
    ['different-member'],
    'Member Number assignment immutability',
    'member number assignment is immutable',
  );
  expectBlocked(
    database,
    'UPDATE members SET github_user_id = ? WHERE member_number = 1',
    ['different-github-id'],
    'GitHub identity immutability',
    'github identity is immutable',
  );

  database.exec('SAVEPOINT verify_reserved_identity');
  try {
    const reservation = database
      .prepare(
        `INSERT INTO member_number_allocations
         (member_id, reserved_github_user_id) VALUES (?, ?)`,
      )
      .run('reserved-member', 'reserved-github-id');
    expectBlocked(
      database,
      `INSERT INTO members
       (id, member_number, github_user_id, github_node_id, github_username,
        display_name, avatar_url, role, preferred_locale, onboarded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'member', 'en', CURRENT_TIMESTAMP)`,
      [
        'reserved-member',
        Number(reservation.lastInsertRowid),
        'wrong-github-id',
        'wrong-node-id',
        'wrong-user',
        'Wrong User',
        'https://avatars.githubusercontent.com/u/999',
      ],
      'Reserved GitHub identity matching',
      'reserved github identity does not match',
    );
  } finally {
    database.exec('ROLLBACK TO verify_reserved_identity');
    database.exec('RELEASE verify_reserved_identity');
  }

  const orphanedAllocation = database
    .prepare(
      `SELECT 1 FROM member_number_allocations a
       LEFT JOIN members m ON m.id = a.member_id
       WHERE a.member_id IS NOT NULL AND m.id IS NULL LIMIT 1`,
    )
    .get();
  const mismatchedMember = database
    .prepare(
      `SELECT 1 FROM members m
       LEFT JOIN member_number_allocations a ON a.member_number = m.member_number
       WHERE a.member_id IS NOT m.id LIMIT 1`,
    )
    .get();
  if (orphanedAllocation || mismatchedMember) {
    fail('Member Number allocation links are inconsistent.');
  }

  const maximum = database
    .prepare(
      'SELECT COALESCE(MAX(member_number), 0) AS value FROM member_number_allocations',
    )
    .get().value;
  const sequence = database
    .prepare("SELECT seq FROM sqlite_sequence WHERE name = 'member_number_allocations'")
    .get()?.seq;
  if (typeof sequence !== 'number' || sequence < maximum) {
    fail('Member Number sequence is behind the allocation ledger.');
  }

  const members = database.prepare('SELECT COUNT(*) AS count FROM members').get().count;
  const allocations = database
    .prepare('SELECT COUNT(*) AS count FROM member_number_allocations')
    .get().count;
  console.log(`Backup verified: ${members} members, ${allocations} permanent numbers.`);
  database.close();
} catch (error) {
  console.error(
    error instanceof VerificationError ? error.message : 'Backup verification failed.',
  );
  process.exitCode = 1;
}
