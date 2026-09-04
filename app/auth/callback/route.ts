import { NextRequest, NextResponse } from 'next/server';
import {
  createSession,
  findMemberByGithubUserId,
  oauthStateCookieName,
  saveGitHubCredential,
  sessionCookieName,
  sessionCookieOptions,
  updateExistingMemberFromGitHub,
} from '@/lib/auth';
import { resolveOAuthMembershipAction } from '@/lib/auth-intent';
import { getAuthConfig } from '@/lib/config';
import { expiredCookieOptions } from '@/lib/cookies';
import { timingSafeEqual } from '@/lib/crypto';
import { exchangeOAuthCode, fetchGitHubViewer, GitHubApiError } from '@/lib/github';
import { consumeOAuthTransaction } from '@/lib/oauth';
import { LOCALE_COOKIE, localeCookieOptions } from '@/lib/i18n';
import {
  createPendingRegistration,
  discardPendingRegistration,
  pendingRegistrationCookieName,
  pendingRegistrationCookieOptions,
} from '@/lib/registration';
import type { Locale } from '@/lib/types';
import { safeForumReturnPath } from '@/lib/validation';

function gatewayResponse(
  code: string,
  options: {
    locale?: Locale;
    mode?: 'signin' | 'join';
    forumReturnPath?: string;
    notice?: boolean;
  } = {},
) {
  const destination = new URL('/', getAuthConfig().accountOrigin);
  destination.searchParams.set(options.notice ? 'notice' : 'error', code);
  if (options.locale) destination.searchParams.set('lang', options.locale);
  if (options.mode) destination.searchParams.set('mode', options.mode);
  if (options.forumReturnPath) {
    destination.searchParams.set('next', 'forum');
    destination.searchParams.set('returnTo', safeForumReturnPath(options.forumReturnPath));
  }
  const response = NextResponse.redirect(destination, 302);
  response.cookies.set(
    oauthStateCookieName(),
    '',
    expiredCookieOptions(getAuthConfig().accountOrigin.startsWith('https://')),
  );
  return response;
}

export async function GET(request: NextRequest) {
  const config = getAuthConfig();
  if (request.nextUrl.origin !== config.accountOrigin) {
    return new NextResponse('Misdirected request', { status: 421 });
  }
  const error = request.nextUrl.searchParams.get('error');
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const stateCookie = request.cookies.get(oauthStateCookieName())?.value;
  if (!state || !stateCookie || !timingSafeEqual(state, stateCookie)) {
    return gatewayResponse('oauth_state');
  }

  let transaction: Awaited<ReturnType<typeof consumeOAuthTransaction>> | undefined;
  let verifiedIdentity = false;
  try {
    transaction = await consumeOAuthTransaction(state);
    if (error) {
      return gatewayResponse('oauth_denied', {
        locale: transaction.locale,
        mode: transaction.intent,
        forumReturnPath: transaction.forumReturnPath,
      });
    }
    if (!code) return gatewayResponse('oauth_state');
    const token = await exchangeOAuthCode(code, transaction.verifier);
    const viewer = await fetchGitHubViewer(token.access_token);
    verifiedIdentity = true;
    await discardPendingRegistration(
      request.cookies.get(pendingRegistrationCookieName())?.value,
    );
    const existing = await findMemberByGithubUserId(String(viewer.id));
    const action = resolveOAuthMembershipAction(transaction.intent, existing);

    if (action === 'account_not_found' || action === 'registration_incomplete') {
      const response = gatewayResponse(action, {
        locale: transaction.locale,
        mode: 'join',
        forumReturnPath: transaction.forumReturnPath,
        notice: action === 'account_not_found',
      });
      response.cookies.set(
        sessionCookieName('account'),
        '',
        expiredCookieOptions(config.accountOrigin.startsWith('https://')),
      );
      response.cookies.set(
        pendingRegistrationCookieName(),
        '',
        expiredCookieOptions(config.accountOrigin.startsWith('https://')),
      );
      return response;
    }

    if (action === 'start_registration') {
      const pending = await createPendingRegistration(
        viewer,
        {
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          tokenType: token.token_type,
          expiresIn: token.expires_in,
          refreshTokenExpiresIn: token.refresh_token_expires_in,
        },
        transaction.locale,
        transaction.forumReturnPath,
      );
      const response = NextResponse.redirect(
        new URL('/onboarding', config.accountOrigin),
        302,
      );
      response.cookies.set(
        pendingRegistrationCookieName(),
        pending.token,
        pendingRegistrationCookieOptions(pending.expiresAt),
      );
      response.cookies.set(
        LOCALE_COOKIE,
        transaction.locale,
        localeCookieOptions(new URL(request.url).protocol === 'https:'),
      );
      response.cookies.set(
        oauthStateCookieName(),
        '',
        expiredCookieOptions(config.accountOrigin.startsWith('https://')),
      );
      response.cookies.set(
        sessionCookieName('account'),
        '',
        expiredCookieOptions(config.accountOrigin.startsWith('https://')),
      );
      return response;
    }

    const member = await updateExistingMemberFromGitHub(viewer);
    await saveGitHubCredential(member.id, {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenType: token.token_type,
      expiresIn: token.expires_in,
      refreshTokenExpiresIn: token.refresh_token_expires_in,
    });
    const session = await createSession(member.id, 'account');
    const destination = (() => {
      if (transaction?.forumReturnPath) {
        const forumHandoff = new URL('/auth/forum', config.accountOrigin);
        forumHandoff.searchParams.set('returnTo', transaction.forumReturnPath);
        return forumHandoff;
      }
      return new URL('/home', config.accountOrigin);
    })();
    const response = NextResponse.redirect(destination, 302);
    response.cookies.set(
      sessionCookieName('account'),
      session.token,
      sessionCookieOptions('account', session.expiresAt),
    );
    response.cookies.set(
      LOCALE_COOKIE,
      member.preferredLocale,
      localeCookieOptions(new URL(request.url).protocol === 'https:'),
    );
    response.cookies.set(
      oauthStateCookieName(),
      '',
      expiredCookieOptions(config.accountOrigin.startsWith('https://')),
    );
    response.cookies.set(
      pendingRegistrationCookieName(),
      '',
      expiredCookieOptions(config.accountOrigin.startsWith('https://')),
    );
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
    const response = gatewayResponse(errorCode, {
      locale: transaction?.locale,
      mode: transaction?.intent,
      forumReturnPath: transaction?.forumReturnPath,
    });
    if (verifiedIdentity) {
      response.cookies.set(
        pendingRegistrationCookieName(),
        '',
        expiredCookieOptions(config.accountOrigin.startsWith('https://')),
      );
    }
    return response;
  }
}
