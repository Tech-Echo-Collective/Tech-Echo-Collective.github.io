import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type SqlValue = string | number | bigint | Uint8Array | null;

class TestStatement {
  private parameters: SqlValue[] = [];

  constructor(
    private readonly database: DatabaseSync,
    private readonly sql: string,
    private readonly failurePattern: () => string | null,
  ) {}

  bind(...parameters: SqlValue[]) {
    this.parameters = parameters;
    return this;
  }

  async first<T>() {
    return (
      (this.database.prepare(this.sql).get(...this.parameters) as T | undefined) || null
    );
  }

  async all<T>() {
    return {
      results: this.database.prepare(this.sql).all(...this.parameters) as T[],
    };
  }

  async run() {
    return this.execute();
  }

  execute() {
    const pattern = this.failurePattern();
    if (pattern && this.sql.includes(pattern))
      throw new Error('simulated D1 batch failure');
    return this.database.prepare(this.sql).run(...this.parameters);
  }
}

class TestD1 {
  failOnSql: string | null = null;

  constructor(readonly database: DatabaseSync) {}

  prepare(sql: string) {
    return new TestStatement(this.database, sql, () => this.failOnSql);
  }

  async batch(statements: TestStatement[]) {
    this.database.exec('BEGIN');
    try {
      const results = statements.map((statement) => statement.execute());
      this.database.exec('COMMIT');
      return results;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }
}

const state = vi.hoisted(() => ({ currentD1: null as unknown }));
const registration = vi.hoisted(() => ({ consumePendingRegistration: vi.fn() }));

vi.mock('../db', () => ({
  ensureDatabase: vi.fn(),
  getD1: () => state.currentD1,
}));
vi.mock('../lib/config', () => ({
  forumEntryUrl: () => 'https://forum.techecho.org/',
  getAuthConfig: () => ({ tokenEncryptionKey: 'test-key' }),
  getFounderGithubUserId: () => '267296498',
  getOriginConfig: () => ({
    accountOrigin: 'https://techecho.org',
    forumOrigin: 'https://forum.techecho.org',
  }),
  isAuthConfigured: () => true,
}));
vi.mock('../lib/crypto', () => ({
  encryptSecret: async (value: string) => `encrypted:${value}`,
  hmac: vi.fn(),
  randomToken: () => 'random-token',
  sha256: async (value: string) => `hash:${value}`,
  timingSafeEqual: () => true,
}));
vi.mock('../lib/registration', () => registration);

import { completePendingRegistration } from '../lib/auth';

function migratedDatabase() {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  const migrationDirectory = new URL('../drizzle/', import.meta.url);
  for (const filename of readdirSync(migrationDirectory)
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .toSorted()) {
    const migration = readFileSync(new URL(filename, migrationDirectory), 'utf8');
    for (const statement of migration.split('--> statement-breakpoint')) {
      if (statement.trim()) database.exec(statement);
    }
  }
  return new TestD1(database);
}

function pending(githubId: number, login = `member-${githubId}`) {
  return {
    viewer: {
      id: githubId,
      node_id: `node-${githubId}`,
      login,
      name: `Member ${githubId}`,
      avatar_url: `https://avatars.githubusercontent.com/u/${githubId}`,
    },
    token: {
      accessToken: `access-${githubId}`,
      refreshToken: `refresh-${githubId}`,
      tokenType: 'bearer',
      accessExpiresAt: '2026-09-04T20:00:00.000Z',
      refreshTokenExpiresAt: '2027-03-03T12:00:00.000Z',
    },
    locale: 'en' as const,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('pending registration persistence', () => {
  it('assigns #001 only to the founder and the next number to a regular member', async () => {
    const founderD1 = migratedDatabase();
    state.currentD1 = founderD1;
    registration.consumePendingRegistration.mockResolvedValueOnce(pending(267296498));

    const founder = await completePendingRegistration('founder-token', 'Founder', 'en');
    expect(founder.member.memberNumber).toBe(1);

    const regularD1 = migratedDatabase();
    state.currentD1 = regularD1;
    registration.consumePendingRegistration.mockResolvedValueOnce(pending(222));
    const regular = await completePendingRegistration('regular-token', 'Regular', 'en');
    expect(regular.member.memberNumber).toBe(2);
    expect(
      regularD1.database
        .prepare('SELECT expires_at FROM github_credentials WHERE member_id = ?')
        .get(regular.member.id),
    ).toEqual({ expires_at: '2026-09-04T20:00:00.000Z' });
  });

  it('reuses a legacy incomplete member number and never allocates another one', async () => {
    const d1 = migratedDatabase();
    state.currentD1 = d1;
    d1.database
      .prepare('INSERT INTO member_number_allocations (member_id) VALUES (?)')
      .run('legacy-member');
    d1.database
      .prepare(
        `INSERT INTO members
         (id, member_number, github_user_id, github_node_id, github_username,
          display_name, avatar_url, role, preferred_locale)
         VALUES ('legacy-member', 2, '222', 'node-222', 'legacy', 'Legacy',
                 'https://avatars.githubusercontent.com/u/222', 'member', 'en')`,
      )
      .run();
    registration.consumePendingRegistration.mockResolvedValueOnce(pending(222));

    const completed = await completePendingRegistration('legacy-token', 'Confirmed', 'fr');

    expect(completed.member.memberNumber).toBe(2);
    expect(completed.member.onboardedAt).not.toBeNull();
    expect(
      d1.database.prepare('SELECT COUNT(*) AS count FROM member_number_allocations').get(),
    ).toEqual({ count: 2 });
  });

  it('cannot allocate on replay and rolls back member plus allocation on credential failure', async () => {
    const replayD1 = migratedDatabase();
    state.currentD1 = replayD1;
    registration.consumePendingRegistration
      .mockResolvedValueOnce(pending(222))
      .mockRejectedValueOnce(new Error('Pending registration is already used.'));
    await completePendingRegistration('one-use-token', 'Regular', 'en');
    await expect(
      completePendingRegistration('one-use-token', 'Regular', 'en'),
    ).rejects.toThrow(/already used/);
    expect(
      replayD1.database
        .prepare('SELECT COUNT(*) AS count FROM member_number_allocations')
        .get(),
    ).toEqual({ count: 2 });

    const failedD1 = migratedDatabase();
    failedD1.failOnSql = 'INSERT INTO github_credentials';
    state.currentD1 = failedD1;
    registration.consumePendingRegistration.mockResolvedValueOnce(pending(333));
    await expect(
      completePendingRegistration('failed-token', 'Failed', 'en'),
    ).rejects.toThrow(/simulated D1 batch failure/);
    expect(
      failedD1.database.prepare('SELECT COUNT(*) AS count FROM members').get(),
    ).toEqual({ count: 0 });
    expect(
      failedD1.database
        .prepare('SELECT COUNT(*) AS count FROM member_number_allocations')
        .get(),
    ).toEqual({ count: 1 });
  });
});
