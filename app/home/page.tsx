import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { requireMember } from '@/lib/auth';
import { AUTHENTICATED_HOME_HERO } from '@/lib/branding';
import { forumEntryUrl } from '@/lib/config';
import { listForum, type DiscussionSummary } from '@/lib/github';
import { formatRelativeTime } from '@/lib/i18n';
import { formatMemberNumber } from '@/lib/member-number';
import { projects } from '@/lib/projects';
import { getV02Copy } from '@/lib/v02-copy';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

export default async function HomePage() {
  const member = await requireMember({ audience: 'account' });
  const copy = getV02Copy(member.preferredLocale);
  let discussions: DiscussionSummary[] = [];
  let activityUnavailable = false;

  try {
    const forum = await listForum(member.id);
    discussions = forum.discussions.nodes.slice(0, 4);
  } catch {
    activityUnavailable = true;
  }

  return (
    <AppShell member={member} active="home" returnTo="/home" layout="dashboard">
      <div className="home-dashboard">
        <div className="dashboard-primary">
          <section className="dashboard-hero" aria-labelledby="dashboard-title">
            <div className="dashboard-hero__copy">
              <span className="dashboard-signal">
                <i /> TEC / MEMBER {formatMemberNumber(member.memberNumber)}
              </span>
              <h1 id="dashboard-title" lang="la" aria-label={AUTHENTICATED_HOME_HERO}>
                <span>Sapere </span>
                <span className="dashboard-hero__accent">Aude.</span>
              </h1>
              <p>{copy.home.intro}</p>
              <div className="button-row">
                <a className="button button--primary" href={forumEntryUrl('/forum')}>
                  <span aria-hidden="true">▣</span> {copy.home.enterForum}
                </a>
                <a className="button" href="/projects">
                  <span aria-hidden="true">◇</span> {copy.home.exploreProjects}
                </a>
              </div>
            </div>

            <div className="echo-orbit" aria-hidden="true">
              <div className="echo-orbit__ring echo-orbit__ring--outer" />
              <div className="echo-orbit__ring echo-orbit__ring--middle" />
              <div className="echo-orbit__ring echo-orbit__ring--inner" />
              <div className="echo-orbit__core">
                <img src="/assets/tech-echo-mark.svg" alt="" />
              </div>
              <span className="echo-orbit__node echo-orbit__node--science">△</span>
              <span className="echo-orbit__node echo-orbit__node--code">&lt;/&gt;</span>
              <span className="echo-orbit__node echo-orbit__node--games">◇</span>
              <span className="echo-orbit__node echo-orbit__node--systems">⬡</span>
            </div>
          </section>

          <section className="featured-projects" aria-labelledby="featured-title">
            <header className="dashboard-section-heading">
              <h2 id="featured-title">◇ {copy.home.featuredProjects}</h2>
              <a href="/projects">{copy.home.viewAllProjects} →</a>
            </header>
            <div className="featured-projects__grid">
              {projects
                .filter((project) => project.featured)
                .map((project) => {
                  const projectCopy = copy.projects[project.slug];
                  return (
                    <article className="dashboard-project-card" key={project.slug}>
                      <img src={project.mark} alt="" />
                      <div>
                        <span className="project-type-label">
                          {copy.classifications[project.classification]}
                        </span>
                        <h3>
                          <a href={`/projects/${project.slug}`}>{projectCopy.name}</a>
                        </h3>
                        <p>{projectCopy.summary}</p>
                        <small>{projectCopy.ownership}</small>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>
        </div>

        <aside className="dashboard-sidebar" aria-label={copy.home.latestActivity}>
          <section className="dashboard-panel activity-panel">
            <header className="dashboard-section-heading">
              <div>
                <h2>∿ {copy.home.latestActivity}</h2>
                <p>{copy.home.latestDiscussions}</p>
              </div>
              <a href={forumEntryUrl('/forum')}>{copy.nav.forum} →</a>
            </header>

            <div className="activity-list">
              {activityUnavailable ? (
                <p className="dashboard-empty">{copy.home.activityUnavailable}</p>
              ) : discussions.length === 0 ? (
                <p className="dashboard-empty">{copy.home.noActivity}</p>
              ) : (
                discussions.map((discussion) => (
                  <a
                    className="activity-item"
                    href={forumEntryUrl(`/forum/${discussion.number}`)}
                    key={discussion.id}
                  >
                    <span className="activity-item__icon" aria-hidden="true">
                      ▣
                    </span>
                    <span className="activity-item__copy">
                      <strong>{discussion.title}</strong>
                      <small>
                        {discussion.category.name} ·{' '}
                        {formatRelativeTime(discussion.updatedAt, member.preferredLocale)}
                      </small>
                    </span>
                  </a>
                ))
              )}
            </div>
          </section>

          <section className="dashboard-panel quick-links-panel">
            <header className="dashboard-section-heading">
              <h2>↗ {copy.home.quickLinks}</h2>
            </header>
            <nav>
              <a href={`/member/${member.memberNumber}`}>○ {copy.common.profile}</a>
              <a href="/projects">◇ {copy.nav.projects}</a>
              <a href="/members">◎ {copy.nav.members}</a>
              <a href="/settings">⌁ {copy.common.settings}</a>
              <a href="/about">≡ {copy.nav.about}</a>
              <a href="https://github.com/Tech-Echo-Collective">GH {copy.nav.github}</a>
            </nav>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
