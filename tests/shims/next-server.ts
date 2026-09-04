interface CookieOptions {
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: string;
  secure?: boolean;
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join('; ');
}

class ResponseCookies {
  constructor(private readonly headers: Headers) {}

  set(name: string, value: string, options?: CookieOptions) {
    this.headers.append('Set-Cookie', serializeCookie(name, value, options));
  }

  delete(name: string) {
    this.headers.append(
      'Set-Cookie',
      serializeCookie(name, '', { path: '/', expires: new Date(0) }),
    );
  }
}

export class NextResponse extends Response {
  readonly cookies: ResponseCookies;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init);
    this.cookies = new ResponseCookies(this.headers);
  }

  static redirect(url: URL | string, status = 307) {
    return new NextResponse(null, {
      status,
      headers: { Location: String(url) },
    });
  }

  static json(data: unknown, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');
    return new NextResponse(JSON.stringify(data), { ...init, headers });
  }
}

export class NextRequest extends Request {
  readonly nextUrl: URL;
  readonly cookies: { get: (name: string) => { value: string } | undefined };

  constructor(input: string | URL | Request, init?: RequestInit) {
    super(input, init);
    this.nextUrl = new URL(this.url);
    this.cookies = {
      get: (name: string) => {
        const prefix = `${name}=`;
        const value = (this.headers.get('Cookie') || '')
          .split(';')
          .map((part) => part.trim())
          .find((part) => part.startsWith(prefix))
          ?.slice(prefix.length);
        return value === undefined ? undefined : { value: decodeURIComponent(value) };
      },
    };
  }
}
