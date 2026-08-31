import { NextResponse } from 'next/server';
import { oauthStateCookieName } from '@/lib/auth';
import { getAuthConfig, isAuthConfigured } from '@/lib/config';
import { createOAuthTransaction } from '@/lib/oauth';
import { anonymizedIp, enforceRateLimit, RateLimitError } from '@/lib/rate-limit';
import { normalizeLocale, safeForumReturnPath } from '@/lib/validation';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const intent = url.searchParams.get('intent') === 'join' ? 'join' : 'signin';
  const locale = normalizeLocale(url.searchParams.get('locale'));
  if (!isAuthConfigured()) {
    return NextResponse.redirect(
      new URL(`/?mode=${intent}&lang=${locale}&error=configuration`, request.url),
      302,
    );
  }

  try {
    const config = getAuthConfig();
    if (url.origin !== config.accountOrigin) {
      return new NextResponse('Misdirected request', { status: 421 });
    }
    await enforceRateLimit(await anonymizedIp(request), 'oauth', 20, 10 * 60);
    const forumReturnPath =
      url.searchParams.get('next') === 'forum'
        ? safeForumReturnPath(url.searchParams.get('returnTo'))
        : undefined;
    const transaction = await createOAuthTransaction(intent, locale, forumReturnPath);
    const response = NextResponse.redirect(transaction.authorizeUrl, 302);
    response.cookies.set(oauthStateCookieName(), transaction.state, {
      httpOnly: true,
      secure: config.accountOrigin.startsWith('https://'),
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    const code = error instanceof RateLimitError ? 'rate_limit' : 'configuration';
    return NextResponse.redirect(
      new URL(`/?mode=${intent}&lang=${locale}&error=${code}`, request.url),
      302,
    );
  }
}
