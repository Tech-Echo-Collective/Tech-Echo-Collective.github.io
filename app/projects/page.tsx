import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { requireMember } from '@/lib/auth';
import { projects } from '@/lib/projects';
import { getV02Copy } from '@/lib/v02-copy';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Projects',
  robots: { index: false, follow: false },
};

export default async function ProjectsPage() {
  const member = await requireMember({ audience: 'account' });
  const copy = getV02Copy(member.preferredLocale);

  return (
    <AppShell member={member} active="projects" returnTo="/projects">
      <div className="directory-page projects-page">
        <header className="directory-hero">
          <div>
            <span className="section-kicker">{copy.projectsPage.eyebrow}</span>
            <h1>{copy.projectsPage.title}</h1>
            <p>{copy.projectsPage.intro}</p>
          </div>
          <span className="directory-count">
            {String(projects.length).padStart(2, '0')} / {copy.projectsPage.projectCount}
          </span>
        </header>

        <div className="projects-directory">
          {projects.map((project, index) => {
            const projectCopy = copy.projects[project.slug];
            return (
              <article className="directory-project-card" key={project.slug}>
                <div className="directory-project-card__visual">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <img src={project.mark} alt="" />
                </div>
                <div className="directory-project-card__copy">
                  <div className="directory-project-card__labels">
                    <span className="project-type-label">
                      {copy.classifications[project.classification]}
                    </span>
                    <span>{copy.common.active}</span>
                  </div>
                  <h2>{projectCopy.name}</h2>
                  <p>{projectCopy.description}</p>
                  <small>{projectCopy.ownership}</small>
                  <div className="directory-project-card__actions">
                    <a
                      className="button button--primary"
                      href={`/projects/${project.slug}`}
                    >
                      {copy.common.viewProject}
                    </a>
                    {project.websiteUrl ? (
                      <a className="button" href={project.websiteUrl}>
                        {project.playable
                          ? copy.common.playOnline
                          : copy.common.visitWebsite}
                      </a>
                    ) : (
                      <a className="button" href={project.repositoryUrl}>
                        {copy.common.viewRepository}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="directory-principle">
          <span className="section-kicker">TEC / OWNERSHIP</span>
          <h2>{copy.projectsPage.principleTitle}</h2>
          <p>{copy.projectsPage.principleText}</p>
        </aside>
      </div>
    </AppShell>
  );
}
