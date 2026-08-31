import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { SafeMarkdown } from '@/components/markdown';
import { ABOUT_SOURCE, getAboutDocument } from '@/lib/about';
import { requireMember } from '@/lib/auth';
import { getV02Copy } from '@/lib/v02-copy';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'About',
  robots: { index: false, follow: false },
};

export default async function AboutPage() {
  const member = await requireMember({ audience: 'account' });
  const copy = getV02Copy(member.preferredLocale);
  const markdown = getAboutDocument(member.preferredLocale);

  return (
    <AppShell member={member} active="about" returnTo="/about">
      <article className="about-page">
        <header className="directory-hero about-hero">
          <div>
            <span className="section-kicker">{copy.aboutPage.eyebrow}</span>
            <h1>{copy.aboutPage.title}</h1>
            <p>{copy.aboutPage.intro}</p>
          </div>
          <a className="about-source-card" href={ABOUT_SOURCE.sourceUrl}>
            <span>{copy.aboutPage.canonicalSource}</span>
            <strong>{ABOUT_SOURCE.repository}</strong>
            <small>{ABOUT_SOURCE.path} ↗</small>
          </a>
        </header>

        <div className="about-source-strip">
          <span>{copy.aboutPage.maintainedDerivative}</span>
          <span>
            {copy.aboutPage.revision} /{' '}
            <a href={ABOUT_SOURCE.revisionUrl}>{ABOUT_SOURCE.commitSha.slice(0, 12)} ↗</a>
          </span>
        </div>

        <SafeMarkdown>{markdown}</SafeMarkdown>
      </article>
    </AppShell>
  );
}
