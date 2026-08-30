import { NextResponse } from 'next/server';
import { memberFromSessionToken, sessionCookieName, updateSettings } from '@/lib/auth';
import { getAuthConfig, isAuthConfigured } from '@/lib/config';
import { LOCALE_COOKIE, localeCookieOptions } from '@/lib/i18n';
import { assertFormContentLength, localeSchema, safeInternalPath } from '@/lib/validation';

export async function POST(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const expectedOrigin = isAuthConfigured() ? getAuthConfig().appOrigin : requestOrigin;
  if (request.headers.get('Origin') !== expectedOrigin) {
    return new NextResponse('Invalid origin', { status: 403 });
  }
  assertFormContentLength(request, 8 * 1024);
  const formData = await request.formData();
  const locale = localeSchema.safeParse(formData.get('locale'));
  const returnTo = safeInternalPath(String(formData.get('returnTo') || '/'));
  if (!locale.success) return new NextResponse('Invalid locale', { status: 400 });

  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionCookie = sessionCookieName();
  const rawSession = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`))
    ?.slice(sessionCookie.length + 1);
  const member = await memberFromSessionToken(rawSession && decodeURIComponent(rawSession));
  if (member) await updateSettings(member.id, member.displayName, locale.data);

  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set(
    LOCALE_COOKIE,
    locale.data,
    localeCookieOptions(expectedOrigin.startsWith('https://')),
  );
  return response;
}
