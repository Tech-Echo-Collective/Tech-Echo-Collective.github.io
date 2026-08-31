import { z } from 'zod';
import type { Locale } from './types';

export const locales = ['en', 'zh', 'fr', 'es'] as const;
export const localeSchema = z.enum(locales);

export const onboardingSchema = z.object({
  locale: localeSchema,
  csrf: z.string().min(20).max(256),
});

export const settingsSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  locale: localeSchema,
  csrf: z.string().min(20).max(256),
});

export const discussionSchema = z.object({
  title: z.string().trim().min(4).max(120),
  categoryId: z.string().trim().min(8).max(128),
  body: z.string().trim().min(10).max(50_000),
  csrf: z.string().min(20).max(256),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(20_000),
  csrf: z.string().min(20).max(256),
});

export const reactionSchema = z.object({
  discussionNumber: z.coerce.number().int().positive(),
  subjectId: z.string().trim().min(8).max(128),
  content: z.enum(['THUMBS_UP', 'HEART', 'ROCKET', 'EYES']),
  remove: z.enum(['0', '1']).default('0'),
  csrf: z.string().min(20).max(256),
  returnTo: z.string().startsWith('/forum/').max(200),
});

export function assertFormContentLength(request: Request, maximumBytes: number): void {
  const mediaType = (request.headers.get('Content-Type') || '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase();
  if (
    mediaType !== 'application/x-www-form-urlencoded' &&
    mediaType !== 'multipart/form-data'
  ) {
    throw new Error('Unsupported form content type.');
  }
  const value = request.headers.get('Content-Length');
  if (!value) return;
  const contentLength = Number(value);
  if (
    !Number.isSafeInteger(contentLength) ||
    contentLength < 0 ||
    contentLength > maximumBytes
  ) {
    throw new Error('Request body is too large.');
  }
}

export function normalizeLocale(value: unknown, fallback: Locale = 'en'): Locale {
  const result = localeSchema.safeParse(value);
  return result.success ? result.data : fallback;
}

export function safeInternalPath(value: string | null, fallback = '/home'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const parsed = new URL(value, 'https://tech-echo.invalid');
    return parsed.origin === 'https://tech-echo.invalid'
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}

export function safeForumReturnPath(value: string | null, fallback = '/'): string {
  if (
    !value ||
    value.length > 300 ||
    value.includes('\\') ||
    value.includes('\r') ||
    value.includes('\n') ||
    value.includes('\0')
  ) {
    return fallback;
  }
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;

  try {
    const parsed = new URL(value, 'https://forum.techecho.invalid');
    if (parsed.origin !== 'https://forum.techecho.invalid') return fallback;

    let decodedPath = parsed.pathname;
    for (let index = 0; index < 2; index += 1) {
      const decoded = decodeURIComponent(decodedPath);
      if (decoded === decodedPath) break;
      decodedPath = decoded;
    }
    if (decodedPath.includes('\\') || decodedPath.startsWith('//')) return fallback;

    const allowed =
      decodedPath === '/' ||
      decodedPath === '/forum' ||
      decodedPath === '/forum/new' ||
      /^\/forum\/[1-9]\d*$/.test(decodedPath);
    if (!allowed) return fallback;

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
