import { NextResponse } from 'next/server';
import { requireFormMember } from '@/lib/auth';
import { createDiscussion, GitHubApiError } from '@/lib/github';
import { anonymizedIp, enforceRateLimit, RateLimitError } from '@/lib/rate-limit';
import { assertFormContentLength, discussionSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    assertFormContentLength(request, 64 * 1024);
    const formData = await request.formData();
    const member = await requireFormMember(request, formData, 'forum');
    const input = discussionSchema.parse(Object.fromEntries(formData));
    const ip = await anonymizedIp(request);
    await Promise.all([
      enforceRateLimit(member.id, 'discussion-member', 5, 60 * 60),
      enforceRateLimit(ip, 'discussion-ip', 12, 60 * 60),
    ]);
    const discussion = await createDiscussion(member.id, input);
    return NextResponse.redirect(new URL(`/forum/${discussion.number}`, request.url), 303);
  } catch (error) {
    const code =
      error instanceof RateLimitError ||
      (error instanceof GitHubApiError && error.code === 'github_rate_limit')
        ? 'rate_limit'
        : error instanceof GitHubApiError && error.code === 'reauthorize'
          ? 'reauthorize'
          : error instanceof GitHubApiError
            ? 'github'
            : 'validation';
    return NextResponse.redirect(new URL(`/forum/new?error=${code}`, request.url), 303);
  }
}
