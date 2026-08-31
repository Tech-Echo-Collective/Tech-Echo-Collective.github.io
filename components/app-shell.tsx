import { LocaleSwitcher } from './locale-switcher';
import { getCsrfToken, getRequestAudience } from '@/lib/auth';
import { forumEntryUrl, getOriginConfig } from '@/lib/config';
import { getDictionary } from '@/lib/i18n';
import { formatMemberNumber } from '@/lib/member-number';
import type { Member } from '@/lib/types';

export async function AppShell({
  member,
  active,
  returnTo,
  children,
}: {
  member: Member;
  active?: 'home' | 'forum' | 'settings' | 'profile';
  returnTo: string;
  children: React.ReactNode;
}) {
  const audience = await getRequestAudience();
  const { accountOrigin, forumOrigin } = getOriginConfig();
  const dictionary = getDictionary(member.preferredLocale);
  const csrf = await getCsrfToken(audience);
  const forumHref = audience === 'forum' ? forumOrigin : forumEntryUrl('/');
  const nav = (
    <>
      <a href={`${accountOrigin}/home#about`}>{dictionary['nav.about']}</a>
      <a href={`${accountOrigin}/home#domains`}>{dictionary['nav.domains']}</a>
      <a href={`${accountOrigin}/home#projects`}>{dictionary['nav.projects']}</a>
      <a href={forumHref} aria-current={active === 'forum' ? 'page' : undefined}>
        {dictionary['nav.forum']}
      </a>
      <a href="https://github.com/Tech-Echo-Collective">{dictionary['nav.github']}</a>
    </>
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="app-brand"
          href={`${accountOrigin}/home`}
          aria-label={dictionary['nav.homeLabel']}
        >
          <img src="/assets/tech-echo-logo.svg" alt="Tech Echo Collective" />
          <span lang="la">Mementote humilitatis, etiam ex pulvere stellarum nati.</span>
        </a>

        <nav className="desktop-nav" aria-label={dictionary['nav.primaryLabel']}>
          {nav}
        </nav>

        <div className="app-account">
          <LocaleSwitcher locale={member.preferredLocale} returnTo={returnTo} compact />
          <details className="account-menu">
            <summary
              aria-label={`${dictionary['nav.accountLabel']}: ${member.displayName} ${formatMemberNumber(member.memberNumber)}`}
            >
              <img src={member.avatarUrl} alt="" />
              <span>
                <strong>{member.displayName}</strong>
                <small>{formatMemberNumber(member.memberNumber)}</small>
              </span>
            </summary>
            <div className="account-menu__panel">
              <a href={`${accountOrigin}/member/${member.memberNumber}`}>
                {dictionary['nav.profile']}
              </a>
              <a href={`${accountOrigin}/settings`}>{dictionary['nav.settings']}</a>
              <form action="/api/logout" method="post">
                <input type="hidden" name="csrf" value={csrf} />
                <button type="submit">{dictionary['nav.signOut']}</button>
              </form>
            </div>
          </details>
          <details className="mobile-menu">
            <summary aria-label={dictionary['nav.openLabel']}>
              <span />
              <span />
              <span />
            </summary>
            <nav aria-label={dictionary['nav.primaryLabel']}>
              {nav}
              <div className="mobile-nav-locale">
                <LocaleSwitcher
                  locale={member.preferredLocale}
                  returnTo={returnTo}
                  compact
                />
              </div>
            </nav>
          </details>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="app-footer">
        <span>© 2026 Tech Echo Collective</span>
        <span>Science · Engineering · AI · Open Source · Games · Forum</span>
      </footer>
    </div>
  );
}
