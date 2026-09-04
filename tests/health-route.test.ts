import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  founderId: '267296498',
  fail: false,
}));

const schemaRows = [
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
    sql: "CREATE TRIGGER members_reserved_identity_matches BEFORE INSERT ON members WHEN reserved_github_user_id <> NEW.github_user_id BEGIN SELECT RAISE(ABORT, 'reserved github identity does not match'); END",
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

vi.mock('@/db', () => ({
  getD1: () => ({
    prepare: (sql: string) => {
      if (state.fail) throw new Error('private database detail');
      if (sql.includes('FROM member_number_allocations')) {
        return {
          first: async () => ({
            reserved_github_user_id: '267296498',
            member_id: 'founder-member',
            github_user_id: '267296498',
          }),
        };
      }
      return {
        bind: () => ({ all: async () => ({ results: schemaRows }) }),
      };
    },
  }),
}));
vi.mock('@/lib/config', () => ({ getFounderGithubUserId: () => state.founderId }));

import { GET } from '../app/api/health/route';

beforeEach(() => {
  state.founderId = '267296498';
  state.fail = false;
});

describe('health endpoint', () => {
  it('returns only stable readiness data and non-cacheable headers', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('returns a non-sensitive 503 for misconfiguration or database failure', async () => {
    state.founderId = 'wrong-id';
    const misconfigured = await GET();
    expect(misconfigured.status).toBe(503);
    expect(await misconfigured.json()).toEqual({ status: 'unavailable' });

    state.founderId = '267296498';
    state.fail = true;
    const failed = await GET();
    expect(failed.status).toBe(503);
    expect(await failed.text()).not.toContain('private database detail');
  });
});
