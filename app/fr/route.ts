import { NextResponse } from 'next/server';
import { LOCALE_COOKIE, localeCookieOptions } from '@/lib/i18n';

export function GET(request: Request) {
  const origin = new URL(request.url);
  const response = NextResponse.redirect(new URL('/', origin), 302);
  response.cookies.set(
    LOCALE_COOKIE,
    'fr',
    localeCookieOptions(origin.protocol === 'https:'),
  );
  return response;
}
