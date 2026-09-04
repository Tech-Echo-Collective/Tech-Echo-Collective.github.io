import { describe, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({ ensureDatabase: vi.fn(), getD1: vi.fn() }));
vi.mock('../lib/config', () => ({
  getAuthConfig: vi.fn(),
  getOriginConfig: vi.fn(),
}));

import { preparePendingGitHubToken } from '../lib/registration';

describe('pending GitHub credential lifetime', () => {
  it('stores absolute OAuth deadlines at callback time', () => {
    const issuedAt = Date.parse('2026-09-04T12:00:00.000Z');
    const token = preparePendingGitHubToken(
      {
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 28_800,
        refreshTokenExpiresIn: 15_552_000,
      },
      issuedAt,
    );

    expect(token.accessExpiresAt).toBe('2026-09-04T20:00:00.000Z');
    expect(token.refreshTokenExpiresAt).toBe('2027-03-03T12:00:00.000Z');
  });
});
