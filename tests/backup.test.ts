import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  batches: 0,
  queries: [] as string[],
  results: [] as Array<{ success: boolean; results: unknown[] }>,
}));

vi.mock('@/db', () => ({
  getD1: () => ({
    prepare: (query: string) => {
      state.queries.push(query);
      return { query };
    },
    batch: async () => {
      state.batches += 1;
      return state.results;
    },
  }),
}));
vi.mock('@/lib/config', () => ({
  getFounderGithubUserId: () => '267296498',
}));

import {
  BACKUP_FORMAT,
  BACKUP_MAX_ROWS_PER_TABLE,
  createDurableIdentityBackup,
  type DurableBackupTables,
  validateDurableBackupData,
} from '../lib/backup';

const validEncryptedToken = `v1.${'A'.repeat(16)}.${'A'.repeat(23)}`;

function durableTables(): DurableBackupTables {
  return {
    member_number_allocations: [
      {
        member_number: 1,
        member_id: 'founder-member',
        reserved_github_user_id: '267296498',
        created_at: '2026-08-30 00:00:00',
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
}

beforeEach(() => {
  state.batches = 0;
  state.queries = [];
  const tables = durableTables();
  state.results = [
    { success: true, results: tables.member_number_allocations },
    { success: true, results: tables.members },
    { success: true, results: tables.github_credentials },
    { success: true, results: [{ seq: 1 }] },
  ];
});

describe('durable identity backup', () => {
  it('reads all durable records and the number ledger in one snapshot batch', async () => {
    const backup = await createDurableIdentityBackup(new Date('2026-09-04T10:00:00.000Z'));

    expect(state.batches).toBe(1);
    expect(state.queries).toHaveLength(4);
    expect(state.queries.join('\n')).not.toMatch(
      /sessions|oauth_states|pending_registrations|rate_limits|contributor_cache/,
    );
    expect(backup).toMatchObject({
      format: BACKUP_FORMAT,
      formatVersion: 1,
      schemaVersion: '0003_mushy_mantis',
      exportedAt: '2026-09-04T10:00:00.000Z',
      memberNumberHighWater: 1,
      counts: {
        member_number_allocations: 1,
        members: 1,
        github_credentials: 1,
      },
    });
    expect(backup.dataSha256).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('rejects a changed or incomplete founder binding', () => {
    const tables = durableTables();
    tables.members[0].github_user_id = '123';
    expect(() => validateDurableBackupData(tables, 1)).toThrow(
      'Founder Member #001 binding is invalid.',
    );

    tables.members[0].github_user_id = '267296498';
    tables.members[0].onboarded_at = null;
    expect(() => validateDurableBackupData(tables, 1)).toThrow(
      'Founder Member #001 binding is invalid.',
    );
  });

  it('rejects broken links, orphaned credentials, and a stale high-water mark', () => {
    const brokenLink = durableTables();
    brokenLink.member_number_allocations[0].member_id = 'someone-else';
    expect(() => validateDurableBackupData(brokenLink, 1)).toThrow(
      'allocation links are inconsistent',
    );

    const orphanedCredential = durableTables();
    orphanedCredential.github_credentials[0].member_id = 'missing-member';
    expect(() => validateDurableBackupData(orphanedCredential, 1)).toThrow(
      'unknown member',
    );

    const staleSequence = durableTables();
    staleSequence.member_number_allocations.push({
      member_number: 2,
      member_id: null,
      reserved_github_user_id: null,
      created_at: '2026-09-04 00:00:00',
    });
    expect(() => validateDurableBackupData(staleSequence, 1)).toThrow(
      'high-water mark is behind',
    );
  });

  it('rejects a reserved identity mismatch and malformed encrypted credentials', () => {
    const reservedMismatch = durableTables();
    reservedMismatch.member_number_allocations.push({
      member_number: 2,
      member_id: 'second-member',
      reserved_github_user_id: '999',
      created_at: '2026-09-04 00:00:00',
    });
    reservedMismatch.members.push({
      ...reservedMismatch.members[0],
      id: 'second-member',
      member_number: 2,
      github_user_id: '222',
      github_node_id: 'U_second',
      github_username: 'second',
      display_name: 'Second member',
      role: 'member',
    });
    expect(() => validateDurableBackupData(reservedMismatch, 2)).toThrow(
      'Reserved GitHub allocation binding is inconsistent.',
    );

    const malformedCredential = durableTables();
    malformedCredential.github_credentials[0].access_token_encrypted = 'v1.iv.ciphertext';
    expect(() => validateDurableBackupData(malformedCredential, 1)).toThrow(
      'Encrypted access token format is invalid.',
    );
  });

  it('fails instead of truncating an oversized table', () => {
    const tables = durableTables();
    tables.github_credentials = Array.from(
      { length: BACKUP_MAX_ROWS_PER_TABLE + 1 },
      () => tables.github_credentials[0],
    );
    expect(() => validateDurableBackupData(tables, 1)).toThrow('row limit');
  });
});
