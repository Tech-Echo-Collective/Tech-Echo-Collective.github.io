import { NextResponse } from 'next/server';
import { requireFormMember, updateOnboarding } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/rate-limit';
import { LOCALE_COOKIE, localeCookieOptions } from '@/lib/i18n';
import { getAuthConfig } from '@/lib/config';
import {
  assertFormContentLength,
  onboardingSchema,
  safeForumReturnPath,
} from '@/lib/validation';

export async function POST(request: Request) {
  try {
    assertFormContentLength(request, 8 * 1024);
    const formData = await request.formData();
    const member = await requireFormMember(request, formData, 'account');
    const input = onboardingSchema.parse(Object.fromEntries(formData));
    await enforceRateLimit(member.id, 'onboarding', 20, 60 * 60);
    await updateOnboarding(member.id, input.locale);
    const config = getAuthConfig();
    const destination =
      formData.get('next') === 'forum'
        ? (() => {
            const forum = new URL('/auth/forum', config.accountOrigin);
            forum.searchParams.set(
              'returnTo',
              safeForumReturnPath(String(formData.get('returnTo') || '/')),
            );
            return forum;
          })()
        : new URL('/home', config.accountOrigin);
    const response = NextResponse.redirect(destination, 303);
    response.cookies.set(
      LOCALE_COOKIE,
      input.locale,
      localeCookieOptions(config.appOrigin.startsWith('https://')),
    );
    return response;
  } catch {
    return NextResponse.redirect(new URL('/onboarding?error=validation', request.url), 303);
  }
}
