import { LocaleSwitcher } from './locale-switcher';
import { getCsrfToken } from '@/lib/auth';
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
  const dictionary = getDictionary(member.preferredLocale);
  const csrf = await getCsrfToken();
  const nav = (
    <>
      <a href="/home#about">{dictionary['nav.about']}</a>
      <a href="/home#domains">{dictionary['nav.domains']}</a>
      <a href="/home#projects">{dictionary['nav.projects']}</a>
      <a href="/forum" aria-current={active === 'forum' ? 'page' : undefined}>
        {dictionary['nav.forum']}
      </a>
      <a href="https://github.com/Tech-Echo-Collective">{dictionary['nav.github']}</a>
    </>
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="app-brand" href="/home" aria-label={dictionary['nav.homeLabel']}>
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
              <a href={`/member/${member.memberNumber}`}>{dictionary['nav.profile']}</a>
              <a href="/settings">{dictionary['nav.settings']}</a>
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
