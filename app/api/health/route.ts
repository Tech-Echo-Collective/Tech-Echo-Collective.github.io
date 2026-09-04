import { NextResponse } from 'next/server';
import { getD1 } from '@/db';
import { getFounderGithubUserId } from '@/lib/config';
import {
  founderInvariantIsHealthy,
  REQUIRED_HEALTH_SCHEMA_OBJECTS,
  type SchemaHealthRow,
  type FounderHealthRow,
} from '@/lib/health';

export const dynamic = 'force-dynamic';

const responseHeaders = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

export async function GET() {
  try {
    const d1 = getD1();
    const founder = await d1
      .prepare(
        `SELECT a.reserved_github_user_id, a.member_id, m.github_user_id
         FROM member_number_allocations a
         LEFT JOIN members m ON m.id = a.member_id
         WHERE a.member_number = 1`,
      )
      .first<FounderHealthRow>();
    const schemaObjects = await d1
      .prepare(
        `SELECT name, type, sql FROM sqlite_schema
         WHERE name IN (${REQUIRED_HEALTH_SCHEMA_OBJECTS.map(() => '?').join(',')})`,
      )
      .bind(...REQUIRED_HEALTH_SCHEMA_OBJECTS)
      .all<SchemaHealthRow>();
    const healthy = founderInvariantIsHealthy(
      founder,
      schemaObjects.results || [],
      getFounderGithubUserId(),
    );
    return NextResponse.json(
      { status: healthy ? 'ok' : 'unavailable' },
      { status: healthy ? 200 : 503, headers: responseHeaders },
    );
  } catch {
    return NextResponse.json(
      { status: 'unavailable' },
      { status: 503, headers: responseHeaders },
    );
  }
}
