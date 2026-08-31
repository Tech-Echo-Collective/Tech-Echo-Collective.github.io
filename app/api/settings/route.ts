import { NextResponse } from 'next/server';
import { requireFormMember, updateSettings } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/rate-limit';
import { LOCALE_COOKIE, localeCookieOptions } from '@/lib/i18n';
import { getAuthConfig } from '@/lib/config';
import { assertFormContentLength, settingsSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    assertFormContentLength(request, 8 * 1024);
    const formData = await request.formData();
    const member = await requireFormMember(request, formData, 'account');
    const input = settingsSchema.parse(Object.fromEntries(formData));
    await enforceRateLimit(member.id, 'settings', 20, 60 * 60);
    await updateSettings(member.id, input.displayName, input.locale);
    const config = getAuthConfig();
    const response = NextResponse.redirect(
      new URL('/settings?saved=1', config.appOrigin),
      303,
    );
    response.cookies.set(
      LOCALE_COOKIE,
      input.locale,
      localeCookieOptions(config.appOrigin.startsWith('https://')),
    );
    return response;
  } catch {
    return NextResponse.redirect(new URL('/settings?error=validation', request.url), 303);
  }
}
