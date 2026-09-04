import { cookies } from 'next/headers';
import { z } from 'zod';
import { ensureDatabase, getD1 } from '@/db';
import { getAuthConfig, getOriginConfig } from './config';
import {
  decryptSecret,
  encryptSecret,
  hmac,
  randomToken,
  sha256,
  timingSafeEqual,
} from './crypto';
import type { GitHubViewer, Locale } from './types';
import { safeForumReturnPath } from './validation';

const PENDING_REGISTRATION_COOKIE = 'tec_pending_registration';
const SECURE_PENDING_REGISTRATION_COOKIE = '__Host-tec_pending_registration';
const PENDING_REGISTRATION_MAX_AGE_SECONDS = 30 * 60;

const pendingRegistrationPayloadSchema = z.object({
  viewer: z.object({
    id: z.number().int().positive(),
    node_id: z.string().min(4).max(128),
    login: z.string().min(1).max(39),
    name: z.string().max(255).nullable(),
    avatar_url: z.string().url(),
  }),
  token: z.object({
    accessToken: z.string().min(1).max(1024),
    refreshToken: z.string().min(1).max(1024).nullable().optional(),
    tokenType: z.string().min(1).max(64).optional(),
    accessExpiresAt: z.string().datetime().nullable().optional(),
    refreshTokenExpiresAt: z.string().datetime().nullable().optional(),
  }),
  locale: z.enum(['en', 'zh', 'fr', 'es']),
  forumReturnPath: z.string().max(300).optional(),
});

export type PendingRegistration = z.infer<typeof pendingRegistrationPayloadSchema>;

export interface PendingGitHubTokenInput {
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  expiresIn?: number | null;
  refreshTokenExpiresIn?: number | null;
}

interface PendingRegistrationRow {
  github_user_id: string;
  payload_encrypted: string;
  expires_at: string;
}

function usesSecureCookie(): boolean {
  return getOriginConfig().accountOrigin.startsWith('https://');
}

export function pendingRegistrationCookieName(): string {
  return usesSecureCookie()
    ? SECURE_PENDING_REGISTRATION_COOKIE
    : PENDING_REGISTRATION_COOKIE;
}

export function pendingRegistrationCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: usesSecureCookie(),
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  };
}

function expiryAt(issuedAt: number, seconds: number | null | undefined) {
  return seconds ? new Date(issuedAt + seconds * 1000).toISOString() : null;
}

export function preparePendingGitHubToken(
  token: PendingGitHubTokenInput,
  issuedAt = Date.now(),
): PendingRegistration['token'] {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    tokenType: token.tokenType,
    accessExpiresAt: expiryAt(issuedAt, token.expiresIn),
    refreshTokenExpiresAt: expiryAt(issuedAt, token.refreshTokenExpiresIn),
  };
}

function normalizePayload(payload: PendingRegistration): PendingRegistration {
  const parsed = pendingRegistrationPayloadSchema.parse(payload);
  return {
    ...parsed,
    forumReturnPath: parsed.forumReturnPath
      ? safeForumReturnPath(parsed.forumReturnPath)
      : undefined,
  };
}

async function decodeRow(row: PendingRegistrationRow): Promise<PendingRegistration> {
  const decrypted = await decryptSecret(
    row.payload_encrypted,
    getAuthConfig().tokenEncryptionKey,
  );
  const payload = normalizePayload(JSON.parse(decrypted) as PendingRegistration);
  if (String(payload.viewer.id) !== row.github_user_id) {
    throw new Error('Pending registration identity does not match its envelope.');
  }
  return payload;
}

export async function createPendingRegistration(
  viewer: GitHubViewer,
  token: PendingGitHubTokenInput,
  locale: Locale,
  forumReturnPath?: string,
): Promise<{ token: string; expiresAt: Date }> {
  await ensureDatabase();
  const rawToken = randomToken(32);
  const tokenHash = await sha256(rawToken);
  const expiresAt = new Date(Date.now() + PENDING_REGISTRATION_MAX_AGE_SECONDS * 1000);
  const payload = normalizePayload({
    viewer,
    token: preparePendingGitHubToken(token),
    locale,
    forumReturnPath,
  });
  const payloadEncrypted = await encryptSecret(
    JSON.stringify(payload),
    getAuthConfig().tokenEncryptionKey,
  );
  const now = new Date().toISOString();

  await getD1().batch([
    getD1().prepare('DELETE FROM pending_registrations WHERE expires_at <= ?').bind(now),
    getD1()
      .prepare(
        `INSERT INTO pending_registrations
         (token_hash, github_user_id, payload_encrypted, expires_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(github_user_id) DO UPDATE SET
           token_hash = excluded.token_hash,
           payload_encrypted = excluded.payload_encrypted,
           expires_at = excluded.expires_at,
           created_at = CURRENT_TIMESTAMP`,
      )
      .bind(tokenHash, String(viewer.id), payloadEncrypted, expiresAt.toISOString()),
  ]);

  return { token: rawToken, expiresAt };
}

export async function readPendingRegistration(
  rawToken: string | undefined,
): Promise<PendingRegistration | null> {
  if (!rawToken) return null;
  await ensureDatabase();
  const d1 = getD1();
  const tokenHash = await sha256(rawToken);
  const now = new Date().toISOString();
  await d1
    .prepare('DELETE FROM pending_registrations WHERE token_hash = ? AND expires_at <= ?')
    .bind(tokenHash, now)
    .run();
  const row = await d1
    .prepare(
      `SELECT github_user_id, payload_encrypted, expires_at FROM pending_registrations
       WHERE token_hash = ? AND expires_at > ?`,
    )
    .bind(tokenHash, now)
    .first<PendingRegistrationRow>();
  if (!row) return null;
  try {
    return await decodeRow(row);
  } catch {
    await d1
      .prepare('DELETE FROM pending_registrations WHERE token_hash = ?')
      .bind(tokenHash)
      .run();
    return null;
  }
}

export async function discardPendingRegistration(
  rawToken: string | undefined,
): Promise<void> {
  if (!rawToken) return;
  await ensureDatabase();
  await getD1()
    .prepare('DELETE FROM pending_registrations WHERE token_hash = ?')
    .bind(await sha256(rawToken))
    .run();
}

export async function consumePendingRegistration(
  rawToken: string,
): Promise<PendingRegistration> {
  await ensureDatabase();
  const now = Date.now();
  const row = await getD1()
    .prepare(
      `DELETE FROM pending_registrations
       WHERE token_hash = ?
       RETURNING github_user_id, payload_encrypted, expires_at`,
    )
    .bind(await sha256(rawToken))
    .first<PendingRegistrationRow>();
  if (!row) throw new Error('Pending registration is missing, expired, or already used.');
  if (Date.parse(row.expires_at) <= now) {
    throw new Error('Pending registration is missing, expired, or already used.');
  }
  return decodeRow(row);
}

export async function getCurrentPendingRegistration(): Promise<{
  token: string;
  registration: PendingRegistration;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(pendingRegistrationCookieName())?.value;
  const registration = await readPendingRegistration(token);
  return token && registration ? { token, registration } : null;
}

export async function pendingRegistrationCsrf(rawToken: string): Promise<string> {
  return hmac(`pending-registration:${rawToken}`, getAuthConfig().sessionSecret);
}

export async function requirePendingRegistrationForm(
  request: Request,
  formData: FormData,
): Promise<{ token: string; registration: PendingRegistration }> {
  const config = getAuthConfig();
  const requestOrigin = new URL(request.url).origin;
  if (
    requestOrigin !== config.accountOrigin ||
    request.headers.get('Origin') !== config.accountOrigin
  ) {
    throw new Error('Invalid registration origin.');
  }

  const cookieHeader = request.headers.get('Cookie') || '';
  const cookieName = pendingRegistrationCookieName();
  const rawCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  const token = rawCookie ? decodeURIComponent(rawCookie) : undefined;
  if (!token) throw new Error('Pending registration cookie is missing.');

  const providedCsrf = String(formData.get('csrf') || '');
  const expectedCsrf = await pendingRegistrationCsrf(token);
  if (!timingSafeEqual(providedCsrf, expectedCsrf)) {
    throw new Error('Invalid registration CSRF token.');
  }
  const registration = await readPendingRegistration(token);
  if (!registration) throw new Error('Pending registration has expired.');
  return { token, registration };
}
