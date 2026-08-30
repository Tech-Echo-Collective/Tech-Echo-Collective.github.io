import { NextResponse } from 'next/server';
import { deleteSession, requireFormMember, sessionCookieName } from '@/lib/auth';
import { assertFormContentLength } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    assertFormContentLength(request, 8 * 1024);
    const formData = await request.formData();
    await requireFormMember(request, formData);
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionCookie = sessionCookieName();
    const rawSession = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${sessionCookie}=`))
      ?.slice(sessionCookie.length + 1);
    if (rawSession) await deleteSession(decodeURIComponent(rawSession));
  } catch {
    return new NextResponse('Invalid logout request.', { status: 403 });
  }
  const response = NextResponse.redirect(new URL('/', request.url), 303);
  response.cookies.delete(sessionCookieName());
  return response;
}
