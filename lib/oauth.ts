import { ensureDatabase, getD1 } from '@/db';
import { getAuthConfig } from './config';
import { decryptSecret, encryptSecret, pkceChallenge, randomToken, sha256 } from './crypto';
import type { Locale } from './types';

export async function createOAuthTransaction(
  intent: 'signin' | 'join',
  locale: Locale,
): Promise<{ state: string; authorizeUrl: string }> {
  await ensureDatabase();
  const config = getAuthConfig();
  const state = randomToken(32);
  const verifier = randomToken(64);
  const stateHash = await sha256(state);
  const challenge = await pkceChallenge(verifier);
  const verifierEncrypted = await encryptSecret(verifier, config.tokenEncryptionKey);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await getD1().batch([
    getD1()
      .prepare('DELETE FROM oauth_states WHERE expires_at <= ?')
      .bind(new Date().toISOString()),
    getD1()
      .prepare(
        `INSERT INTO oauth_states
         (state_hash, verifier_encrypted, intent, locale, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(stateHash, verifierEncrypted, intent, locale, expiresAt),
  ]);

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', `${config.appOrigin}/auth/callback`);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('repository_id', config.repositoryId);

  return { state, authorizeUrl: url.toString() };
}

export async function consumeOAuthTransaction(state: string): Promise<{
  verifier: string;
  intent: 'signin' | 'join';
  locale: Locale;
}> {
  await ensureDatabase();
  const stateHash = await sha256(state);
  const row = await getD1()
    .prepare(
      `DELETE FROM oauth_states WHERE state_hash = ? AND expires_at > ?
       RETURNING verifier_encrypted, intent, locale`,
    )
    .bind(stateHash, new Date().toISOString())
    .first<{
      verifier_encrypted: string;
      intent: 'signin' | 'join';
      locale: Locale;
    }>();
  if (!row) throw new Error('OAuth transaction is missing, expired, or already used.');

  return {
    verifier: await decryptSecret(
      row.verifier_encrypted,
      getAuthConfig().tokenEncryptionKey,
    ),
    intent: row.intent,
    locale: row.locale,
  };
}
