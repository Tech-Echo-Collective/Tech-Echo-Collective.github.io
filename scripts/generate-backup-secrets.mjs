import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const outputDirectory = resolve(process.argv[2] || '.d1-backups');
const exportTokenPath = resolve(outputDirectory, 'backup-export-token.txt');
const encryptionKeyPath = resolve(outputDirectory, 'backup-encryption-key-v1.txt');

try {
  if (
    process.argv.length > 3 ||
    existsSync(exportTokenPath) ||
    existsSync(encryptionKeyPath)
  ) {
    throw new Error('refuse overwrite');
  }
  mkdirSync(outputDirectory, { recursive: true, mode: 0o700 });
  chmodSync(outputDirectory, 0o700);
  writeFileSync(exportTokenPath, randomBytes(48).toString('base64url'), {
    flag: 'wx',
    mode: 0o600,
  });
  writeFileSync(encryptionKeyPath, randomBytes(32).toString('base64'), {
    flag: 'wx',
    mode: 0o600,
  });
  console.log('Backup credentials created with owner-only permissions.');
} catch {
  console.error('Backup credential generation failed; existing files were not replaced.');
  process.exitCode = 1;
}
