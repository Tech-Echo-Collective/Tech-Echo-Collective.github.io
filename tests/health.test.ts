import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import {
  founderInvariantIsHealthy,
  REQUIRED_HEALTH_SCHEMA_OBJECTS,
  type SchemaHealthRow,
} from '../lib/health';

const expected = '267296498';

const healthySchema: SchemaHealthRow[] = [
  {
    name: 'members_member_number_immutable',
    type: 'trigger',
    sql: "CREATE TRIGGER members_member_number_immutable BEFORE UPDATE OF member_number ON members BEGIN SELECT RAISE(ABORT, 'member_number is immutable'); END",
  },
  {
    name: 'member_allocations_never_deleted',
    type: 'trigger',
    sql: "CREATE TRIGGER member_allocations_never_deleted BEFORE DELETE ON member_number_allocations BEGIN SELECT RAISE(ABORT, 'member numbers are never reused'); END",
  },
  {
    name: 'members_never_deleted',
    type: 'trigger',
    sql: "CREATE TRIGGER members_never_deleted BEFORE DELETE ON members BEGIN SELECT RAISE(ABORT, 'members are retained to preserve member numbers'); END",
  },
  {
    name: 'member_allocation_assignment_immutable',
    type: 'trigger',
    sql: "CREATE TRIGGER member_allocation_assignment_immutable BEFORE UPDATE OF member_id ON member_number_allocations BEGIN SELECT RAISE(ABORT, 'member number assignment is immutable'); END",
  },
  {
    name: 'members_github_identity_immutable',
    type: 'trigger',
    sql: "CREATE TRIGGER members_github_identity_immutable BEFORE UPDATE OF github_user_id ON members BEGIN SELECT RAISE(ABORT, 'github identity is immutable'); END",
  },
  {
    name: 'members_reserved_identity_matches',
    type: 'trigger',
    sql: "CREATE TRIGGER members_reserved_identity_matches BEFORE INSERT ON members WHEN EXISTS (SELECT 1 FROM member_number_allocations a WHERE a.member_number = NEW.member_number AND a.reserved_github_user_id IS NOT NULL AND a.reserved_github_user_id <> NEW.github_user_id) BEGIN SELECT RAISE(ABORT, 'reserved github identity does not match'); END",
  },
  {
    name: 'pending_registrations',
    type: 'table',
    sql: 'CREATE TABLE pending_registrations',
  },
  {
    name: 'idx_pending_registrations_expires_at',
    type: 'index',
    sql: 'CREATE INDEX idx_pending_registrations_expires_at ON pending_registrations(expires_at)',
  },
];

describe('production health invariants', () => {
  it('accepts only the permanent assigned #001 identity with every trigger', () => {
    expect(
      founderInvariantIsHealthy(
        {
          reserved_github_user_id: expected,
          member_id: 'founder-member',
          github_user_id: expected,
        },
        healthySchema,
        expected,
      ),
    ).toBe(true);
  });

  it('rejects a missing or changed founder binding', () => {
    expect(founderInvariantIsHealthy(null, healthySchema, expected)).toBe(false);
    expect(
      founderInvariantIsHealthy(
        {
          reserved_github_user_id: expected,
          member_id: 'founder-member',
          github_user_id: 'someone-else',
        },
        healthySchema,
        expected,
      ),
    ).toBe(false);
  });

  it('rejects a database missing an immutability trigger', () => {
    expect(
      founderInvariantIsHealthy(
        {
          reserved_github_user_id: expected,
          member_id: 'founder-member',
          github_user_id: expected,
        },
        healthySchema.slice(1),
        expected,
      ),
    ).toBe(false);
  });

  it('rejects a missing v0.2.1 pending-registration index or changed trigger body', () => {
    expect(
      founderInvariantIsHealthy(
        {
          reserved_github_user_id: expected,
          member_id: 'founder-member',
          github_user_id: expected,
        },
        healthySchema.filter((row) => row.name !== 'idx_pending_registrations_expires_at'),
        expected,
      ),
    ).toBe(false);
    expect(
      founderInvariantIsHealthy(
        {
          reserved_github_user_id: expected,
          member_id: 'founder-member',
          github_user_id: expected,
        },
        healthySchema.map((row) =>
          row.name === 'members_never_deleted' ? { ...row, sql: 'SELECT 1' } : row,
        ),
        expected,
      ),
    ).toBe(false);
  });

  it('rejects a founder environment override even when the database is correct', () => {
    expect(
      founderInvariantIsHealthy(
        {
          reserved_github_user_id: expected,
          member_id: 'founder-member',
          github_user_id: expected,
        },
        healthySchema,
        'wrong-id',
      ),
    ).toBe(false);
  });

  it('accepts sqlite_schema SQL produced by the real migrations', () => {
    const database = new DatabaseSync(':memory:');
    const migrationDirectory = new URL('../drizzle/', import.meta.url);
    for (const filename of readdirSync(migrationDirectory)
      .filter((name) => /^\d+_.+\.sql$/.test(name))
      .toSorted()) {
      const migration = readFileSync(new URL(filename, migrationDirectory), 'utf8');
      for (const statement of migration.split('--> statement-breakpoint')) {
        if (statement.trim()) database.exec(statement);
      }
    }
    database
      .prepare(
        `UPDATE member_number_allocations SET member_id = 'founder-member'
         WHERE member_number = 1`,
      )
      .run();
    database
      .prepare(
        `INSERT INTO members
         (id, member_number, github_user_id, github_node_id, github_username,
          display_name, avatar_url, role, preferred_locale, onboarded_at)
         VALUES ('founder-member', 1, '267296498', 'founder-node', 'founder',
                 'Founder', 'https://avatars.githubusercontent.com/u/267296498',
                 'founder', 'en', CURRENT_TIMESTAMP)`,
      )
      .run();
    const founder = database
      .prepare(
        `SELECT a.reserved_github_user_id, a.member_id, m.github_user_id
         FROM member_number_allocations a
         LEFT JOIN members m ON m.id = a.member_id
         WHERE a.member_number = 1`,
      )
      .get() as {
      reserved_github_user_id: string;
      member_id: string;
      github_user_id: string;
    };
    const placeholders = REQUIRED_HEALTH_SCHEMA_OBJECTS.map(() => '?').join(',');
    const rows = database
      .prepare(`SELECT name, type, sql FROM sqlite_schema WHERE name IN (${placeholders})`)
      .all(...REQUIRED_HEALTH_SCHEMA_OBJECTS)
      .map(
        (row): SchemaHealthRow => ({
          name: String(row.name),
          type: String(row.type),
          sql: typeof row.sql === 'string' ? row.sql : null,
        }),
      );

    expect(founderInvariantIsHealthy(founder, rows, expected)).toBe(true);
    database.close();
  });
});
