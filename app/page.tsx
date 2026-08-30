import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ErrorNotice } from '@/components/error-notice';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { getCurrentMember } from '@/lib/auth';
import { getCookieLocale, getDictionary } from '@/lib/i18n';
import { normalizeLocale } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Member Gateway',
  robots: { index: true, follow: true },
};

export default async function GatewayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await getCurrentMember();
  if (member) redirect(member.onboardedAt ? '/home' : '/onboarding');

  const params = await searchParams;
  const cookieLocale = await getCookieLocale();
  const locale = normalizeLocale(params.lang, cookieLocale);
  const dictionary = getDictionary(locale);
  const mode = params.mode === 'join' ? 'join' : 'signin';
  const error = typeof params.error === 'string' ? params.error : undefined;

  return (
    <main id="main-content" className="gateway-shell">
      <section className="gateway-identity" aria-labelledby="gateway-title">
        <div className="gateway-brand">
          <img src="/assets/tech-echo-logo.svg" alt="Tech Echo Collective" />
          <p lang="la">Mementote humilitatis, etiam ex pulvere stellarum nati.</p>
        </div>

        <div className="gateway-statement">
          <span className="technical-label">{dictionary['gateway.eyebrow']}</span>
          <h1 id="gateway-title">
            {dictionary['gateway.statementBefore']}
            <span>{dictionary['gateway.statementAccent']}</span>
            {dictionary['gateway.statementAfter']}
          </h1>
          <p>{dictionary['gateway.support']}</p>
        </div>

        <div className="signal-line" aria-hidden="true">
          <span />
          <code>IDENTITY / COMMUNITY / DISCUSSION</code>
        </div>
      </section>

      <section className="gateway-access" aria-label={dictionary['gateway.continue']}>
        <div className="gateway-access__top">
          <LocaleSwitcher locale={locale} returnTo={`/?mode=${mode}`} compact />
          <span className="live-indicator">
            <i /> {dictionary['status.online']}
          </span>
        </div>

        <div className="auth-panel">
          <nav className="auth-tabs" aria-label={dictionary['gateway.accountAction']}>
            <a
              href={`/?mode=signin&lang=${locale}`}
              aria-current={mode === 'signin' ? 'page' : undefined}
            >
              {dictionary['gateway.signIn']}
            </a>
            <a
              href={`/?mode=join&lang=${locale}`}
              aria-current={mode === 'join' ? 'page' : undefined}
            >
              {dictionary['gateway.join']}
            </a>
          </nav>

          <div className="auth-panel__body">
            <span className="panel-index">TEC / AUTH / 0.1</span>
            <h2>
              {mode === 'join' ? dictionary['gateway.join'] : dictionary['gateway.signIn']}
            </h2>
            <p>
              {mode === 'join'
                ? dictionary['gateway.joinText']
                : dictionary['gateway.signInText']}
            </p>

            <ErrorNotice code={error} locale={locale} />

            <a
              className="github-button"
              href={`/auth/start?intent=${mode}&locale=${locale}`}
              rel="nofollow"
            >
              <strong className="github-glyph" aria-hidden="true">
                GH
              </strong>
              {dictionary['gateway.continue']}
              <span aria-hidden="true">↗</span>
            </a>

            <p className="auth-note">{dictionary['gateway.noPassword']}</p>
          </div>
        </div>

        <footer className="gateway-footer">
          <a href="/privacy">{dictionary['legal.privacyTitle']}</a>
          <a href="/terms">{dictionary['legal.termsTitle']}</a>
          <a href="https://github.com/Tech-Echo-Collective">GitHub</a>
          <span>© 2026 Tech Echo Collective</span>
        </footer>
      </section>
    </main>
  );
}
