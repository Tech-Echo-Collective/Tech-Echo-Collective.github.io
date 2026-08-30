import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ErrorNotice } from '@/components/error-notice';
import { getCsrfToken, requireMember } from '@/lib/auth';
import { getDictionary } from '@/lib/i18n';
import { formatMemberNumber } from '@/lib/member-number';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Onboarding',
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const member = await requireMember({ onboardingAllowed: true });
  if (member.onboardedAt) redirect('/home');
  const dictionary = getDictionary(member.preferredLocale);
  const csrf = await getCsrfToken();
  const { error } = await searchParams;

  return (
    <main id="main-content" className="onboarding-shell">
      <a className="onboarding-brand" href="/">
        <img src="/assets/tech-echo-logo.svg" alt="Tech Echo Collective" />
      </a>
      <section className="onboarding-panel">
        <span className="section-kicker">{dictionary['onboarding.eyebrow']}</span>
        <h1>{dictionary['onboarding.title']}</h1>
        <div className="identity-card">
          <img src={member.avatarUrl} alt="" />
          <div>
            <strong>{member.displayName}</strong>
            <span>@{member.githubUsername}</span>
          </div>
          <div className="identity-card__number">
            <small>{dictionary['onboarding.member']}</small>
            <b>{formatMemberNumber(member.memberNumber)}</b>
          </div>
        </div>
        <ErrorNotice code={error} locale={member.preferredLocale} />
        <form className="stacked-form" action="/api/onboarding" method="post">
          <input type="hidden" name="csrf" value={csrf} />
          <label htmlFor="onboarding-locale">{dictionary['onboarding.language']}</label>
          <select
            id="onboarding-locale"
            name="locale"
            defaultValue={member.preferredLocale}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
          <button className="button button--primary" type="submit">
            {dictionary['onboarding.enter']} →
          </button>
        </form>
      </section>
      <span className="onboarding-footnote">
        GITHUB ID / {member.githubUserId} · TECH ECHO IDENTITY / PERMANENT
      </span>
    </main>
  );
}
