import { describe, expect, it } from 'vitest';
import {
  decryptSecret,
  encryptSecret,
  hmac,
  pkceChallenge,
  randomToken,
  sha256,
  timingSafeEqual,
} from '../lib/crypto';

describe('security primitives', () => {
  it('creates URL-safe state and PKCE material', async () => {
    const token = randomToken(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await pkceChallenge(token)).toBe(await sha256(token));
  });

  it('round-trips AES-GCM credentials and rejects the wrong key', async () => {
    const key = btoa('0123456789abcdef0123456789abcdef');
    const otherKey = btoa('abcdef0123456789abcdef0123456789');
    const encrypted = await encryptSecret('github-token-value', key);
    expect(encrypted).not.toContain('github-token-value');
    expect(await decryptSecret(encrypted, key)).toBe('github-token-value');
    await expect(decryptSecret(encrypted, otherKey)).rejects.toThrow();
  });

  it('supports constant-time comparison for CSRF tokens', async () => {
    const token = await hmac('session', 'a-long-random-session-secret');
    expect(timingSafeEqual(token, token)).toBe(true);
    expect(timingSafeEqual(token, `${token}x`)).toBe(false);
  });
});
