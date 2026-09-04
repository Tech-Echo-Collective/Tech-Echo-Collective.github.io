import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  deleteSessionFamily: vi.fn(),
  requireFormSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  ...auth,
  sessionCookieName: (audience: string) => `__Host-tec_${audience}_session`,
}));
vi.mock('@/lib/config', () => ({
  getOriginConfig: () => ({
    accountOrigin: 'https://techecho.org',
    forumOrigin: 'https://forum.techecho.org',
  }),
}));

import { POST } from '../app/api/logout/route';

beforeEach(() => {
  vi.clearAllMocks();
  auth.requireFormSession.mockResolvedValue({
    audience: 'forum',
    familyId: 'family-id',
  });
  auth.deleteSessionFamily.mockResolvedValue(undefined);
});

describe('logout cookie expiry', () => {
  it('expires host-only production cookies with Secure attributes', async () => {
    const response = await POST(
      new Request('https://forum.techecho.org/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ csrf: 'valid-csrf-token-with-length' }),
      }),
    );
    const cookies = response.headers.get('set-cookie') || '';

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://techecho.org/');
    expect(auth.deleteSessionFamily).toHaveBeenCalledWith('family-id');
    expect(cookies).toContain('__Host-tec_forum_session=');
    expect(cookies).toContain('__Host-tec_session=');
    expect(cookies.match(/Secure/g)).toHaveLength(2);
    expect(cookies.match(/Max-Age=0/g)).toHaveLength(2);
  });
});
