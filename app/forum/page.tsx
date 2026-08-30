import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { ForumError } from '@/components/forum-error';
import { MemberByline } from '@/components/member-byline';
import { findMembersByGithubNodeIds, requireMember } from '@/lib/auth';
import { GitHubApiError, listForum } from '@/lib/github';
import { formatRelativeTime, formatReplyLabel, getDictionary } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Forum',
  robots: { index: false, follow: false },
};

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; after?: string; error?: string }>;
}) {
  const member = await requireMember();
  const dictionary = getDictionary(member.preferredLocale);
  const params = await searchParams;
  let forum;
  try {
    forum = await listForum(member.id, {
      categoryId: params.category,
      after: params.after,
    });
  } catch (error) {
    const code =
      error instanceof GitHubApiError && error.code === 'reauthorize'
        ? 'reauthorize'
        : 'github';
    return (
      <AppShell member={member} active="forum" returnTo="/forum">
        <div className="forum-page">
          <ForumError locale={member.preferredLocale} code={code} />
        </div>
      </AppShell>
    );
  }

  const authorIds = forum.discussions.nodes.flatMap((discussion) =>
    discussion.author?.id ? [discussion.author.id] : [],
  );
  const memberMap = await findMembersByGithubNodeIds(authorIds);
  const activeCategory = forum.discussionCategories.nodes.find(
    (category) => category.id === params.category,
  );

  return (
    <AppShell member={member} active="forum" returnTo="/forum">
      <div className="forum-page">
        <header className="forum-hero">
          <div>
            <span className="section-kicker">{dictionary['forum.eyebrow']}</span>
            <h1>{dictionary['forum.title']}</h1>
            <p>{dictionary['forum.intro']}</p>
          </div>
          <a className="button button--primary" href="/forum/new">
            + {dictionary['forum.new']}
          </a>
        </header>

        <nav className="category-filter" aria-label={dictionary['forum.categoryLabel']}>
          <a href="/forum" aria-current={!activeCategory ? 'page' : undefined}>
            {dictionary['forum.all']}
          </a>
          {forum.discussionCategories.nodes.map((category) => (
            <a
              key={category.id}
              href={`/forum?category=${encodeURIComponent(category.id)}`}
              aria-current={activeCategory?.id === category.id ? 'page' : undefined}
            >
              {category.name}
            </a>
          ))}
        </nav>

        {params.error ? (
          <div className="forum-inline-error">
            <ForumError locale={member.preferredLocale} code={params.error} />
          </div>
        ) : null}

        <div className="forum-list" aria-live="polite">
          {forum.discussions.nodes.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__signal" aria-hidden="true">
                ∿
              </span>
              <h2>{dictionary['forum.emptyTitle']}</h2>
              <p>{dictionary['forum.emptyText']}</p>
              <a
                className="button button--primary"
                href={`/forum/new${activeCategory ? `?category=${encodeURIComponent(activeCategory.id)}` : ''}`}
              >
                {dictionary['forum.new']}
              </a>
            </div>
          ) : (
            forum.discussions.nodes.map((discussion) => {
              const authorMember = discussion.author?.id
                ? memberMap.get(discussion.author.id)
                : undefined;
              return (
                <article className="discussion-row" key={discussion.id}>
                  <a className="discussion-row__main" href={`/forum/${discussion.number}`}>
                    <span className="discussion-row__category">
                      {discussion.category.name}
                    </span>
                    <h2>{discussion.title}</h2>
                    <MemberByline
                      author={discussion.author}
                      member={authorMember}
                      locale={member.preferredLocale}
                      timestamp={formatRelativeTime(
                        discussion.updatedAt,
                        member.preferredLocale,
                      )}
                    />
                  </a>
                  <a
                    className="discussion-row__count"
                    href={`/forum/${discussion.number}#replies`}
                  >
                    <strong>{discussion.comments.totalCount}</strong>
                    <span>
                      {formatReplyLabel(
                        discussion.comments.totalCount,
                        member.preferredLocale,
                      )}
                    </span>
                  </a>
                </article>
              );
            })
          )}
        </div>

        {forum.discussions.pageInfo.hasNextPage && forum.discussions.pageInfo.endCursor ? (
          <a
            className="load-more"
            href={`/forum?${activeCategory ? `category=${encodeURIComponent(activeCategory.id)}&` : ''}after=${encodeURIComponent(forum.discussions.pageInfo.endCursor)}`}
          >
            {dictionary['forum.loadMore']} ↓
          </a>
        ) : null}
      </div>
    </AppShell>
  );
}
