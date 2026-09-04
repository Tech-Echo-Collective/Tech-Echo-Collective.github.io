export function expiredCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  };
}
