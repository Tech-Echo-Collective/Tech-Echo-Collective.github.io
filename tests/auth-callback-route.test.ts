import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  findMemberByGithubUserId: vi.fn(),
  saveGitHubCredential: vi.fn(),
  updateExistingMemberFromGitHub: vi.fn(),
}));
const github = vi.hoisted(() => ({
  exchangeOAuthCode: vi.fn(),
  fetchGitHubViewer: vi.fn(),
}));
const oauth = vi.hoisted(() => ({ consumeOAuthTransaction: vi.fn() }));
const registration = vi.hoisted(() => ({
  createPendingRegistration: vi.fn(),
  discardPendingRegistration: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  ...auth,
  oauthStateCookieName: () => '__Host-tec_oauth_state',
  sessionCookieName: () => '__Host-tec_account_session',
  sessionCookieOptions: () => ({ httpOnly: true, secure: true, path: '/' }),
}));
vi.mock('@/lib/config', () => ({
  getAuthConfig: () => ({
    accountOrigin: 'https://techecho.org',
    appOrigin: 'https://techecho.org',
  }),
}));
vi.mock('@/lib/crypto', () => ({ timingSafeEqual: () => true }));
vi.mock('@/lib/github', () => ({
  ...github,
  GitHubApiError: class GitHubApiError extends Error {
    constructor(
      message: string,
      public readonly code = 'github_error',
    ) {
      super(message);
    }
  },
}));
vi.mock('@/lib/oauth', () => oauth);
vi.mock('@/lib/registration', () => ({
  ...registration,
  pendingRegistrationCookieName: () => '__Host-tec_pending_registration',
  pendingRegistrationCookieOptions: (expires: Date) => ({
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires,
  }),
}));

import { GET } from '../app/auth/callback/route';

const viewer = {
  id: 222,
  node_id: 'MDQ6VXNlcjIyMg==',
  login: 'new-member',
  name: 'New Member',
  avatar_url: 'https://avatars.githubusercontent.com/u/222',
};

const existingMember = {
  id: 'member-2',
  memberNumber: 2,
  githubUserId: '222',
  githubNodeId: viewer.node_id,
  githubUsername: viewer.login,
  displayName: 'New Member',
  avatarUrl: viewer.avatar_url,
  role: 'member',
  preferredLocale: 'zh',
  joinedAt: '2026-09-01T00:00:00.000Z',
  onboardedAt: '2026-09-01T00:00:00.000Z',
};

function request(query: string) {
  return new NextRequest(`https://techecho.org/auth/callback?${query}`, {
    headers: {
      Cookie:
        '__Host-tec_oauth_state=state-value; __Host-tec_pending_registration=older-identity',
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  oauth.consumeOAuthTransaction.mockResolvedValue({
    verifier: 'verifier',
    intent: 'signin',
    locale: 'zh',
    forumReturnPath: '/forum/12',
  });
  github.exchangeOAuthCode.mockResolvedValue({
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    expires_in: 28_800,
    refresh_token_expires_in: 15_552_000,
  });
  github.fetchGitHubViewer.mockResolvedValue(viewer);
  auth.findMemberByGithubUserId.mockResolvedValue(null);
  registration.createPendingRegistration.mockResolvedValue({
    token: 'pending-token',
    expiresAt: new Date('2026-09-04T12:30:00.000Z'),
  });
  registration.discardPendingRegistration.mockResolvedValue(undefined);
  auth.updateExistingMemberFromGitHub.mockResolvedValue(existingMember);
  auth.saveGitHubCredential.mockResolvedValue(undefined);
  auth.createSession.mockResolvedValue({
    token: 'session-token',
    expiresAt: new Date('2026-10-04T12:00:00.000Z'),
  });
});

describe('GitHub OAuth callback membership effects', () => {
  it('does not create any membership state for an unknown Sign In', async () => {
    const response = await GET(request('code=oauth-code&state=state-value'));
    const location = new URL(response.headers.get('location')!);

    expect(response.status).toBe(302);
    expect(location.searchParams.get('notice')).toBe('account_not_found');
    expect(location.searchParams.get('mode')).toBe('join');
    expect(location.searchParams.get('lang')).toBe('zh');
    expect(location.searchParams.get('returnTo')).toBe('/forum/12');
    expect(registration.discardPendingRegistration).toHaveBeenCalledWith('older-identity');
    expect(registration.createPendingRegistration).not.toHaveBeenCalled();
    expect(auth.updateExistingMemberFromGitHub).not.toHaveBeenCalled();
    expect(auth.saveGitHubCredential).not.toHaveBeenCalled();
    expect(auth.createSession).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toContain(
      '__Host-tec_pending_registration=',
    );
    expect(response.headers.get('set-cookie')).toContain('Secure');
  });

  it('stores only a pending confirmation for an explicit Join', async () => {
    oauth.consumeOAuthTransaction.mockResolvedValue({
      verifier: 'verifier',
      intent: 'join',
      locale: 'fr',
      forumReturnPath: '/forum/new',
    });

    const response = await GET(request('code=oauth-code&state=state-value'));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://techecho.org/onboarding');
    expect(registration.createPendingRegistration).toHaveBeenCalledWith(
      viewer,
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
      'fr',
      '/forum/new',
    );
    expect(auth.updateExistingMemberFromGitHub).not.toHaveBeenCalled();
    expect(auth.saveGitHubCredential).not.toHaveBeenCalled();
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it('preserves locale, intent, and forum continuation when GitHub is denied', async () => {
    oauth.consumeOAuthTransaction.mockResolvedValue({
      verifier: 'verifier',
      intent: 'signin',
      locale: 'es',
      forumReturnPath: '/forum/9',
    });

    const response = await GET(request('error=access_denied&state=state-value'));
    const location = new URL(response.headers.get('location')!);

    expect(location.searchParams.get('error')).toBe('oauth_denied');
    expect(location.searchParams.get('mode')).toBe('signin');
    expect(location.searchParams.get('lang')).toBe('es');
    expect(location.searchParams.get('returnTo')).toBe('/forum/9');
    expect(github.exchangeOAuthCode).not.toHaveBeenCalled();
    expect(registration.discardPendingRegistration).not.toHaveBeenCalled();
  });

  it('signs in an existing member without creating pending registration', async () => {
    auth.findMemberByGithubUserId.mockResolvedValue(existingMember);

    const response = await GET(request('code=oauth-code&state=state-value'));

    expect(response.headers.get('location')).toBe(
      'https://techecho.org/auth/forum?returnTo=%2Fforum%2F12',
    );
    expect(auth.updateExistingMemberFromGitHub).toHaveBeenCalledWith(viewer);
    expect(auth.saveGitHubCredential).toHaveBeenCalledWith(
      'member-2',
      expect.objectContaining({ accessToken: 'access-token' }),
    );
    expect(auth.createSession).toHaveBeenCalledWith('member-2', 'account');
    expect(registration.createPendingRegistration).not.toHaveBeenCalled();
  });

  it('does not sign in or store credentials for an incomplete legacy member', async () => {
    auth.findMemberByGithubUserId.mockResolvedValue({
      ...existingMember,
      onboardedAt: null,
    });

    const response = await GET(request('code=oauth-code&state=state-value'));
    const location = new URL(response.headers.get('location')!);

    expect(location.searchParams.get('error')).toBe('registration_incomplete');
    expect(location.searchParams.get('mode')).toBe('join');
    expect(auth.updateExistingMemberFromGitHub).not.toHaveBeenCalled();
    expect(auth.saveGitHubCredential).not.toHaveBeenCalled();
    expect(auth.createSession).not.toHaveBeenCalled();
    expect(registration.createPendingRegistration).not.toHaveBeenCalled();
  });
});
