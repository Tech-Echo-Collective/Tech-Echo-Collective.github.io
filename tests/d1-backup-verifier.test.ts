import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'tech-echo-backup-'));
const verifier = new URL('../scripts/verify-d1-export.mjs', import.meta.url);
const migrationDirectory = new URL('../drizzle/', import.meta.url);
const migrationNames = [
  '0000_chilly_black_widow.sql',
  '0001_tricky_captain_cross.sql',
  '0002_cute_kingpin.sql',
  '0003_mushy_mantis.sql',
];

function exportSql(extraSql = '', founderGithubId = '267296498') {
  return `${migrationNames
    .slice(0, -1)
    .map((name) => readFileSync(new URL(name, migrationDirectory), 'utf8'))
    .join('\n')}\n
UPDATE member_number_allocations SET member_id = 'founder-member'
WHERE member_number = 1;
INSERT INTO members
(id, member_number, github_user_id, github_node_id, github_username,
 display_name, avatar_url, role, preferred_locale, onboarded_at)
VALUES ('founder-member', 1, '${founderGithubId}', 'founder-node', 'founder',
        'Founder', 'https://avatars.githubusercontent.com/u/267296498',
        'founder', 'en', CURRENT_TIMESTAMP);
${readFileSync(new URL(migrationNames.at(-1)!, migrationDirectory), 'utf8')}
${extraSql}`;
}

function verify(sql: string, environment: NodeJS.ProcessEnv = process.env) {
  const path = join(temporaryDirectory, `${crypto.randomUUID()}.sql`);
  writeFileSync(path, sql);
  return spawnSync(process.execPath, [fileURLToPath(verifier), path], {
    encoding: 'utf8',
    env: { ...environment, NODE_NO_WARNINGS: '1' },
  });
}

afterAll(() => rmSync(temporaryDirectory, { recursive: true, force: true }));

describe('D1 export verifier', () => {
  it('accepts a consistent export without printing identity data', () => {
    const result = verify(exportSql());
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Backup verified: 1 members, 1 permanent numbers.');
    expect(result.stdout).not.toContain('267296498');
  });

  it('rejects a missing permanent-number trigger', () => {
    const result = verify(exportSql('DROP TRIGGER members_member_number_immutable;'));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Required trigger');
  });

  it('rejects a same-named trigger that does not enforce its invariant', () => {
    const result = verify(
      exportSql(
        `DROP TRIGGER members_reserved_identity_matches;
         CREATE TRIGGER members_reserved_identity_matches
         BEFORE INSERT ON members BEGIN SELECT 1; END;`,
      ),
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Reserved GitHub identity matching is not enforced.');
  });

  it('rejects a changed founder identity', () => {
    const result = verify(exportSql('', 'wrong-id'));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Founder Member #001 binding is invalid.');
    expect(result.stderr).not.toContain('wrong-id');
  });

  it('does not allow the permanent founder ID to be overridden by the environment', () => {
    const result = verify(exportSql(), {
      ...process.env,
      FOUNDER_GITHUB_USER_ID: 'wrong-id',
    });
    expect(result.status).toBe(0);
  });

  it('does not echo SQLite import details from an invalid export', () => {
    const secretMarker = 'private-token-should-not-appear';
    const result = verify(`not valid SQL ${secretMarker}`);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Backup could not be imported as SQLite.');
    expect(result.stderr).not.toContain(secretMarker);
  });

  it('rejects a sequence behind the permanent ledger', () => {
    const result = verify(
      exportSql(
        "UPDATE sqlite_sequence SET seq = 0 WHERE name = 'member_number_allocations';",
      ),
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('sequence is behind');
  });
});
