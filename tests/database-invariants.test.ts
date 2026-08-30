import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';

function migratedDatabase() {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  const migration = readFileSync(
    new URL('../drizzle/0000_chilly_black_widow.sql', import.meta.url),
    'utf8',
  );
  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) database.exec(statement);
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
});
