import { NextResponse } from 'next/server';
import { oauthStateCookieName } from '@/lib/auth';
import { getAuthConfig, isAuthConfigured } from '@/lib/config';
import { createOAuthTransaction } from '@/lib/oauth';
import { anonymizedIp, enforceRateLimit, RateLimitError } from '@/lib/rate-limit';
import { normalizeLocale } from '@/lib/validation';

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
    await enforceRateLimit(await anonymizedIp(request), 'oauth', 20, 10 * 60);
    const transaction = await createOAuthTransaction(intent, locale);
    const response = NextResponse.redirect(transaction.authorizeUrl, 302);
    const config = getAuthConfig();
    response.cookies.set(oauthStateCookieName(), transaction.state, {
      httpOnly: true,
      secure: config.appOrigin.startsWith('https://'),
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
