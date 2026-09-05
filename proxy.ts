import { NextRequest, NextResponse } from 'next/server';
import { atlasLegacyDestination, canonicalPhysicaPath } from '@/lib/routing';

const LEGACY_HOST = 'tech-echo-collective.noahwalkerror.chatgpt.site';
const ACCOUNT_HOST = 'techecho.org';
const WWW_HOST = 'www.techecho.org';
const FORUM_HOST = 'forum.techecho.org';
const ATLAS_ORIGIN = 'https://atlas.techecho.org';

function redirectHost(request: NextRequest, hostname: string) {
  const destination = request.nextUrl.clone();
  destination.protocol = 'https:';
  destination.hostname = hostname;
  destination.port = '';
  return NextResponse.redirect(destination, 308);
}

export function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const pathname = request.nextUrl.pathname;

  if (hostname === LEGACY_HOST || hostname === WWW_HOST) {
    return redirectHost(request, ACCOUNT_HOST);
  }

  if (
    (hostname === ACCOUNT_HOST || hostname === FORUM_HOST) &&
    pathname === '/favicon.ico'
  ) {
    const destination = request.nextUrl.clone();
    destination.pathname = '/assets/tech-echo-mark.svg';
    return NextResponse.redirect(destination, 308);
  }

  if (hostname === ACCOUNT_HOST) {
    const canonicalPath = canonicalPhysicaPath(pathname);
    if (canonicalPath) {
      const destination = request.nextUrl.clone();
      destination.pathname = canonicalPath;
      return NextResponse.redirect(destination, 308);
    }

    if (pathname === '/googlee054abfb1b2b52cf.html') {
      return new NextResponse('google-site-verification: googlee054abfb1b2b52cf.html\n', {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    if (pathname === '/Physics-Atlas-Web' || pathname.startsWith('/Physics-Atlas-Web/')) {
      const destination = atlasLegacyDestination(
        pathname,
        request.nextUrl.search,
        ATLAS_ORIGIN,
      );
      return NextResponse.redirect(destination, 308);
    }

    if (pathname === '/forum' || pathname.startsWith('/forum/')) {
      const returnPath = `${pathname === '/forum' ? '/' : pathname}${request.nextUrl.search}`;
      const destination = new URL('/auth/forum', request.nextUrl.origin);
      destination.searchParams.set('returnTo', returnPath);
      return NextResponse.redirect(destination, 302);
    }

    if (
      pathname.startsWith('/api/discussions') ||
      pathname === '/api/reactions' ||
      pathname === '/auth/handoff'
    ) {
      return new NextResponse('Misdirected request', { status: 421 });
    }

    return NextResponse.next();
  }

  if (hostname === FORUM_HOST) {
    if (pathname === '/') {
      const destination = request.nextUrl.clone();
      destination.pathname = '/forum';
      return NextResponse.rewrite(destination);
    }

    if (pathname === '/auth/callback') {
      return new NextResponse('Misdirected request', { status: 421 });
    }

    if (
      pathname === '/auth/start' ||
      pathname === '/auth/forum' ||
      pathname === '/home' ||
      pathname === '/onboarding' ||
      pathname === '/settings' ||
      pathname === '/projects' ||
      pathname.startsWith('/projects/') ||
      pathname === '/members' ||
      pathname === '/about' ||
      pathname === '/privacy' ||
      pathname === '/terms' ||
      pathname === '/zh' ||
      pathname === '/fr' ||
      pathname === '/es' ||
      pathname.startsWith('/member/')
    ) {
      return redirectHost(request, ACCOUNT_HOST);
    }
  }

  return NextResponse.next();
}
