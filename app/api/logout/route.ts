import { NextResponse } from 'next/server';
import { deleteSessionFamily, requireFormSession, sessionCookieName } from '@/lib/auth';
import { getOriginConfig } from '@/lib/config';
import { expiredCookieOptions } from '@/lib/cookies';
import { assertFormContentLength } from '@/lib/validation';

export async function POST(request: Request) {
  let audience: 'account' | 'forum' = 'account';
  try {
    assertFormContentLength(request, 8 * 1024);
    const formData = await request.formData();
    const session = await requireFormSession(request, formData);
    audience = session.audience;
    await deleteSessionFamily(session.familyId);
  } catch {
    return new NextResponse('Invalid logout request.', { status: 403 });
  }
  const { accountOrigin, forumOrigin } = getOriginConfig();
  const response = NextResponse.redirect(new URL('/', accountOrigin), 303);
  const secure = (audience === 'account' ? accountOrigin : forumOrigin).startsWith(
    'https://',
  );
  response.cookies.set(sessionCookieName(audience), '', expiredCookieOptions(secure));
  response.cookies.set('__Host-tec_session', '', expiredCookieOptions(secure));
  return response;
}
