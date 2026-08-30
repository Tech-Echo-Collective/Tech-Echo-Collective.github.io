import { ensureDatabase, getD1 } from '@/db';
import { getAuthConfig } from './config';
import { hmac } from './crypto';

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super('Rate limit exceeded.');
  }
}

export async function anonymizedIp(request: Request): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const secret = getAuthConfig().sessionSecret;
  return hmac(`ip:${ip}`, secret);
}

export async function enforceRateLimit(
  subject: string,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  await ensureDatabase();
  const d1 = getD1();
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSeconds;
  const bucketKey = `${action}:${subject}`;

  const row = await d1
    .prepare(
      `INSERT INTO rate_limits (bucket_key, count, reset_at) VALUES (?, 1, ?)
       ON CONFLICT(bucket_key) DO UPDATE SET
         count = CASE WHEN rate_limits.reset_at <= ? THEN 1 ELSE rate_limits.count + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= ? THEN excluded.reset_at ELSE rate_limits.reset_at END
       RETURNING count, reset_at`,
    )
    .bind(bucketKey, resetAt, now, now)
    .first<{ count: number; reset_at: number }>();

  if (!row || row.count > limit) {
    throw new RateLimitError(Math.max(1, (row?.reset_at || resetAt) - now));
  }
}
