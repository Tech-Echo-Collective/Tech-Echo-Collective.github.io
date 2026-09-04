import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL('../.github/workflows/backup.yml', import.meta.url),
  'utf8',
);
const translations = readFileSync(new URL('../lib/i18n.ts', import.meta.url), 'utf8');
const serverBackupSource = readFileSync(
  new URL('../lib/backup.ts', import.meta.url),
  'utf8',
);
const commandBackupSource = readFileSync(
  new URL('../scripts/backup-format.mjs', import.meta.url),
  'utf8',
);

function stringConstant(source: string, name: string): string {
  const value = new RegExp(`export const ${name} = '([^']+)';`).exec(source)?.[1];
  if (!value) throw new Error(`${name} was not found.`);
  return value;
}

describe('production backup workflow', () => {
  it('runs daily or manually on main with a restricted secret environment', () => {
    expect(workflow).toContain("cron: '23 18 * * *'");
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain("if: github.ref == 'refs/heads/main'");
    expect(workflow).toContain('name: production-backup');
    expect(workflow).toContain('deployment: false');
    expect(workflow).toMatch(/permissions:\n\s+contents: read/);
    expect(workflow).toContain('cancel-in-progress: false');
  });

  it('pins actions and uploads only authenticated ciphertext for 90 days', () => {
    const uses = [...workflow.matchAll(/uses: ([^@\s]+)@([^\s]+)/g)];
    expect(uses.length).toBe(3);
    for (const match of uses) expect(match[2]).toMatch(/^[a-f0-9]{40}$/);
    expect(workflow).toContain('backup-crypto.mjs encrypt');
    expect(workflow).toContain('backup-crypto.mjs decrypt');
    expect(workflow).toContain('verify-backup-json.mjs');
    expect(workflow).toContain('path: ${{ runner.temp }}/tech-echo-backup-');
    expect(workflow).toContain('.teb');
    expect(workflow).toContain('retention-days: 90');
    expect(workflow).not.toMatch(/path:.*\.json\s*$/m);
  });

  it('removes every plaintext copy even when an earlier step fails', () => {
    const cleanup = workflow.indexOf('name: Remove plaintext before upload');
    const upload = workflow.indexOf('name: Upload encrypted backup only');
    expect(cleanup).toBeGreaterThan(0);
    expect(cleanup).toBeLessThan(upload);
    expect(workflow.slice(cleanup, upload)).toContain('if: always()');
    expect(workflow.slice(cleanup, upload)).toContain('tech-echo-backup.json');
    expect(workflow.slice(cleanup, upload)).toContain('tech-echo-backup-verification.json');
  });

  it('discloses encrypted backup retention in every supported language', () => {
    expect(translations.match(/V0\.2\.3/g)).toHaveLength(4);
    expect(translations).not.toContain('V0.2.1');
    for (const retention of ['90 days', '90 天', '90 jours', '90 días']) {
      expect(translations).toContain(retention);
    }
  });

  it('keeps server and command-line formats on the latest database migration', () => {
    for (const name of ['BACKUP_FORMAT', 'BACKUP_SCHEMA_VERSION']) {
      expect(stringConstant(serverBackupSource, name)).toBe(
        stringConstant(commandBackupSource, name),
      );
    }
    const schemaVersion = stringConstant(serverBackupSource, 'BACKUP_SCHEMA_VERSION');
    const latestMigration = readdirSync(new URL('../drizzle/', import.meta.url))
      .filter((name) => /^\d{4}_.+\.sql$/.test(name))
      .toSorted()
      .at(-1);
    expect(latestMigration).toBe(`${schemaVersion}.sql`);
  });
});
