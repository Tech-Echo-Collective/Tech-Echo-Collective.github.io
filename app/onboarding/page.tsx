import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ErrorNotice } from '@/components/error-notice';
import { getCurrentMember } from '@/lib/auth';
import { getDictionary } from '@/lib/i18n';
import { getCurrentPendingRegistration, pendingRegistrationCsrf } from '@/lib/registration';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Onboarding',
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; returnTo?: string }>;
}) {
  const member = await getCurrentMember('account');
  if (member) redirect('/home');
  const pending = await getCurrentPendingRegistration();
  if (!pending) redirect('/?mode=join&error=registration_expired');
  const { registration, token } = pending;
  const dictionary = getDictionary(registration.locale);
  const csrf = await pendingRegistrationCsrf(token);
  const { error } = await searchParams;
  const suggestedDisplayName = (registration.viewer.name || registration.viewer.login)
    .trim()
    .slice(0, 80);

  return (
    <main id="main-content" className="onboarding-shell">
      <a className="onboarding-brand" href="/">
        <img src="/assets/tech-echo-logo.svg" alt="Tech Echo Collective" />
      </a>
      <section className="onboarding-panel">
        <span className="section-kicker">{dictionary['onboarding.eyebrow']}</span>
        <h1>{dictionary['onboarding.title']}</h1>
        <div className="identity-card">
          <img src={registration.viewer.avatar_url} alt="" />
          <div>
            <strong>{suggestedDisplayName}</strong>
            <span>@{registration.viewer.login}</span>
          </div>
          <div className="identity-card__number">
            <small>{dictionary['onboarding.member']}</small>
            <b aria-hidden="true">—</b>
            <span>{dictionary['onboarding.numberPending']}</span>
          </div>
        </div>
        <p className="onboarding-disclosure">{dictionary['onboarding.disclosure']}</p>
        <ul className="onboarding-rules">
          <li>{dictionary['onboarding.permanentRule']}</li>
          <li>{dictionary['onboarding.publicRule']}</li>
        </ul>
        <ErrorNotice code={error} locale={registration.locale} />
        <form className="stacked-form" action="/api/onboarding" method="post">
          <input type="hidden" name="csrf" value={csrf} />
          <label htmlFor="onboarding-display-name">
            {dictionary['onboarding.displayName']}
          </label>
          <input
            id="onboarding-display-name"
            name="displayName"
            type="text"
            minLength={1}
            maxLength={80}
            defaultValue={suggestedDisplayName}
            autoComplete="name"
            required
          />
          <label htmlFor="onboarding-locale">{dictionary['onboarding.language']}</label>
          <select id="onboarding-locale" name="locale" defaultValue={registration.locale}>
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
          <label className="consent-control">
            <input type="checkbox" name="confirmMembership" value="yes" required />
            <span>{dictionary['onboarding.confirmation']}</span>
          </label>
          <p className="form-hint onboarding-policy-links">
            <a href="/privacy" target="_blank" rel="noreferrer">
              {dictionary['legal.privacyTitle']}
            </a>
            <span aria-hidden="true">·</span>
            <a href="/terms" target="_blank" rel="noreferrer">
              {dictionary['legal.termsTitle']}
            </a>
          </p>
          <button className="button button--primary" type="submit">
            {dictionary['onboarding.confirmAndJoin']}
          </button>
        </form>
      </section>
      <span className="onboarding-footnote">
        GITHUB ID / {registration.viewer.id} · {dictionary['onboarding.pendingFootnote']}
      </span>
    </main>
  );
}
