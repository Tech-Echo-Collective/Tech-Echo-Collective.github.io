import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ErrorNotice } from '@/components/error-notice';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { getCurrentMember } from '@/lib/auth';
import { CANONICAL_LATIN_MOTTO } from '@/lib/branding';
import { forumEntryUrl } from '@/lib/config';
import { safeGatewayError, safeGatewayNotice } from '@/lib/gateway-state';
import { getCookieLocale, getDictionary } from '@/lib/i18n';
import { normalizeLocale, safeForumReturnPath } from '@/lib/validation';
import { getV02Copy } from '@/lib/v02-copy';

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
  const params = await searchParams;
  const forumReturnPath =
    params.next === 'forum'
      ? safeForumReturnPath(typeof params.returnTo === 'string' ? params.returnTo : null)
      : undefined;
  const member = await getCurrentMember('account');
  if (member) {
    if (member.onboardedAt && forumReturnPath) redirect(forumEntryUrl(forumReturnPath));
    redirect(member.onboardedAt ? '/home' : '/onboarding');
  }

  const cookieLocale = await getCookieLocale();
  const locale = normalizeLocale(params.lang, cookieLocale);
  const dictionary = getDictionary(locale);
  const siteCopy = getV02Copy(locale);
  const mode = params.mode === 'join' ? 'join' : 'signin';
  const error = safeGatewayError(params.error);
  const notice = safeGatewayNotice(params.notice);
  const continuation = forumReturnPath
    ? `&next=forum&returnTo=${encodeURIComponent(forumReturnPath)}`
    : '';
  const messageContinuation = notice
    ? `&notice=${encodeURIComponent(notice)}`
    : error
      ? `&error=${encodeURIComponent(error)}`
      : '';
  const infoNotice =
    notice === 'account_not_found'
      ? {
          title: dictionary['gateway.joinRequiredTitle'],
          text: dictionary['gateway.joinRequiredText'],
          note: dictionary['gateway.joinRequiredNote'],
        }
      : notice === 'membership_created'
        ? {
            title: dictionary['gateway.membershipCreatedTitle'],
            text: dictionary['gateway.membershipCreatedText'],
            note: dictionary['gateway.membershipCreatedNote'],
          }
        : null;

  return (
    <main id="main-content" className="gateway-shell">
      <section className="gateway-identity" aria-labelledby="gateway-title">
        <div className="gateway-brand">
          <img src="/assets/tech-echo-logo.svg" alt="Tech Echo Collective" />
          <p lang="la">{CANONICAL_LATIN_MOTTO}</p>
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
          <LocaleSwitcher
            locale={locale}
            returnTo={`/?mode=${mode}${continuation}${messageContinuation}`}
            compact
          />
          <span className="live-indicator">
            <i /> {dictionary['status.online']}
          </span>
        </div>

        <div className="auth-panel">
          <nav className="auth-tabs" aria-label={dictionary['gateway.accountAction']}>
            <a
              href={`/?mode=signin&lang=${locale}${continuation}`}
              aria-current={mode === 'signin' ? 'page' : undefined}
            >
              {dictionary['gateway.signIn']}
            </a>
            <a
              href={`/?mode=join&lang=${locale}${continuation}`}
              aria-current={mode === 'join' ? 'page' : undefined}
            >
              {dictionary['gateway.join']}
            </a>
          </nav>

          <div className="auth-panel__body">
            <span className="panel-index">TEC / AUTH / GITHUB</span>
            <h2>
              {mode === 'join' ? dictionary['gateway.join'] : dictionary['gateway.signIn']}
            </h2>
            <p>
              {mode === 'join'
                ? dictionary['gateway.joinText']
                : dictionary['gateway.signInText']}
            </p>

            {infoNotice ? (
              <div className="notice notice--info" role="status">
                <span aria-hidden="true">i</span>
                <div>
                  <strong>{infoNotice.title}</strong>
                  <p>{infoNotice.text}</p>
                  <small>{infoNotice.note}</small>
                </div>
              </div>
            ) : null}

            <ErrorNotice code={error} locale={locale} />

            <a
              className="github-button"
              href={`/auth/start?intent=${mode}&locale=${locale}${continuation}`}
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
          <a href="/games/cradles-of-civilization/">
            {siteCopy.common.playOnline}:{' '}
            {siteCopy.projects['cradles-of-civilization'].name}
          </a>
          <a href="/privacy">{dictionary['legal.privacyTitle']}</a>
          <a href="/terms">{dictionary['legal.termsTitle']}</a>
          <a href="https://github.com/Tech-Echo-Collective">GitHub</a>
          <span>© 2026 Tech Echo Collective</span>
        </footer>
      </section>
    </main>
  );
}
