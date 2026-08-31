import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { findMembersByGithubUserIds, requireMember } from '@/lib/auth';
import {
  loadProjectContributorSources,
  mergeRepositoryContributors,
  type ProjectContributor,
} from '@/lib/github-public';
import { formatMemberNumber } from '@/lib/member-number';
import { getProject } from '@/lib/projects';
import { getV02Copy } from '@/lib/v02-copy';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Project',
  robots: { index: false, follow: false },
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const viewer = await requireMember({ audience: 'account' });
  const copy = getV02Copy(viewer.preferredLocale);
  const projectCopy = copy.projects[project.slug];
  let contributors: ProjectContributor[] = [];
  let historyUnavailable = false;
  let historyPartial = false;
  let historyStale = false;
  let sourceIds: string[] = [];
  let sourceResults: Awaited<ReturnType<typeof loadProjectContributorSources>>['results'] =
    [];

  try {
    const sourceData = await loadProjectContributorSources(project);
    sourceResults = sourceData.results;
    historyPartial = sourceData.partial;
    historyStale = sourceData.results.some((result) => result.stale);
    sourceIds = sourceData.results.flatMap((result) =>
      result.contributors.map((contributor) => String(contributor.id)),
    );
  } catch {
    historyUnavailable = true;
  }

  const memberMap = await findMembersByGithubUserIds([
    ...sourceIds,
    ...project.featuredContributors.map((contributor) => contributor.githubUserId),
  ]);
  contributors = mergeRepositoryContributors(sourceResults, memberMap);

  return (
    <AppShell member={viewer} active="projects" returnTo={`/projects/${project.slug}`}>
      <article className="project-detail-page">
        <a className="back-link" href="/projects">
          ← {copy.projectDetail.back}
        </a>

        <header className="project-detail-hero">
          <div className="project-detail-hero__mark">
            <img src={project.mark} alt="" />
          </div>
          <div>
            <div className="project-detail-hero__labels">
              <span className="project-type-label">
                {copy.classifications[project.classification]}
              </span>
              <span>{copy.common.active}</span>
            </div>
            <h1>{projectCopy.name}</h1>
            <p>{projectCopy.description}</p>
            <div className="button-row">
              {project.websiteUrl ? (
                <a className="button button--primary" href={project.websiteUrl}>
                  {copy.common.visitWebsite} ↗
                </a>
              ) : null}
              <a className="button" href={project.repositoryUrl}>
                {copy.common.viewRepository} ↗
              </a>
            </div>
          </div>
        </header>

        <div className="project-detail-grid">
          <section className="project-info-panel">
            <span className="section-kicker">01 / {copy.projectDetail.ownership}</span>
            <h2>{copy.projectDetail.ownership}</h2>
            <p className="project-ownership-statement">{projectCopy.ownership}</p>
            <p>{copy.projectDetail.globalBoundary}</p>
          </section>

          <section className="project-info-panel">
            <span className="section-kicker">02 / {copy.projectDetail.featured}</span>
            <h2>{copy.projectDetail.featured}</h2>
            {project.featuredContributors.length === 0 ? (
              <p>{copy.projectDetail.noFeatured}</p>
            ) : (
              <ul className="featured-contributor-list">
                {project.featuredContributors.map((contributor) => {
                  const matchedMember = memberMap.get(contributor.githubUserId);
                  const githubUsername =
                    matchedMember?.githubUsername ?? contributor.githubUsername;
                  return (
                    <li key={contributor.githubUserId}>
                      <strong>
                        {matchedMember ? (
                          <a href={`/member/${matchedMember.memberNumber}`}>
                            {matchedMember.displayName}{' '}
                            {formatMemberNumber(matchedMember.memberNumber)}
                          </a>
                        ) : (
                          contributor.githubUsername
                        )}
                      </strong>
                      <a href={`https://github.com/${githubUsername}`}>@{githubUsername}</a>
                      <span>{copy.projectRoles[contributor.role]}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <section className="contributors-section">
          <header>
            <div>
              <span className="section-kicker">
                03 / {copy.projectDetail.allContributors}
              </span>
              <h2>{copy.projectDetail.allContributors}</h2>
              <p>{copy.projectDetail.sourceHistory}</p>
            </div>
            {contributors.length > 0 ? (
              <span className="directory-count">
                {String(contributors.length).padStart(2, '0')}
              </span>
            ) : null}
          </header>

          {historyUnavailable ? (
            <p className="contributors-notice">{copy.projectDetail.historyUnavailable}</p>
          ) : (
            <>
              {historyPartial ? (
                <p className="contributors-notice">{copy.projectDetail.historyPartial}</p>
              ) : null}
              {historyStale ? (
                <p className="contributors-notice">{copy.projectDetail.historyStale}</p>
              ) : null}
              <ul className="contributor-history-list">
                {contributors.map((contributor) => (
                  <li key={contributor.githubUserId}>
                    <div>
                      <strong>
                        {contributor.member ? (
                          <a href={`/member/${contributor.member.memberNumber}`}>
                            {contributor.member.displayName}{' '}
                            {formatMemberNumber(contributor.member.memberNumber)}
                          </a>
                        ) : (
                          <a href={contributor.profileUrl}>@{contributor.githubUsername}</a>
                        )}
                      </strong>
                      {contributor.member ? (
                        <a href={contributor.profileUrl}>@{contributor.githubUsername}</a>
                      ) : null}
                    </div>
                    <span>
                      {contributor.automation
                        ? copy.projectDetail.automation
                        : contributor.member
                          ? copy.projectDetail.memberContributor
                          : copy.projectDetail.externalContributor}
                    </span>
                    <small>{contributor.repositories.join(' · ')}</small>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="repositories-section">
          <span className="section-kicker">04 / {copy.projectDetail.repositories}</span>
          <h2>{copy.projectDetail.repositories}</h2>
          <div className="repository-list">
            {project.repositories.map((repository) => (
              <a
                key={repository.name}
                href={`https://github.com/${repository.owner}/${repository.name}`}
              >
                <span>{copy.projectDetail.repositoryLabels[repository.label]}</span>
                <strong>
                  {repository.owner}/{repository.name}
                </strong>
                <small>GitHub ↗</small>
              </a>
            ))}
          </div>
        </section>
      </article>
    </AppShell>
  );
}
