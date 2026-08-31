import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getOriginConfig } from '@/lib/config';
import { randomToken } from '@/lib/crypto';
import { createForumHandoff } from '@/lib/sso';
import { safeForumReturnPath } from '@/lib/validation';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export async function GET(request: NextRequest) {
  const { accountOrigin, forumOrigin } = getOriginConfig();
  if (request.nextUrl.origin !== accountOrigin) {
    return new NextResponse('Misdirected request', { status: 421 });
  }

  const returnPath = safeForumReturnPath(request.nextUrl.searchParams.get('returnTo'));
  const source = await getCurrentSession('account');
  if (!source) {
    const gateway = new URL('/', accountOrigin);
    gateway.searchParams.set('error', 'session_required');
    gateway.searchParams.set('next', 'forum');
    gateway.searchParams.set('returnTo', returnPath);
    return NextResponse.redirect(gateway, 302);
  }
  if (!source.member.onboardedAt) {
    const onboarding = new URL('/onboarding', accountOrigin);
    onboarding.searchParams.set('next', 'forum');
    onboarding.searchParams.set('returnTo', returnPath);
    return NextResponse.redirect(onboarding, 302);
  }

  const handoff = await createForumHandoff(source, returnPath);
  const action = `${forumOrigin}/auth/handoff`;
  const nonce = randomToken(18);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>Opening Tech Echo Forum…</title></head>
<body><main><p>Opening Tech Echo Forum…</p>
<form id="handoff" method="post" action="${escapeHtml(action)}">
<input type="hidden" name="ticket" value="${escapeHtml(handoff.token)}">
<noscript><button type="submit">Continue to the forum</button></noscript>
</form></main><script nonce="${nonce}">document.getElementById('handoff').submit();</script></body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; form-action ${forumOrigin}; base-uri 'none'; frame-ancestors 'none'`,
      // A cross-origin form POST needs a non-null Origin for the forum's exact
      // source check. Send only the account origin, never the handoff path.
      'Referrer-Policy': 'origin',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
