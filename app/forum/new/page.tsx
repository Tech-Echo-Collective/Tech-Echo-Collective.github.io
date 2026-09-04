import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { ErrorNotice } from '@/components/error-notice';
import { ForumError } from '@/components/forum-error';
import { getCsrfToken, requireMember } from '@/lib/auth';
import { GitHubApiError, listCategories } from '@/lib/github';
import { getDictionary } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'New Discussion',
  robots: { index: false, follow: false },
};

export default async function NewDiscussionPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; error?: string }>;
}) {
  const member = await requireMember({ audience: 'forum', returnTo: '/forum/new' });
  const dictionary = getDictionary(member.preferredLocale);
  const csrf = await getCsrfToken('forum');
  const params = await searchParams;
  let categories;
  try {
    categories = (await listCategories(member.id)).categories;
  } catch (error) {
    const code =
      error instanceof GitHubApiError && error.code === 'reauthorize'
        ? 'reauthorize'
        : 'github';
    return (
      <AppShell member={member} active="forum" returnTo="/forum/new">
        <div className="forum-page">
          <ForumError locale={member.preferredLocale} code={code} returnTo="/forum/new" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell member={member} active="forum" returnTo="/forum/new">
      <div className="compose-page">
        <a className="back-link" href="/forum">
          {dictionary['forum.back']}
        </a>
        <span className="section-kicker">{dictionary['forum.createKicker']}</span>
        <h1>{dictionary['forum.newTitle']}</h1>
        <ErrorNotice code={params.error} locale={member.preferredLocale} />
        {categories.length === 0 ? (
          <div className="empty-state">
            <h2>{dictionary['forum.noCategories']}</h2>
          </div>
        ) : (
          <form
            className="stacked-form compose-form"
            action="/api/discussions"
            method="post"
          >
            <input type="hidden" name="csrf" value={csrf} />
            <label htmlFor="discussion-title">{dictionary['forum.titleLabel']}</label>
            <input
              id="discussion-title"
              name="title"
              minLength={4}
              maxLength={120}
              required
              autoFocus
            />
            <label htmlFor="discussion-category">{dictionary['forum.categoryLabel']}</label>
            <select
              id="discussion-category"
              name="categoryId"
              defaultValue={params.category || categories[0]?.id}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <label htmlFor="discussion-body">{dictionary['forum.bodyLabel']}</label>
            <textarea
              id="discussion-body"
              name="body"
              rows={16}
              minLength={10}
              maxLength={50_000}
              required
            />
            <p className="form-hint">{dictionary['forum.markdownHint']}</p>
            <div className="button-row">
              <button className="button button--primary" type="submit">
                {dictionary['forum.publish']}
              </button>
              <a className="button" href="/forum">
                {dictionary['common.cancel']}
              </a>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
