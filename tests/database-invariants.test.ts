import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';

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
  return database;
}

describe('member number database invariants', () => {
  it('keeps an assigned number immutable and prevents member deletion', () => {
    const database = migratedDatabase();
    database
      .prepare(
        `UPDATE member_number_allocations
         SET member_id = 'member-1'
         WHERE member_number = 1`,
      )
      .run();
    database
      .prepare(
        `INSERT INTO members
         (id, member_number, github_user_id, github_node_id, github_username,
          display_name, avatar_url, role, preferred_locale)
         VALUES ('member-1', 1, '267296498', 'node-1', 'founder', 'Founder',
                 'https://avatars.githubusercontent.com/u/267296498', 'founder', 'en')`,
      )
      .run();

    expect(() =>
      database.prepare('UPDATE members SET member_number = 2 WHERE id = ?').run('member-1'),
    ).toThrow(/immutable/);
    expect(() =>
      database.prepare('DELETE FROM members WHERE id = ?').run('member-1'),
    ).toThrow(/retained/);
    expect(() =>
      database
        .prepare(
          'UPDATE member_number_allocations SET member_id = ? WHERE member_number = 1',
        )
        .run('member-2'),
    ).toThrow(/assignment is immutable/);
    expect(() =>
      database
        .prepare('DELETE FROM member_number_allocations WHERE member_number = 1')
        .run(),
    ).toThrow(/never reused/);
  });

  it('rejects duplicate stable GitHub identities', () => {
    const database = migratedDatabase();
    database
      .prepare('INSERT INTO member_number_allocations (member_id) VALUES (?)')
      .run('member-2');
    const number = database
      .prepare('SELECT member_number FROM member_number_allocations WHERE member_id = ?')
      .get('member-2') as { member_number: number };
    const insert = database.prepare(
      `INSERT INTO members
       (id, member_number, github_user_id, github_node_id, github_username,
        display_name, avatar_url, role, preferred_locale)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'member', 'en')`,
    );
    insert.run(
      'member-2',
      number.member_number,
      '222',
      'node-2',
      'second',
      'Second',
      'https://avatars.githubusercontent.com/u/222',
    );
    database
      .prepare('INSERT INTO member_number_allocations (member_id) VALUES (?)')
      .run('member-3');
    const next = database
      .prepare('SELECT member_number FROM member_number_allocations WHERE member_id = ?')
      .get('member-3') as { member_number: number };

    expect(() =>
      insert.run(
        'member-3',
        next.member_number,
        '222',
        'node-3',
        'renamed',
        'Renamed',
        'https://avatars.githubusercontent.com/u/222',
      ),
    ).toThrow(/UNIQUE constraint failed: members.github_user_id/);
  });

  it('isolates session audiences and consumes SSO handoffs once', () => {
    const database = migratedDatabase();
    database
      .prepare(
        `UPDATE member_number_allocations SET member_id = 'member-1'
         WHERE member_number = 1`,
      )
      .run();
    database
      .prepare(
        `INSERT INTO members
         (id, member_number, github_user_id, github_node_id, github_username,
          display_name, avatar_url, role, preferred_locale)
         VALUES ('member-1', 1, '267296498', 'node-1', 'founder', 'Founder',
                 'https://avatars.githubusercontent.com/u/267296498', 'founder', 'en')`,
      )
      .run();
    database
      .prepare(
        `INSERT INTO sessions (token_hash, member_id, expires_at)
         VALUES ('account-token', 'member-1', '2099-01-01T00:00:00.000Z')`,
      )
      .run();
    database
      .prepare(
        `INSERT INTO session_contexts (token_hash, audience, family_id)
         VALUES ('account-token', 'account', 'family-1')`,
      )
      .run();
    database
      .prepare(
        `INSERT INTO sessions (token_hash, member_id, expires_at)
         VALUES ('legacy-token', 'member-1', '2099-01-01T00:00:00.000Z')`,
      )
      .run();
    database
      .prepare(
        `DELETE FROM sessions
         WHERE token_hash NOT IN (SELECT token_hash FROM session_contexts)`,
      )
      .run();
    expect(
      database
        .prepare('SELECT token_hash FROM sessions WHERE token_hash = ?')
        .get('legacy-token'),
    ).toBeUndefined();

    expect(
      database
        .prepare(
          `SELECT s.member_id FROM sessions s
           JOIN session_contexts sc ON sc.token_hash = s.token_hash
           WHERE s.token_hash = ? AND sc.audience = ?`,
        )
        .get('account-token', 'forum'),
    ).toBeUndefined();

    database
      .prepare(
        `INSERT INTO sso_handoffs
         (token_hash, member_id, family_id, source_session_hash, target_audience,
          return_path, expires_at)
         VALUES ('ticket', 'member-1', 'family-1', 'account-token', 'forum',
                 '/forum', '2099-01-01T00:00:00.000Z')`,
      )
      .run();
    expect(() =>
      database
        .prepare(
          `INSERT INTO sso_handoffs
           (token_hash, member_id, family_id, source_session_hash, target_audience,
            return_path, expires_at)
           VALUES ('second-ticket', 'member-1', 'family-1', 'account-token', 'forum',
                   '/forum/new', '2099-01-01T00:00:00.000Z')`,
        )
        .run(),
    ).toThrow(/UNIQUE constraint failed: sso_handoffs.family_id/);
    const consume = database.prepare(
      `DELETE FROM sso_handoffs WHERE token_hash = ?
       RETURNING member_id, family_id, return_path`,
    );
    expect(consume.get('ticket')).toMatchObject({
      member_id: 'member-1',
      family_id: 'family-1',
      return_path: '/forum',
    });
    expect(consume.get('ticket')).toBeUndefined();
  });
});
