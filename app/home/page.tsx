import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { requireMember } from '@/lib/auth';
import { getDictionary } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

export default async function HomePage() {
  const member = await requireMember();
  const dictionary = getDictionary(member.preferredLocale);
  const domains = [
    ['science', 'domain.science', 'domain.scienceText'],
    ['engineering', 'domain.engineering', 'domain.engineeringText'],
    ['ai', 'domain.ai', 'domain.aiText'],
    ['open-source', 'domain.openSource', 'domain.openSourceText'],
    ['games', 'domain.games', 'domain.gamesText'],
    ['forum', 'domain.forum', 'domain.forumText'],
  ] as const;

  return (
    <AppShell member={member} active="home" returnTo="/home">
      <section className="home-hero">
        <span className="live-indicator home-hero__status">
          <i /> {dictionary['status.online']}
        </span>
        <h1>
          {dictionary['home.heroBefore']}
          <span>{dictionary['home.heroAccent']}</span>
          {dictionary['home.heroAfter']}
        </h1>
        <p>{dictionary['home.heroText']}</p>
        <div className="button-row">
          <a className="button button--primary" href="/forum">
            {dictionary['home.enterForum']}
          </a>
          <a className="button" href="https://github.com/Tech-Echo-Collective">
            {dictionary['home.openGithub']}
          </a>
        </div>
        <div className="home-hero__telemetry" aria-hidden="true">
          <span>NODE / TEC-{String(member.memberNumber).padStart(3, '0')}</span>
          <span>STATUS / AUTHENTICATED</span>
          <span>FORUM / GITHUB DISCUSSIONS</span>
        </div>
      </section>

      <section id="about" className="content-section two-column-section">
        <div>
          <span className="section-kicker">01 / {dictionary['home.aboutTitle']}</span>
          <h2>{dictionary['home.aboutTitle']}</h2>
          <p className="large-copy">{dictionary['home.aboutText']}</p>
          <blockquote>{dictionary['home.motto']}</blockquote>
        </div>
        <div className="terminal-panel" aria-label="Tech Echo identity summary">
          <div className="terminal-panel__top">
            <span />
            <span />
            <span />
          </div>
          <pre>{`$ tech-echo identity

Type:        loose technical collective
Fields:      Science / Engineering / AI / Games
Method:      Open-source, Discussion-driven
Structure:   Lightweight, Public, Extensible
Community:   One Forum / Four UI Languages

$ output
signal established.`}</pre>
        </div>
      </section>

      <section id="domains" className="content-section">
        <span className="section-kicker">02 / {dictionary['home.domainsTitle']}</span>
        <div className="section-heading-row">
          <h2>{dictionary['home.domainsTitle']}</h2>
          <span>06 ACTIVE FIELDS</span>
        </div>
        <div className="domain-grid">
          {domains.map(([slug, title, body], index) => (
            <article className="domain-card" key={slug}>
              <span className="domain-card__index">0{index + 1}</span>
              <h3>{dictionary[title]}</h3>
              <p>{dictionary[body]}</p>
              <span className="domain-card__line" aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section id="projects" className="content-section">
        <span className="section-kicker">03 / {dictionary['home.projectsTitle']}</span>
        <h2>{dictionary['home.projectsTitle']}</h2>
        <div className="project-grid">
          <article className="project-card project-card--featured">
            <img src="/assets/projects/cradles-of-civilization-mark.svg" alt="" />
            <div>
              <span>GAME STUDIO / ACTIVE</span>
              <h3>{dictionary['project.cradles']}</h3>
              <p>{dictionary['project.cradlesText']}</p>
              <a href="https://github.com/Tech-Echo-Collective/cradles-of-civilization">
                {dictionary['project.view']} ↗
              </a>
            </div>
          </article>
          <article className="project-card">
            <img src="/assets/projects/physics-atlas-mark.svg" alt="" />
            <div>
              <span>SCIENCE / ATLAS</span>
              <h3>{dictionary['project.physics']}</h3>
              <p>{dictionary['project.physicsText']}</p>
              <a href="https://techecho.org/Physics-Atlas-Web/">
                {dictionary['project.view']} ↗
              </a>
            </div>
          </article>
          <article className="project-card">
            <div className="project-placeholder" aria-hidden="true">
              LAB
            </div>
            <div>
              <span>RESEARCH / FUTURE</span>
              <h3>{dictionary['project.labs']}</h3>
              <p>{dictionary['project.labsText']}</p>
            </div>
          </article>
        </div>
      </section>

      <section className="community-band">
        <div>
          <span className="section-kicker">04 / {dictionary['home.communityTitle']}</span>
          <h2>{dictionary['home.communityTitle']}</h2>
          <p>{dictionary['home.communityText']}</p>
        </div>
        <a className="button button--primary" href="/forum">
          {dictionary['home.enterForum']} →
        </a>
      </section>
    </AppShell>
  );
}
