import { NextRequest, NextResponse } from 'next/server';
import {
  createOrUpdateMember,
  createSession,
  oauthStateCookieName,
  saveGitHubCredential,
  sessionCookieName,
  sessionCookieOptions,
  updateSettings,
} from '@/lib/auth';
import { timingSafeEqual } from '@/lib/crypto';
import { exchangeOAuthCode, fetchGitHubViewer, GitHubApiError } from '@/lib/github';
import { consumeOAuthTransaction } from '@/lib/oauth';
import { LOCALE_COOKIE, localeCookieOptions } from '@/lib/i18n';

function gatewayError(request: Request, code: string) {
  const response = NextResponse.redirect(new URL(`/?error=${code}`, request.url), 302);
  response.cookies.delete(oauthStateCookieName());
  return response;
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  if (error) return gatewayError(request, 'oauth_denied');

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const stateCookie = request.cookies.get(oauthStateCookieName())?.value;
  if (!code || !state || !stateCookie || !timingSafeEqual(state, stateCookie)) {
    return gatewayError(request, 'oauth_state');
  }

  try {
    const transaction = await consumeOAuthTransaction(state);
    const token = await exchangeOAuthCode(code, transaction.verifier);
    const viewer = await fetchGitHubViewer(token.access_token);
    const member = await createOrUpdateMember(viewer);
    if (!member.onboardedAt && member.preferredLocale !== transaction.locale) {
      await updateSettings(member.id, member.displayName, transaction.locale);
      member.preferredLocale = transaction.locale;
    }
    await saveGitHubCredential(member.id, {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenType: token.token_type,
      expiresIn: token.expires_in,
      refreshTokenExpiresIn: token.refresh_token_expires_in,
    });
    const session = await createSession(member.id);
    const response = NextResponse.redirect(
      new URL(member.onboardedAt ? '/home' : '/onboarding', request.url),
      302,
    );
    response.cookies.set(
      sessionCookieName(),
      session.token,
      sessionCookieOptions(session.expiresAt),
    );
    response.cookies.set(
      LOCALE_COOKIE,
      member.preferredLocale,
      localeCookieOptions(new URL(request.url).protocol === 'https:'),
    );
    response.cookies.delete(oauthStateCookieName());
    return response;
  } catch (caught) {
    const errorCode =
      caught instanceof GitHubApiError
        ? caught.code === 'unverified_email'
          ? 'unverified_email'
          : 'oauth_state'
        : caught instanceof Error && caught.message.includes('Founder')
          ? 'configuration'
          : 'oauth_state';
    return gatewayError(request, errorCode);
  }
}
