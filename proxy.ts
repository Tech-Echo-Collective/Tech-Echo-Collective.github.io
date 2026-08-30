import { NextRequest, NextResponse } from 'next/server';

const LEGACY_HOST = 'tech-echo-collective.noahwalkerror.chatgpt.site';
const CANONICAL_HOST = 'forum.techecho.org';

export function proxy(request: NextRequest) {
  if (request.nextUrl.hostname.toLowerCase() !== LEGACY_HOST) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.protocol = 'https:';
  destination.hostname = CANONICAL_HOST;
  destination.port = '';

  return NextResponse.redirect(destination, 308);
}
