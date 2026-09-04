import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { ErrorNotice } from '@/components/error-notice';
import { ForumError } from '@/components/forum-error';
import { MemberByline } from '@/components/member-byline';
import { ReactionBar } from '@/components/reaction-bar';
import { SafeMarkdown } from '@/components/markdown';
import { findMembersByGithubNodeIds, getCsrfToken, requireMember } from '@/lib/auth';
import { getDiscussion, GitHubApiError } from '@/lib/github';
import { formatRelativeTime, formatReplyLabel, getDictionary } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Discussion',
  robots: { index: false, follow: false },
};

export default async function DiscussionPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { number: rawNumber } = await params;
  const number = Number(rawNumber);
  if (!Number.isSafeInteger(number) || number < 1) notFound();
  const viewer = await requireMember({
    audience: 'forum',
    returnTo: `/forum/${number}`,
  });
  const dictionary = getDictionary(viewer.preferredLocale);
  const query = await searchParams;
  let discussion;
  try {
    discussion = await getDiscussion(viewer.id, number);
  } catch (error) {
    const code =
      error instanceof GitHubApiError && error.code === 'reauthorize'
        ? 'reauthorize'
        : 'github';
    return (
      <AppShell member={viewer} active="forum" returnTo={`/forum/${number}`}>
        <div className="forum-page">
          <ForumError
            locale={viewer.preferredLocale}
            code={code}
            returnTo={`/forum/${number}`}
          />
        </div>
      </AppShell>
    );
  }
  if (!discussion) notFound();
  const authorIds = [
    discussion.author?.id,
    ...discussion.comments.nodes.map((comment) => comment.author?.id),
  ].filter((id): id is string => Boolean(id));
  const memberMap = await findMembersByGithubNodeIds(authorIds);
  const csrf = await getCsrfToken('forum');
  const authorMember = discussion.author?.id
    ? memberMap.get(discussion.author.id)
    : undefined;
  const returnTo = `/forum/${number}`;

  return (
    <AppShell member={viewer} active="forum" returnTo={returnTo}>
      <div className="discussion-page">
        <a className="back-link" href="/forum">
          {dictionary['forum.back']}
        </a>
        <article className="discussion-post">
          <header>
            <span className="discussion-row__category">{discussion.category.name}</span>
            <h1>{discussion.title}</h1>
            <MemberByline
              author={discussion.author}
              member={authorMember}
              locale={viewer.preferredLocale}
              timestamp={formatRelativeTime(discussion.createdAt, viewer.preferredLocale)}
            />
          </header>
          <SafeMarkdown>{discussion.body}</SafeMarkdown>
          <footer>
            <ReactionBar
              subjectId={discussion.id}
              groups={discussion.reactionGroups}
              csrf={csrf}
              returnTo={returnTo}
              discussionNumber={number}
              locale={viewer.preferredLocale}
            />
            <a href={discussion.url}>{dictionary['forum.viewGithub']}</a>
          </footer>
        </article>

        <section id="replies" className="reply-section">
          <div className="reply-section__heading">
            <h2>
              {discussion.comments.totalCount}{' '}
              {formatReplyLabel(discussion.comments.totalCount, viewer.preferredLocale)}
            </h2>
            <span>{dictionary['forum.liveSource']}</span>
          </div>
          {discussion.comments.nodes.map((comment) => {
            const commentMember = comment.author?.id
              ? memberMap.get(comment.author.id)
              : undefined;
            return (
              <article className="comment-card" key={comment.id}>
                <MemberByline
                  author={comment.author}
                  member={commentMember}
                  locale={viewer.preferredLocale}
                  timestamp={formatRelativeTime(comment.createdAt, viewer.preferredLocale)}
                />
                <SafeMarkdown>{comment.body}</SafeMarkdown>
                <footer>
                  <ReactionBar
                    subjectId={comment.id}
                    groups={comment.reactionGroups}
                    csrf={csrf}
                    returnTo={`${returnTo}#replies`}
                    discussionNumber={number}
                    locale={viewer.preferredLocale}
                  />
                  <a href={comment.url}>{dictionary['forum.viewGithub']}</a>
                </footer>
              </article>
            );
          })}
          {discussion.comments.pageInfo.hasNextPage ? (
            <p className="comments-truncated">
              {dictionary['forum.commentsTruncated']}{' '}
              <a href={discussion.url}>{dictionary['forum.viewGithub']}</a>
            </p>
          ) : null}
        </section>

        <section id="reply" className="reply-editor">
          <h2>{dictionary['forum.writeReply']}</h2>
          <ErrorNotice code={query.error} locale={viewer.preferredLocale} />
          <form
            className="stacked-form"
            action={`/api/discussions/${number}/comments`}
            method="post"
          >
            <input type="hidden" name="csrf" value={csrf} />
            <label className="sr-only" htmlFor="reply-body">
              {dictionary['forum.writeReply']}
            </label>
            <textarea
              id="reply-body"
              name="body"
              rows={8}
              maxLength={20_000}
              required
              placeholder="Markdown…"
            />
            <div className="reply-editor__footer">
              <span>{dictionary['forum.markdownHint']}</span>
              <button className="button button--primary" type="submit">
                {dictionary['forum.reply']}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
