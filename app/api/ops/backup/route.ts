import { NextResponse } from 'next/server';
import { BACKUP_MAX_BYTES, createDurableIdentityBackup } from '@/lib/backup';
import { getBackupExportToken, getOriginConfig } from '@/lib/config';
import { timingSafeEqual } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

const responseHeaders = {
  'Cache-Control': 'private, no-store',
  Pragma: 'no-cache',
  Vary: 'Authorization',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

function errorResponse(status: 401 | 421 | 503) {
  return NextResponse.json({ status: 'unavailable' }, { status, headers: responseHeaders });
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return '';
  const token = authorization.slice('Bearer '.length);
  if (!token || /[\s\r\n]/.test(token)) return '';
  return token;
}

export async function POST(request: Request) {
  try {
    const { accountOrigin } = getOriginConfig();
    if (new URL(request.url).origin !== accountOrigin) return errorResponse(421);

    const expectedToken = getBackupExportToken();
    if (!timingSafeEqual(bearerToken(request), expectedToken)) {
      return errorResponse(401);
    }

    const backup = await createDurableIdentityBackup();
    const body = JSON.stringify(backup);
    if (new TextEncoder().encode(body).byteLength > BACKUP_MAX_BYTES) {
      return errorResponse(503);
    }
    const filename = `tech-echo-durable-${backup.exportedAt.replace(/[:.]/g, '-')}.json`;
    return new Response(body, {
      status: 200,
      headers: {
        ...responseHeaders,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return errorResponse(503);
  }
}
