import { NextResponse } from 'next/server';
import { requireFormMember } from '@/lib/auth';
import { changeReaction, getDiscussion, GitHubApiError } from '@/lib/github';
import { enforceRateLimit, RateLimitError } from '@/lib/rate-limit';
import {
  assertFormContentLength,
  reactionSchema,
  safeInternalPath,
} from '@/lib/validation';

export async function POST(request: Request) {
  let returnTo = '/forum';
  try {
    assertFormContentLength(request, 8 * 1024);
    const formData = await request.formData();
    const member = await requireFormMember(request, formData);
    const input = reactionSchema.parse(Object.fromEntries(formData));
    returnTo = safeInternalPath(input.returnTo, '/forum');
    await enforceRateLimit(member.id, 'reaction', 60, 60 * 60);
    const discussion = await getDiscussion(member.id, input.discussionNumber);
    const allowedSubjectIds = new Set([
      discussion?.id,
      ...(discussion?.comments.nodes.map((comment) => comment.id) || []),
    ]);
    if (!discussion || !allowedSubjectIds.has(input.subjectId)) {
      throw new GitHubApiError(
        'Reaction target is outside this Discussion.',
        'validation',
        400,
      );
    }
    await changeReaction(member.id, input.subjectId, input.content, input.remove === '1');
    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  } catch (error) {
    const code =
      error instanceof RateLimitError ||
      (error instanceof GitHubApiError && error.code === 'github_rate_limit')
        ? 'rate_limit'
        : error instanceof GitHubApiError && error.code === 'reauthorize'
          ? 'reauthorize'
          : 'github';
    const redirectUrl = new URL(returnTo, request.url);
    redirectUrl.searchParams.set('error', code);
    return NextResponse.redirect(redirectUrl, 303);
  }
}
