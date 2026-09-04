import { createHash, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { afterAll, describe, expect, it } from 'vitest';

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'tech-echo-durable-backup-'));
const verifier = fileURLToPath(
  new URL('../scripts/verify-backup-json.mjs', import.meta.url),
);
const cryptoScript = fileURLToPath(
  new URL('../scripts/backup-crypto.mjs', import.meta.url),
);
const restoreScript = fileURLToPath(
  new URL('../scripts/backup-json-to-sql.mjs', import.meta.url),
);
const generateSecretsScript = fileURLToPath(
  new URL('../scripts/generate-backup-secrets.mjs', import.meta.url),
);
const migrationDirectory = new URL('../drizzle/', import.meta.url);
const migrationNames = [
  '0000_chilly_black_widow.sql',
  '0001_tricky_captain_cross.sql',
  '0002_cute_kingpin.sql',
  '0003_mushy_mantis.sql',
];
const validEncryptedToken = `v1.${'A'.repeat(16)}.${'A'.repeat(23)}`;

function validBackup() {
  const tables = {
    member_number_allocations: [
      {
        member_number: 1,
        member_id: 'founder-member',
        reserved_github_user_id: '267296498',
        created_at: '2026-08-30 00:00:00',
      },
      {
        member_number: 2,
        member_id: null,
        reserved_github_user_id: null,
        created_at: '2026-09-01 00:00:00',
      },
    ],
    members: [
      {
        id: 'founder-member',
        member_number: 1,
        github_user_id: '267296498',
        github_node_id: 'U_founder',
        github_username: 'founder',
        display_name: 'Founder',
        avatar_url: 'https://avatars.githubusercontent.com/u/267296498',
        role: 'founder',
        preferred_locale: 'en',
        joined_at: '2026-08-30 00:00:00',
        onboarded_at: '2026-08-30 00:01:00',
        updated_at: '2026-08-30 00:01:00',
      },
    ],
    github_credentials: [
      {
        member_id: 'founder-member',
        access_token_encrypted: validEncryptedToken,
        refresh_token_encrypted: null,
        token_type: 'bearer',
        expires_at: null,
        refresh_token_expires_at: null,
        updated_at: '2026-08-30 00:01:00',
      },
    ],
  };
  return {
    format: 'tech-echo-durable-identity-snapshot',
    formatVersion: 1,
    schemaVersion: '0003_mushy_mantis',
    exportedAt: '2026-09-04T10:00:00.000Z',
    memberNumberHighWater: 2,
    counts: {
      member_number_allocations: 2,
      members: 1,
      github_credentials: 1,
    },
    dataSha256: createHash('sha256')
      .update(JSON.stringify({ memberNumberHighWater: 2, tables }))
      .digest('base64url'),
    tables,
  };
}

function writeBackup(backup = validBackup()) {
  const path = join(temporaryDirectory, `${crypto.randomUUID()}.json`);
  writeFileSync(path, JSON.stringify(backup), { mode: 0o600 });
  return path;
}

function run(script: string, args: string[], environment = process.env) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    env: { ...environment, NODE_NO_WARNINGS: '1' },
  });
}

function migratedDatabase() {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  for (const name of migrationNames) {
    const migration = readFileSync(new URL(name, migrationDirectory), 'utf8');
    for (const statement of migration.split('--> statement-breakpoint')) {
      if (statement.trim()) database.exec(statement);
    }
  }
  return database;
}

afterAll(() => rmSync(temporaryDirectory, { recursive: true, force: true }));

describe('durable backup command-line tools', () => {
  it('verifies a valid snapshot without printing identities or credentials', () => {
    const result = run(verifier, [writeBackup()]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      'Durable backup verified: 1 members, 2 permanent numbers, 1 encrypted credentials.',
    );
    expect(result.stdout).not.toContain('267296498');
    expect(result.stdout).not.toContain(validEncryptedToken);
  });

  it('enforces snapshot freshness with bounded future clock skew', () => {
    const fresh = validBackup();
    fresh.exportedAt = new Date().toISOString();
    expect(run(verifier, [writeBackup(fresh), '--max-age-seconds', '900']).status).toBe(0);

    const stale = validBackup();
    stale.exportedAt = new Date(Date.now() - 901_000).toISOString();
    expect(
      run(verifier, [writeBackup(stale), '--max-age-seconds', '900']).stderr,
    ).toContain('Backup timestamp is outside the accepted window.');

    const future = validBackup();
    future.exportedAt = new Date(Date.now() + 301_000).toISOString();
    expect(
      run(verifier, [writeBackup(future), '--max-age-seconds', '900']).stderr,
    ).toContain('Backup timestamp is outside the accepted window.');
  });

  it('rejects unsupported, tampered, or inconsistent snapshots', () => {
    const unsupported = validBackup();
    unsupported.formatVersion = 2;
    expect(run(verifier, [writeBackup(unsupported)]).stderr).toContain(
      'Backup format is unsupported.',
    );

    const wrongFounder = validBackup();
    wrongFounder.tables.members[0].github_user_id = '999';
    wrongFounder.dataSha256 = createHash('sha256')
      .update(
        JSON.stringify({
          memberNumberHighWater: wrongFounder.memberNumberHighWater,
          tables: wrongFounder.tables,
        }),
      )
      .digest('base64url');
    const founderResult = run(verifier, [writeBackup(wrongFounder)]);
    expect(founderResult.status).toBe(1);
    expect(founderResult.stderr).toContain('Founder Member #001 binding is invalid.');
    expect(founderResult.stderr).not.toContain('999');

    const changedAfterHash = validBackup();
    changedAfterHash.tables.members[0].display_name = 'Tampered';
    expect(run(verifier, [writeBackup(changedAfterHash)]).stderr).toContain(
      'Backup checksum does not match.',
    );

    const reservedMismatch = validBackup();
    reservedMismatch.tables.member_number_allocations[1].member_id = 'second-member';
    reservedMismatch.tables.member_number_allocations[1].reserved_github_user_id = '999';
    reservedMismatch.tables.members.push({
      ...reservedMismatch.tables.members[0],
      id: 'second-member',
      member_number: 2,
      github_user_id: '222',
      github_node_id: 'U_second',
      github_username: 'second',
      display_name: 'Second member',
      role: 'member',
    });
    reservedMismatch.counts.members = 2;
    reservedMismatch.dataSha256 = createHash('sha256')
      .update(
        JSON.stringify({
          memberNumberHighWater: reservedMismatch.memberNumberHighWater,
          tables: reservedMismatch.tables,
        }),
      )
      .digest('base64url');
    const mismatchPath = writeBackup(reservedMismatch);
    expect(run(verifier, [mismatchPath]).stderr).toContain(
      'Reserved GitHub allocation binding is inconsistent.',
    );
    const rejectedRestorePath = join(temporaryDirectory, `${crypto.randomUUID()}.sql`);
    expect(run(restoreScript, [mismatchPath, rejectedRestorePath]).status).toBe(1);
    expect(() => statSync(rejectedRestorePath)).toThrow();

    const malformedCredential = validBackup();
    malformedCredential.tables.github_credentials[0].access_token_encrypted =
      'v1.iv.ciphertext';
    malformedCredential.dataSha256 = createHash('sha256')
      .update(
        JSON.stringify({
          memberNumberHighWater: malformedCredential.memberNumberHighWater,
          tables: malformedCredential.tables,
        }),
      )
      .digest('base64url');
    expect(run(verifier, [writeBackup(malformedCredential)]).stderr).toContain(
      'Encrypted access token format is invalid.',
    );
  });

  it('encrypts with AES-GCM and rejects a wrong key or changed ciphertext', () => {
    const plaintextPath = writeBackup();
    const encryptedPath = join(temporaryDirectory, `${crypto.randomUUID()}.teb`);
    const decryptedPath = join(temporaryDirectory, `${crypto.randomUUID()}.json`);
    const key = randomBytes(32).toString('base64');
    const environment = { ...process.env, BACKUP_ENCRYPTION_KEY_V1: key };

    expect(
      run(cryptoScript, ['encrypt', plaintextPath, encryptedPath], environment).status,
    ).toBe(0);
    expect(readFileSync(encryptedPath).includes(Buffer.from(validEncryptedToken))).toBe(
      false,
    );
    expect(
      run(cryptoScript, ['decrypt', encryptedPath, decryptedPath], environment).status,
    ).toBe(0);
    expect(readFileSync(decryptedPath, 'utf8')).toBe(readFileSync(plaintextPath, 'utf8'));
    expect(statSync(encryptedPath).mode & 0o777).toBe(0o600);
    expect(statSync(decryptedPath).mode & 0o777).toBe(0o600);

    const wrongKeyOutput = join(temporaryDirectory, `${crypto.randomUUID()}.json`);
    const wrongKey = run(cryptoScript, ['decrypt', encryptedPath, wrongKeyOutput], {
      ...process.env,
      BACKUP_ENCRYPTION_KEY_V1: randomBytes(32).toString('base64'),
    });
    expect(wrongKey.status).toBe(1);
    expect(wrongKey.stderr).toBe('Backup decryption failed.\n');

    const tampered = Buffer.from(readFileSync(encryptedPath));
    tampered[tampered.length - 1] ^= 1;
    const tamperedPath = join(temporaryDirectory, `${crypto.randomUUID()}.teb`);
    writeFileSync(tamperedPath, tampered, { mode: 0o600 });
    const tamperedOutput = join(temporaryDirectory, `${crypto.randomUUID()}.json`);
    expect(
      run(cryptoScript, ['decrypt', tamperedPath, tamperedOutput], environment).status,
    ).toBe(1);
  });

  it('creates guarded restore SQL that works only after fresh migrations', () => {
    const backupPath = writeBackup();
    const restorePath = join(temporaryDirectory, `${crypto.randomUUID()}.sql`);
    const result = run(restoreScript, [backupPath, restorePath]);
    expect(result.status).toBe(0);
    expect(statSync(restorePath).mode & 0o777).toBe(0o600);

    const database = migratedDatabase();
    const restoreSql = readFileSync(restorePath, 'utf8');
    expect(restoreSql).not.toMatch(
      /^\s*(?:BEGIN(?: TRANSACTION| IMMEDIATE)?|COMMIT)\s*;/im,
    );
    expect(restoreSql).not.toMatch(/CREATE\s+TEMP(?:ORARY)?\s+TABLE/i);

    const contaminatedDatabase = migratedDatabase();
    contaminatedDatabase.exec(
      "INSERT INTO rate_limits (bucket_key, count, reset_at) VALUES ('stale', 1, 1)",
    );
    expect(() =>
      contaminatedDatabase.exec(`BEGIN IMMEDIATE;\n${restoreSql}\nCOMMIT;`),
    ).toThrow();
    if (contaminatedDatabase.isTransaction) contaminatedDatabase.exec('ROLLBACK;');
    expect(
      contaminatedDatabase.prepare('SELECT COUNT(*) AS count FROM members').get(),
    ).toEqual({ count: 0 });
    expect(
      contaminatedDatabase.prepare('SELECT COUNT(*) AS count FROM rate_limits').get(),
    ).toEqual({ count: 1 });
    contaminatedDatabase.close();

    // D1 wraps `wrangler d1 execute --file` imports in a transaction. Running the
    // generated file inside an outer transaction catches accidental nested BEGINs.
    database.exec(`BEGIN IMMEDIATE;\n${restoreSql}\nCOMMIT;`);
    expect(
      database
        .prepare(
          `SELECT a.reserved_github_user_id, m.github_user_id
           FROM member_number_allocations a
           JOIN members m ON m.id = a.member_id
           WHERE a.member_number = 1`,
        )
        .get(),
    ).toEqual({ reserved_github_user_id: '267296498', github_user_id: '267296498' });
    expect(
      database.prepare('SELECT COUNT(*) AS count FROM member_number_allocations').get(),
    ).toEqual({ count: 2 });
    expect(
      database
        .prepare("SELECT seq FROM sqlite_sequence WHERE name = 'member_number_allocations'")
        .get(),
    ).toEqual({ seq: 2 });
    expect(() => database.exec(`BEGIN IMMEDIATE;\n${restoreSql}\nCOMMIT;`)).toThrow();
    if (database.isTransaction) database.exec('ROLLBACK;');
    database.close();
  });

  it('refuses to overwrite an existing decrypted or restore file', () => {
    const backupPath = writeBackup();
    const output = join(temporaryDirectory, `${crypto.randomUUID()}.sql`);
    writeFileSync(output, 'do not replace', { mode: 0o600 });
    chmodSync(output, 0o600);
    expect(run(restoreScript, [backupPath, output]).status).toBe(1);
    expect(readFileSync(output, 'utf8')).toBe('do not replace');
  });

  it('generates distinct owner-only backup credentials without replacing them', () => {
    const outputDirectory = join(temporaryDirectory, crypto.randomUUID());
    expect(run(generateSecretsScript, [outputDirectory]).status).toBe(0);
    const exportToken = join(outputDirectory, 'backup-export-token.txt');
    const encryptionKey = join(outputDirectory, 'backup-encryption-key-v1.txt');
    expect(readFileSync(exportToken, 'utf8')).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(readFileSync(encryptionKey, 'utf8')).toMatch(/^[A-Za-z0-9+/]{43}=$/);
    expect(readFileSync(exportToken, 'utf8')).not.toBe(readFileSync(encryptionKey, 'utf8'));
    expect(statSync(outputDirectory).mode & 0o777).toBe(0o700);
    expect(statSync(exportToken).mode & 0o777).toBe(0o600);
    expect(statSync(encryptionKey).mode & 0o777).toBe(0o600);
    expect(run(generateSecretsScript, [outputDirectory]).status).toBe(1);
  });
});
