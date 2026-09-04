import { readFileSync, statSync } from 'node:fs';
import {
  BACKUP_MAX_BYTES,
  BackupFormatError,
  parseAndVerifyBackupJson,
  summaryForBackup,
} from './backup-format.mjs';

const args = process.argv.slice(2);
const backupPath = args[0];
let maxAgeSeconds;
if (args[1] === '--max-age-seconds' && args[2]) {
  maxAgeSeconds = Number(args[2]);
} else if (args.length > 1) {
  maxAgeSeconds = Number.NaN;
}

try {
  if (!backupPath || (args.length !== 1 && args.length !== 3)) {
    throw new BackupFormatError(
      'Usage: node scripts/verify-backup-json.mjs /path/to/backup.json [--max-age-seconds N]',
    );
  }
  let source;
  try {
    if (statSync(backupPath).size > BACKUP_MAX_BYTES) {
      throw new BackupFormatError('Backup exceeds the maximum size.');
    }
    source = readFileSync(backupPath, 'utf8');
  } catch (error) {
    if (error instanceof BackupFormatError) throw error;
    throw new BackupFormatError('Backup file could not be read.');
  }
  const backup = parseAndVerifyBackupJson(source, { maxAgeSeconds });
  const summary = summaryForBackup(backup);
  console.log(
    `Durable backup verified: ${summary.members} members, ${summary.allocations} permanent numbers, ${summary.credentials} encrypted credentials.`,
  );
} catch (error) {
  console.error(
    error instanceof BackupFormatError ? error.message : 'Backup verification failed.',
  );
  process.exitCode = 1;
}
