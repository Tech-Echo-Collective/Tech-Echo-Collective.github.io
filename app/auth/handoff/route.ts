import { NextResponse } from 'next/server';
import { sessionCookieName, sessionCookieOptions } from '@/lib/auth';
import { getOriginConfig } from '@/lib/config';
import { LOCALE_COOKIE, localeCookieOptions } from '@/lib/i18n';
import { consumeForumHandoff } from '@/lib/sso';
import { assertFormContentLength } from '@/lib/validation';

export async function POST(request: Request) {
  const { accountOrigin, forumOrigin } = getOriginConfig();
  if (
    new URL(request.url).origin !== forumOrigin ||
    request.headers.get('Origin') !== accountOrigin
  ) {
    return new NextResponse('Invalid forum handoff.', { status: 403 });
  }

  try {
    assertFormContentLength(request, 4 * 1024);
    const formData = await request.formData();
    const ticket = String(formData.get('ticket') || '');
    const handoff = await consumeForumHandoff(ticket);

    const response = NextResponse.redirect(
      new URL(handoff.returnPath, forumOrigin),
      303,
    );
    response.cookies.set(
      sessionCookieName('forum'),
      handoff.session.token,
      sessionCookieOptions('forum', handoff.session.expiresAt),
    );
    response.cookies.set(
      LOCALE_COOKIE,
      handoff.locale,
      localeCookieOptions(forumOrigin.startsWith('https://')),
    );
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch {
    return NextResponse.redirect(
      new URL('/?error=session_required', accountOrigin),
      303,
    );
  }
}
