import { NextResponse } from 'next/server';
import { requireFormMember } from '@/lib/auth';
import { addDiscussionComment, getDiscussion, GitHubApiError } from '@/lib/github';
import { anonymizedIp, enforceRateLimit, RateLimitError } from '@/lib/rate-limit';
import { assertFormContentLength, commentSchema } from '@/lib/validation';

export async function POST(
  request: Request,
  context: { params: Promise<{ number: string }> },
) {
  const { number: rawNumber } = await context.params;
  const number = Number(rawNumber);
  try {
    assertFormContentLength(request, 32 * 1024);
    const formData = await request.formData();
    if (!Number.isSafeInteger(number) || number < 1) throw new Error('Invalid discussion.');
    const member = await requireFormMember(request, formData);
    const input = commentSchema.parse(Object.fromEntries(formData));
    const ip = await anonymizedIp(request);
    await Promise.all([
      enforceRateLimit(member.id, 'comment-member', 30, 60 * 60),
      enforceRateLimit(ip, 'comment-ip', 60, 60 * 60),
    ]);
    const discussion = await getDiscussion(member.id, number);
    if (!discussion) throw new Error('Discussion not found.');
    await addDiscussionComment(member.id, discussion.id, input.body);
    return NextResponse.redirect(new URL(`/forum/${number}#replies`, request.url), 303);
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
    return NextResponse.redirect(
      new URL(`/forum/${number}?error=${code}#reply`, request.url),
      303,
    );
  }
}
