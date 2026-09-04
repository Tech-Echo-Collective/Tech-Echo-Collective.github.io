import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  completePendingRegistration: vi.fn(),
  createSession: vi.fn(),
  findMemberByGithubUserId: vi.fn(),
}));
const registration = vi.hoisted(() => ({ requirePendingRegistrationForm: vi.fn() }));
const rateLimit = vi.hoisted(() => {
  class RateLimitError extends Error {}
  return { enforceRateLimit: vi.fn(), RateLimitError };
});

vi.mock('@/lib/auth', () => ({
  ...auth,
  sessionCookieName: () => '__Host-tec_account_session',
  sessionCookieOptions: () => ({ httpOnly: true, secure: true, path: '/' }),
}));
vi.mock('@/lib/config', () => ({
  getAuthConfig: () => ({
    accountOrigin: 'https://techecho.org',
    appOrigin: 'https://techecho.org',
  }),
}));
vi.mock('@/lib/rate-limit', () => rateLimit);
vi.mock('@/lib/registration', () => ({
  ...registration,
  pendingRegistrationCookieName: () => '__Host-tec_pending_registration',
}));

import { POST } from '../app/api/onboarding/route';

const member = {
  id: 'member-2',
  memberNumber: 2,
  githubUserId: '222',
  githubNodeId: 'node-222',
  githubUsername: 'new-member',
  displayName: 'New Member',
  avatarUrl: 'https://avatars.githubusercontent.com/u/222',
  role: 'member',
  preferredLocale: 'en',
  joinedAt: '2026-09-04T12:00:00.000Z',
  onboardedAt: '2026-09-04T12:00:00.000Z',
};

function formRequest(overrides: Record<string, string> = {}) {
  const body = new URLSearchParams({
    displayName: 'New Member',
    locale: 'en',
    confirmMembership: 'yes',
    csrf: 'valid-csrf-token-with-length',
    ...overrides,
  });
  return new Request('https://techecho.org/api/onboarding', {
    method: 'POST',
    headers: {
      Origin: 'https://techecho.org',
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: '__Host-tec_pending_registration=pending-token',
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  registration.requirePendingRegistrationForm.mockResolvedValue({
    token: 'pending-token',
    registration: {
      viewer: { id: 222 },
      locale: 'en',
    },
  });
  auth.completePendingRegistration.mockResolvedValue({ member });
  auth.createSession.mockResolvedValue({
    token: 'session-token',
    expiresAt: new Date('2026-10-04T12:00:00.000Z'),
  });
  auth.findMemberByGithubUserId.mockResolvedValue(null);
  rateLimit.enforceRateLimit.mockResolvedValue(undefined);
});

describe('membership confirmation route', () => {
  it('does not allocate when explicit consent is missing', async () => {
    const response = await POST(formRequest({ confirmMembership: '' }));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('error=validation');
    expect(registration.requirePendingRegistrationForm).not.toHaveBeenCalled();
    expect(auth.completePendingRegistration).not.toHaveBeenCalled();
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it('does not allocate when origin or CSRF validation fails', async () => {
    registration.requirePendingRegistrationForm.mockRejectedValue(
      new Error('Invalid registration origin.'),
    );

    const response = await POST(formRequest());

    expect(response.headers.get('location')).toContain('error=validation');
    expect(auth.completePendingRegistration).not.toHaveBeenCalled();
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it('creates the permanent member only after a valid confirmation', async () => {
    const response = await POST(formRequest());

    expect(auth.completePendingRegistration).toHaveBeenCalledWith(
      'pending-token',
      'New Member',
      'en',
    );
    expect(auth.createSession).toHaveBeenCalledWith('member-2', 'account');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://techecho.org/home');
  });

  it('recovers safely when membership commits but session creation fails', async () => {
    auth.createSession.mockRejectedValue(new Error('session write failed'));
    auth.findMemberByGithubUserId.mockResolvedValue(member);
    registration.requirePendingRegistrationForm.mockResolvedValue({
      token: 'pending-token',
      registration: {
        viewer: { id: 222 },
        locale: 'en',
        forumReturnPath: '/forum/12',
      },
    });

    const response = await POST(formRequest());
    const location = new URL(response.headers.get('location')!);

    expect(location.pathname).toBe('/');
    expect(location.searchParams.get('mode')).toBe('signin');
    expect(location.searchParams.get('notice')).toBe('membership_created');
    expect(location.searchParams.get('lang')).toBe('en');
    expect(location.searchParams.get('next')).toBe('forum');
    expect(location.searchParams.get('returnTo')).toBe('/forum/12');
    expect(response.headers.get('set-cookie')).toContain(
      '__Host-tec_pending_registration=',
    );
    expect(response.headers.get('set-cookie')).toContain('Secure');
  });

  it('reports rate limiting without consuming the pending confirmation', async () => {
    rateLimit.enforceRateLimit.mockRejectedValue(new rateLimit.RateLimitError('limited'));

    const response = await POST(formRequest());

    expect(response.headers.get('location')).toContain('error=rate_limit');
    expect(auth.completePendingRegistration).not.toHaveBeenCalled();
  });
});
