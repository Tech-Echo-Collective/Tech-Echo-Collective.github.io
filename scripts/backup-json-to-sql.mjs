import { readFileSync, statSync, writeFileSync } from 'node:fs';
import {
  BACKUP_MAX_BYTES,
  BackupFormatError,
  parseAndVerifyBackupJson,
} from './backup-format.mjs';

const maximumStatementBytes = 90_000;

function sqlValue(value) {
  if (value === null) return 'NULL';
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  if (typeof value === 'string' && !value.includes('\0')) {
    return `'${value.replaceAll("'", "''")}'`;
  }
  throw new BackupFormatError('Backup contains a value that cannot be restored.');
}

function insertStatements(table, columns, rows) {
  if (rows.length === 0) return '';
  const prefix = `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n`;
  const statements = [];
  let tuples = [];
  for (const row of rows) {
    const tuple = `(${columns.map((column) => sqlValue(row[column])).join(', ')})`;
    if (Buffer.byteLength(`${prefix}${tuple};`, 'utf8') > maximumStatementBytes) {
      throw new BackupFormatError('A backup row exceeds the restore statement limit.');
    }
    const candidate = `${prefix}${[...tuples, tuple].join(',\n')};`;
    if (tuples.length > 0 && Buffer.byteLength(candidate, 'utf8') > maximumStatementBytes) {
      statements.push(`${prefix}${tuples.join(',\n')};`);
      tuples = [tuple];
    } else {
      tuples.push(tuple);
    }
  }
  if (tuples.length > 0) statements.push(`${prefix}${tuples.join(',\n')};`);
  return statements.join('\n');
}

function restoreSql(backup) {
  const allocations = backup.tables.member_number_allocations;
  const founderAllocation = allocations.find(
    (allocation) => allocation.member_number === 1,
  );
  const laterAllocations = allocations.filter(
    (allocation) => allocation.member_number !== 1,
  );
  const allocationColumns = [
    'member_number',
    'member_id',
    'reserved_github_user_id',
    'created_at',
  ];
  const memberColumns = [
    'id',
    'member_number',
    'github_user_id',
    'github_node_id',
    'github_username',
    'display_name',
    'avatar_url',
    'role',
    'preferred_locale',
    'joined_at',
    'onboarded_at',
    'updated_at',
  ];
  const credentialColumns = [
    'member_id',
    'access_token_encrypted',
    'refresh_token_encrypted',
    'token_type',
    'expires_at',
    'refresh_token_expires_at',
    'updated_at',
  ];

  return `-- Tech Echo durable identity restore
-- Snapshot: ${backup.exportedAt}
-- Apply all migrations through ${backup.schemaVersion} to a NEW isolated database first.
-- Import this file with "wrangler d1 execute --file"; D1 supplies the transaction.
PRAGMA foreign_keys = ON;
CREATE TABLE tech_echo_restore_guard (
  value INTEGER NOT NULL CHECK (value = 1)
);
INSERT INTO tech_echo_restore_guard (value)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM members) = 0 AND
  (SELECT COUNT(*) FROM github_credentials) = 0 AND
  (SELECT COUNT(*) FROM sessions) = 0 AND
  (SELECT COUNT(*) FROM session_contexts) = 0 AND
  (SELECT COUNT(*) FROM sso_handoffs) = 0 AND
  (SELECT COUNT(*) FROM oauth_states) = 0 AND
  (SELECT COUNT(*) FROM oauth_return_targets) = 0 AND
  (SELECT COUNT(*) FROM pending_registrations) = 0 AND
  (SELECT COUNT(*) FROM rate_limits) = 0 AND
  (SELECT COUNT(*) FROM github_contributor_cache) = 0 AND
  (SELECT COUNT(*) FROM member_number_allocations) = 1 AND
  (SELECT member_id FROM member_number_allocations WHERE member_number = 1) IS NULL AND
  (SELECT reserved_github_user_id FROM member_number_allocations WHERE member_number = 1) = '267296498'
THEN 1 ELSE 0 END;
UPDATE member_number_allocations
SET member_id = ${sqlValue(founderAllocation.member_id)},
    reserved_github_user_id = ${sqlValue(founderAllocation.reserved_github_user_id)},
    created_at = ${sqlValue(founderAllocation.created_at)}
WHERE member_number = 1;
${insertStatements('member_number_allocations', allocationColumns, laterAllocations)}
${insertStatements('members', memberColumns, backup.tables.members)}
${insertStatements('github_credentials', credentialColumns, backup.tables.github_credentials)}
UPDATE sqlite_sequence
SET seq = MAX(seq, ${sqlValue(backup.memberNumberHighWater)})
WHERE name = 'member_number_allocations';
DELETE FROM tech_echo_restore_guard;
INSERT INTO tech_echo_restore_guard (value)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM member_number_allocations) = ${backup.counts.member_number_allocations} AND
  (SELECT COUNT(*) FROM members) = ${backup.counts.members} AND
  (SELECT COUNT(*) FROM github_credentials) = ${backup.counts.github_credentials} AND
  (SELECT seq FROM sqlite_sequence WHERE name = 'member_number_allocations') >= ${sqlValue(backup.memberNumberHighWater)} AND
  (SELECT github_user_id FROM members WHERE member_number = 1) = '267296498'
THEN 1 ELSE 0 END;
DROP TABLE tech_echo_restore_guard;
`;
}

const [inputPath, outputPath] = process.argv.slice(2);
try {
  if (!inputPath || !outputPath || process.argv.length !== 4) {
    throw new BackupFormatError(
      'Usage: node scripts/backup-json-to-sql.mjs /path/to/backup.json /path/to/restore.sql',
    );
  }
  let source;
  try {
    if (statSync(inputPath).size > BACKUP_MAX_BYTES) {
      throw new BackupFormatError('Backup exceeds the maximum size.');
    }
    source = readFileSync(inputPath, 'utf8');
  } catch (error) {
    if (error instanceof BackupFormatError) throw error;
    throw new BackupFormatError('Backup file could not be read.');
  }
  const backup = parseAndVerifyBackupJson(source);
  writeFileSync(outputPath, restoreSql(backup), { flag: 'wx', mode: 0o600 });
  console.log('Restore SQL created for a new isolated database.');
} catch (error) {
  console.error(
    error instanceof BackupFormatError ? error.message : 'Restore SQL creation failed.',
  );
  process.exitCode = 1;
}
