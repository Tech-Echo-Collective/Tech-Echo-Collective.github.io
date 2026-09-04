import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ensureDatabase, getD1 } from '@/db';
import {
  forumEntryUrl,
  getAuthConfig,
  getFounderGithubUserId,
  getOriginConfig,
  isAuthConfigured,
} from './config';
import { encryptSecret, hmac, randomToken, sha256, timingSafeEqual } from './crypto';
import { consumePendingRegistration } from './registration';
import type { GitHubViewer, Locale, Member, MemberRole } from './types';

export const OAUTH_STATE_COOKIE = 'tec_oauth_state';
const SECURE_OAUTH_STATE_COOKIE = '__Host-tec_oauth_state';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionAudience = 'account' | 'forum';

const SESSION_COOKIES: Record<SessionAudience, { insecure: string; secure: string }> = {
  account: {
    insecure: 'tec_account_session',
    secure: '__Host-tec_account_session',
  },
  forum: {
    insecure: 'tec_forum_session',
    secure: '__Host-tec_forum_session',
  },
};

function usesSecureCookies(): boolean {
  if (!isAuthConfigured()) return false;
  try {
    return getAuthConfig().appOrigin.startsWith('https://');
  } catch {
    return false;
  }
}

export function sessionCookieName(audience: SessionAudience): string {
  const names = SESSION_COOKIES[audience];
  return usesSecureCookies() ? names.secure : names.insecure;
}

export function oauthStateCookieName(): string {
  return usesSecureCookies() ? SECURE_OAUTH_STATE_COOKIE : OAUTH_STATE_COOKIE;
}

interface MemberRow {
  id: string;
  member_number: number;
  github_user_id: string;
  github_node_id: string;
  github_username: string;
  display_name: string;
  avatar_url: string;
  role: MemberRole;
  preferred_locale: Locale;
  joined_at: string;
  onboarded_at: string | null;
}

function mapMember(row: MemberRow): Member {
  return {
    id: row.id,
    memberNumber: row.member_number,
    githubUserId: row.github_user_id,
    githubNodeId: row.github_node_id,
    githubUsername: row.github_username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    preferredLocale: row.preferred_locale,
    joinedAt: row.joined_at,
    onboardedAt: row.onboarded_at,
  };
}

const memberColumns = `m.id, m.member_number, m.github_user_id, m.github_node_id,
  m.github_username, m.display_name, m.avatar_url, m.role, m.preferred_locale,
  m.joined_at, m.onboarded_at`;

export async function findMemberByGithubUserId(
  githubUserId: string,
): Promise<Member | null> {
  await ensureDatabase();
  const row = await getD1()
    .prepare(`SELECT ${memberColumns} FROM members m WHERE m.github_user_id = ?`)
    .bind(githubUserId)
    .first<MemberRow>();
  return row ? mapMember(row) : null;
}

export async function findMembersByGithubNodeIds(
  githubNodeIds: string[],
): Promise<Map<string, Member>> {
  await ensureDatabase();
  const uniqueIds = [...new Set(githubNodeIds.filter(Boolean))].slice(0, 100);
  if (uniqueIds.length === 0) return new Map();
  const placeholders = uniqueIds.map(() => '?').join(',');
  const rows = await getD1()
    .prepare(
      `SELECT ${memberColumns} FROM members m
       WHERE m.github_node_id IN (${placeholders}) AND m.onboarded_at IS NOT NULL`,
    )
    .bind(...uniqueIds)
    .all<MemberRow>();
  return new Map((rows.results || []).map((row) => [row.github_node_id, mapMember(row)]));
}

export async function findMembersByGithubUserIds(
  githubUserIds: string[],
): Promise<Map<string, Member>> {
  await ensureDatabase();
  const uniqueIds = [...new Set(githubUserIds.filter(Boolean))];
  const memberMap = new Map<string, Member>();
  for (let index = 0; index < uniqueIds.length; index += 80) {
    const chunk = uniqueIds.slice(index, index + 80);
    const placeholders = chunk.map(() => '?').join(',');
    const rows = await getD1()
      .prepare(
        `SELECT ${memberColumns} FROM members m
         WHERE m.github_user_id IN (${placeholders}) AND m.onboarded_at IS NOT NULL`,
      )
      .bind(...chunk)
      .all<MemberRow>();
    for (const row of rows.results || []) {
      memberMap.set(row.github_user_id, mapMember(row));
    }
  }
  return memberMap;
}

export async function listMembers(): Promise<Member[]> {
  await ensureDatabase();
  const rows = await getD1()
    .prepare(
      `SELECT ${memberColumns} FROM members m
       WHERE m.onboarded_at IS NOT NULL ORDER BY m.member_number ASC`,
    )
    .all<MemberRow>();
  return (rows.results || []).map(mapMember);
}

export async function findMemberByNumber(memberNumber: number): Promise<Member | null> {
  await ensureDatabase();
  const row = await getD1()
    .prepare(
      `SELECT ${memberColumns} FROM members m
       WHERE m.member_number = ? AND m.onboarded_at IS NOT NULL`,
    )
    .bind(memberNumber)
    .first<MemberRow>();
  return row ? mapMember(row) : null;
}

export async function updateExistingMemberFromGitHub(
  viewer: GitHubViewer,
): Promise<Member> {
  const githubUserId = String(viewer.id);
  const existing = await findMemberByGithubUserId(githubUserId);
  if (!existing) throw new Error('Tech Echo member does not exist.');
  await getD1()
    .prepare(
      `UPDATE members SET github_node_id = ?, github_username = ?, avatar_url = ?,
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .bind(viewer.node_id, viewer.login, viewer.avatar_url, existing.id)
    .run();
  return (await findMemberByGithubUserId(githubUserId))!;
}

export interface GitHubTokenRecord {
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  expiresIn?: number | null;
  refreshTokenExpiresIn?: number | null;
  expiresAt?: string | null;
  refreshTokenExpiresAt?: string | null;
}

async function encryptedGitHubCredential(token: GitHubTokenRecord) {
  const config = getAuthConfig();
  return {
    accessEncrypted: await encryptSecret(token.accessToken, config.tokenEncryptionKey),
    refreshEncrypted: token.refreshToken
      ? await encryptSecret(token.refreshToken, config.tokenEncryptionKey)
      : null,
    tokenType: token.tokenType || 'bearer',
    expiresAt: token.expiresAt ?? expiryFromNow(token.expiresIn),
    refreshTokenExpiresAt:
      token.refreshTokenExpiresAt ?? expiryFromNow(token.refreshTokenExpiresIn),
  };
}

function expiryFromNow(seconds: number | null | undefined): string | null {
  return seconds ? new Date(Date.now() + seconds * 1000).toISOString() : null;
}

export async function saveGitHubCredential(
  memberId: string,
  token: GitHubTokenRecord,
): Promise<void> {
  await ensureDatabase();
  const credential = await encryptedGitHubCredential(token);

  await getD1()
    .prepare(
      `INSERT INTO github_credentials
       (member_id, access_token_encrypted, refresh_token_encrypted, token_type,
        expires_at, refresh_token_expires_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(member_id) DO UPDATE SET
         access_token_encrypted = excluded.access_token_encrypted,
         refresh_token_encrypted = excluded.refresh_token_encrypted,
         token_type = excluded.token_type,
         expires_at = excluded.expires_at,
         refresh_token_expires_at = excluded.refresh_token_expires_at,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      memberId,
      credential.accessEncrypted,
      credential.refreshEncrypted,
      credential.tokenType,
      credential.expiresAt,
      credential.refreshTokenExpiresAt,
    )
    .run();
}

export async function completePendingRegistration(
  rawToken: string,
  displayName: string,
  locale: Locale,
): Promise<{ member: Member; forumReturnPath?: string }> {
  const registration = await consumePendingRegistration(rawToken);
  const githubUserId = String(registration.viewer.id);
  const existing = await findMemberByGithubUserId(githubUserId);
  const credential = await encryptedGitHubCredential({
    accessToken: registration.token.accessToken,
    refreshToken: registration.token.refreshToken,
    tokenType: registration.token.tokenType,
    expiresAt: registration.token.accessExpiresAt,
    refreshTokenExpiresAt: registration.token.refreshTokenExpiresAt,
  });
  const d1 = getD1();

  if (existing) {
    await d1.batch([
      d1
        .prepare(
          `UPDATE members SET github_node_id = ?, github_username = ?, display_name = ?,
           avatar_url = ?, preferred_locale = ?,
           onboarded_at = COALESCE(onboarded_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        )
        .bind(
          registration.viewer.node_id,
          registration.viewer.login,
          existing.onboardedAt ? existing.displayName : displayName,
          registration.viewer.avatar_url,
          existing.onboardedAt ? existing.preferredLocale : locale,
          existing.id,
        ),
      credentialUpsertStatement(d1, existing.id, credential),
    ]);
    const member = await findMemberByGithubUserId(githubUserId);
    if (!member?.onboardedAt)
      throw new Error('Member registration could not be completed.');
    return { member, forumReturnPath: registration.forumReturnPath };
  }

  const memberId = crypto.randomUUID();
  const founder = githubUserId === getFounderGithubUserId();
  const role: MemberRole = founder ? 'founder' : 'member';
  const allocate = founder
    ? d1
        .prepare(
          `UPDATE member_number_allocations SET member_id = ?
           WHERE member_number = 1 AND member_id IS NULL AND reserved_github_user_id = ?`,
        )
        .bind(memberId, githubUserId)
    : d1
        .prepare('INSERT INTO member_number_allocations (member_id) VALUES (?)')
        .bind(memberId);
  const createMember = d1
    .prepare(
      `INSERT INTO members
       (id, member_number, github_user_id, github_node_id, github_username,
        display_name, avatar_url, role, preferred_locale, onboarded_at)
       SELECT ?, member_number, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
       FROM member_number_allocations WHERE member_id = ?`,
    )
    .bind(
      memberId,
      githubUserId,
      registration.viewer.node_id,
      registration.viewer.login,
      displayName,
      registration.viewer.avatar_url,
      role,
      locale,
      memberId,
    );

  try {
    await d1.batch([
      allocate,
      createMember,
      credentialUpsertStatement(d1, memberId, credential),
    ]);
  } catch (error) {
    const racedMember = await findMemberByGithubUserId(githubUserId);
    if (racedMember?.onboardedAt) {
      return { member: racedMember, forumReturnPath: registration.forumReturnPath };
    }
    throw error;
  }

  const member = await findMemberByGithubUserId(githubUserId);
  if (!member?.onboardedAt) {
    throw new Error(
      founder
        ? 'Founder Member #001 reservation does not match this GitHub account.'
        : 'Member profile could not be created.',
    );
  }
  return { member, forumReturnPath: registration.forumReturnPath };
}

function credentialUpsertStatement(
  d1: D1Database,
  memberId: string,
  credential: Awaited<ReturnType<typeof encryptedGitHubCredential>>,
) {
  return d1
    .prepare(
      `INSERT INTO github_credentials
       (member_id, access_token_encrypted, refresh_token_encrypted, token_type,
        expires_at, refresh_token_expires_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(member_id) DO UPDATE SET
         access_token_encrypted = excluded.access_token_encrypted,
         refresh_token_encrypted = excluded.refresh_token_encrypted,
         token_type = excluded.token_type,
         expires_at = excluded.expires_at,
         refresh_token_expires_at = excluded.refresh_token_expires_at,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      memberId,
      credential.accessEncrypted,
      credential.refreshEncrypted,
      credential.tokenType,
      credential.expiresAt,
      credential.refreshTokenExpiresAt,
    );
}

export interface AuthenticatedSession {
  member: Member;
  token: string;
  tokenHash: string;
  familyId: string;
  audience: SessionAudience;
}

export async function createSession(
  memberId: string,
  audience: SessionAudience,
  familyId = randomToken(24),
): Promise<{
  token: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}> {
  await ensureDatabase();
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const d1 = getD1();
  await d1.batch([
    d1.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(new Date().toISOString()),
    d1
      .prepare(
        `DELETE FROM sessions WHERE token_hash IN (
          SELECT token_hash FROM session_contexts WHERE family_id = ? AND audience = ?
        )`,
      )
      .bind(familyId, audience),
    d1
      .prepare('INSERT INTO sessions (token_hash, member_id, expires_at) VALUES (?, ?, ?)')
      .bind(tokenHash, memberId, expiresAt.toISOString()),
    d1
      .prepare(
        `INSERT INTO session_contexts (token_hash, audience, family_id)
         VALUES (?, ?, ?)`,
      )
      .bind(tokenHash, audience, familyId),
  ]);
  return { token, tokenHash, familyId, expiresAt };
}

export function sessionCookieOptions(audience: SessionAudience, expiresAt: Date) {
  const origins = getOriginConfig();
  const secure = (
    audience === 'account' ? origins.accountOrigin : origins.forumOrigin
  ).startsWith('https://');
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  };
}

export async function deleteSession(token: string): Promise<void> {
  await ensureDatabase();
  await getD1()
    .prepare('DELETE FROM sessions WHERE token_hash = ?')
    .bind(await sha256(token))
    .run();
}

export async function deleteSessionFamily(familyId: string): Promise<void> {
  await ensureDatabase();
  const d1 = getD1();
  await d1.batch([
    d1.prepare('DELETE FROM sso_handoffs WHERE family_id = ?').bind(familyId),
    d1
      .prepare(
        `DELETE FROM sessions WHERE token_hash IN (
          SELECT token_hash FROM session_contexts WHERE family_id = ?
        )`,
      )
      .bind(familyId),
  ]);
}

interface AuthenticatedSessionRow extends MemberRow {
  token_hash: string;
  family_id: string;
  audience: SessionAudience;
}

export async function sessionFromSessionToken(
  token: string | undefined,
  audience: SessionAudience,
): Promise<AuthenticatedSession | null> {
  if (!token) return null;
  await ensureDatabase();
  const row = await getD1()
    .prepare(
      `SELECT ${memberColumns}, s.token_hash, sc.family_id, sc.audience
       FROM sessions s
       JOIN session_contexts sc ON sc.token_hash = s.token_hash
       JOIN members m ON m.id = s.member_id
       WHERE s.token_hash = ? AND sc.audience = ? AND s.expires_at > ?
         AND m.onboarded_at IS NOT NULL`,
    )
    .bind(await sha256(token), audience, new Date().toISOString())
    .first<AuthenticatedSessionRow>();
  return row
    ? {
        member: mapMember(row),
        token,
        tokenHash: row.token_hash,
        familyId: row.family_id,
        audience: row.audience,
      }
    : null;
}

export async function memberFromSessionToken(
  token: string | undefined,
  audience: SessionAudience,
): Promise<Member | null> {
  return (await sessionFromSessionToken(token, audience))?.member || null;
}

export async function getRequestAudience(): Promise<SessionAudience> {
  const requestHeaders = await headers();
  const host = (requestHeaders.get('host') || '').toLowerCase();
  const { forumOrigin } = getOriginConfig();
  return host === new URL(forumOrigin).host.toLowerCase() ? 'forum' : 'account';
}

export async function getCurrentSession(
  audience?: SessionAudience,
): Promise<AuthenticatedSession | null> {
  const resolvedAudience = audience || (await getRequestAudience());
  const cookieStore = await cookies();
  return sessionFromSessionToken(
    cookieStore.get(sessionCookieName(resolvedAudience))?.value,
    resolvedAudience,
  );
}

export async function getCurrentMember(audience?: SessionAudience): Promise<Member | null> {
  return (await getCurrentSession(audience))?.member || null;
}

export async function requireMember(
  options: {
    onboardingAllowed?: boolean;
    audience?: SessionAudience;
    returnTo?: string;
  } = {},
) {
  const audience = options.audience || (await getRequestAudience());
  const member = await getCurrentMember(audience);
  if (!member) {
    if (audience === 'forum') redirect(forumEntryUrl(options.returnTo || '/'));
    redirect('/?error=session_required');
  }
  if (!options.onboardingAllowed && !member.onboardedAt) redirect('/onboarding');
  return member;
}

export async function csrfForSessionToken(token: string): Promise<string> {
  return hmac(`csrf:${token}`, getAuthConfig().sessionSecret);
}

export async function getCsrfToken(audience?: SessionAudience): Promise<string> {
  const resolvedAudience = audience || (await getRequestAudience());
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName(resolvedAudience))?.value;
  if (!token) throw new Error('Missing session cookie.');
  return csrfForSessionToken(token);
}

export async function requireFormSession(
  request: Request,
  formData: FormData,
  expectedAudience?: SessionAudience,
): Promise<AuthenticatedSession> {
  const config = getAuthConfig();
  const requestOrigin = new URL(request.url).origin;
  const audience: SessionAudience =
    requestOrigin === config.accountOrigin
      ? 'account'
      : requestOrigin === config.forumOrigin
        ? 'forum'
        : (() => {
            throw new Error('Invalid request host.');
          })();
  if (expectedAudience && audience !== expectedAudience) {
    throw new Error('Invalid session audience.');
  }
  const origin = request.headers.get('Origin');
  if (!origin || origin !== requestOrigin) {
    throw new Error('Invalid request origin.');
  }

  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionCookie = sessionCookieName(audience);
  const rawSession = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`))
    ?.slice(sessionCookie.length + 1);
  const sessionToken = rawSession ? decodeURIComponent(rawSession) : undefined;
  const session = await sessionFromSessionToken(sessionToken, audience);
  if (!session || !sessionToken) throw new Error('Authentication required.');

  const provided = String(formData.get('csrf') || '');
  const expected = await csrfForSessionToken(sessionToken);
  if (!timingSafeEqual(provided, expected)) throw new Error('Invalid CSRF token.');
  return session;
}

export async function requireFormMember(
  request: Request,
  formData: FormData,
  expectedAudience?: SessionAudience,
): Promise<Member> {
  return (await requireFormSession(request, formData, expectedAudience)).member;
}

export async function updateSettings(
  memberId: string,
  displayName: string,
  locale: Locale,
): Promise<void> {
  await ensureDatabase();
  await getD1()
    .prepare(
      `UPDATE members SET display_name = ?, preferred_locale = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(displayName, locale, memberId)
    .run();
}
