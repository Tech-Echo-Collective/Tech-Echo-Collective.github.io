import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  completePendingRegistration,
  createSession,
  findMemberByGithubUserId,
  sessionCookieName,
  sessionCookieOptions,
} from '@/lib/auth';
import { enforceRateLimit, RateLimitError } from '@/lib/rate-limit';
import { LOCALE_COOKIE, localeCookieOptions } from '@/lib/i18n';
import { getAuthConfig } from '@/lib/config';
import { expiredCookieOptions } from '@/lib/cookies';
import {
  pendingRegistrationCookieName,
  requirePendingRegistrationForm,
} from '@/lib/registration';
import { assertFormContentLength, onboardingSchema } from '@/lib/validation';

export async function POST(request: Request) {
  let completionIdentity:
    | {
        githubUserId: string;
        locale: 'en' | 'zh' | 'fr' | 'es';
        forumReturnPath?: string;
      }
    | undefined;
  try {
    assertFormContentLength(request, 8 * 1024);
    const formData = await request.formData();
    const input = onboardingSchema.parse(Object.fromEntries(formData));
    const pending = await requirePendingRegistrationForm(request, formData);
    completionIdentity = {
      githubUserId: String(pending.registration.viewer.id),
      locale: input.locale,
      forumReturnPath: pending.registration.forumReturnPath,
    };
    await enforceRateLimit(
      String(pending.registration.viewer.id),
      'onboarding',
      20,
      60 * 60,
    );
    const completed = await completePendingRegistration(
      pending.token,
      input.displayName,
      input.locale,
    );
    const session = await createSession(completed.member.id, 'account');
    const config = getAuthConfig();
    const destination = completed.forumReturnPath
      ? (() => {
          const forum = new URL('/auth/forum', config.accountOrigin);
          forum.searchParams.set('returnTo', completed.forumReturnPath!);
          return forum;
        })()
      : new URL('/home', config.accountOrigin);
    const response = NextResponse.redirect(destination, 303);
    response.cookies.set(
      sessionCookieName('account'),
      session.token,
      sessionCookieOptions('account', session.expiresAt),
    );
    response.cookies.set(
      LOCALE_COOKIE,
      input.locale,
      localeCookieOptions(config.appOrigin.startsWith('https://')),
    );
    response.cookies.set(
      pendingRegistrationCookieName(),
      '',
      expiredCookieOptions(config.accountOrigin.startsWith('https://')),
    );
    return response;
  } catch (error) {
    if (completionIdentity) {
      try {
        const member = await findMemberByGithubUserId(completionIdentity.githubUserId);
        if (member?.onboardedAt) {
          const destination = new URL('/', getAuthConfig().accountOrigin);
          destination.searchParams.set('mode', 'signin');
          destination.searchParams.set('lang', completionIdentity.locale);
          destination.searchParams.set('notice', 'membership_created');
          if (completionIdentity.forumReturnPath) {
            destination.searchParams.set('next', 'forum');
            destination.searchParams.set('returnTo', completionIdentity.forumReturnPath);
          }
          const response = NextResponse.redirect(destination, 303);
          response.cookies.set(
            pendingRegistrationCookieName(),
            '',
            expiredCookieOptions(getAuthConfig().accountOrigin.startsWith('https://')),
          );
          return response;
        }
      } catch {
        // Fall through to the stable, non-sensitive registration error below.
      }
    }
    const code =
      error instanceof RateLimitError
        ? 'rate_limit'
        : error instanceof ZodError ||
            !(error instanceof Error) ||
            !/(missing|expired|already used)/i.test(error.message)
          ? 'validation'
          : 'registration_expired';
    return NextResponse.redirect(
      new URL(`/onboarding?error=${code}`, getAuthConfig().accountOrigin),
      303,
    );
  }
}
