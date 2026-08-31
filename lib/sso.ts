import { ensureDatabase, getD1 } from '@/db';
import { createSession, type AuthenticatedSession } from './auth';
import { randomToken, sha256 } from './crypto';
import type { Locale } from './types';
import { safeForumReturnPath } from './validation';

const HANDOFF_TTL_MS = 90 * 1000;

interface HandoffRow {
  member_id: string;
  family_id: string;
  source_session_hash: string;
  target_audience: 'forum';
  return_path: string;
}

export class SsoHandoffError extends Error {
  constructor(message = 'The forum sign-in handoff is invalid or expired.') {
    super(message);
  }
}

export async function createForumHandoff(
  source: AuthenticatedSession,
  requestedReturnPath: string | null,
): Promise<{ token: string; returnPath: string }> {
  if (source.audience !== 'account') throw new SsoHandoffError();
  await ensureDatabase();

  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const returnPath = safeForumReturnPath(requestedReturnPath);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + HANDOFF_TTL_MS).toISOString();
  const d1 = getD1();

  await d1.batch([
    d1.prepare('DELETE FROM sso_handoffs WHERE expires_at <= ?').bind(now.toISOString()),
    d1.prepare('DELETE FROM sso_handoffs WHERE family_id = ?').bind(source.familyId),
    d1
      .prepare(
        `INSERT INTO sso_handoffs
         (token_hash, member_id, family_id, source_session_hash, target_audience,
          return_path, expires_at)
         VALUES (?, ?, ?, ?, 'forum', ?, ?)`,
      )
      .bind(
        tokenHash,
        source.member.id,
        source.familyId,
        source.tokenHash,
        returnPath,
        expiresAt,
      ),
  ]);

  return { token, returnPath };
}

export async function consumeForumHandoff(token: string): Promise<{
  session: Awaited<ReturnType<typeof createSession>>;
  returnPath: string;
  locale: Locale;
}> {
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(token)) throw new SsoHandoffError();
  await ensureDatabase();

  const now = new Date().toISOString();
  const row = await getD1()
    .prepare(
      `DELETE FROM sso_handoffs
       WHERE token_hash = ? AND target_audience = 'forum' AND expires_at > ?
       RETURNING member_id, family_id, source_session_hash, target_audience, return_path`,
    )
    .bind(await sha256(token), now)
    .first<HandoffRow>();
  if (!row) throw new SsoHandoffError();

  const source = await getD1()
    .prepare(
      `SELECT s.member_id, m.preferred_locale FROM sessions s
       JOIN session_contexts sc ON sc.token_hash = s.token_hash
       JOIN members m ON m.id = s.member_id
       WHERE s.token_hash = ? AND s.member_id = ? AND sc.family_id = ?
         AND sc.audience = 'account' AND s.expires_at > ?`,
    )
    .bind(row.source_session_hash, row.member_id, row.family_id, now)
    .first<{ member_id: string; preferred_locale: Locale }>();
  if (!source) throw new SsoHandoffError();

  return {
    session: await createSession(row.member_id, 'forum', row.family_id),
    returnPath: safeForumReturnPath(row.return_path),
    locale: source.preferred_locale,
  };
}
