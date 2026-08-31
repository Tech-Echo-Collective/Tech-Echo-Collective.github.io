import { LocaleSwitcher } from './locale-switcher';
import { getCsrfToken, getRequestAudience } from '@/lib/auth';
import { forumEntryUrl, getOriginConfig } from '@/lib/config';
import { getDictionary } from '@/lib/i18n';
import { formatMemberNumber } from '@/lib/member-number';
import type { Member } from '@/lib/types';
import { getV02Copy } from '@/lib/v02-copy';

type ActivePage =
  | 'home'
  | 'projects'
  | 'forum'
  | 'members'
  | 'about'
  | 'settings'
  | 'profile';

export async function AppShell({
  member,
  active,
  returnTo,
  layout = 'default',
  children,
}: {
  member: Member;
  active?: ActivePage;
  returnTo: string;
  layout?: 'default' | 'dashboard';
  children: React.ReactNode;
}) {
  const audience = await getRequestAudience();
  const { accountOrigin, forumOrigin } = getOriginConfig();
  const dictionary = getDictionary(member.preferredLocale);
  const copy = getV02Copy(member.preferredLocale);
  const csrf = await getCsrfToken(audience);
  const forumHref = audience === 'forum' ? `${forumOrigin}/forum` : forumEntryUrl('/forum');
  const navItems: Array<{
    key: Exclude<ActivePage, 'settings' | 'profile'> | 'github';
    href: string;
    label: string;
  }> = [
    { key: 'home', href: `${accountOrigin}/home`, label: copy.nav.home },
    { key: 'projects', href: `${accountOrigin}/projects`, label: copy.nav.projects },
    { key: 'forum', href: forumHref, label: copy.nav.forum },
    { key: 'members', href: `${accountOrigin}/members`, label: copy.nav.members },
    { key: 'about', href: `${accountOrigin}/about`, label: copy.nav.about },
    {
      key: 'github',
      href: 'https://github.com/Tech-Echo-Collective',
      label: copy.nav.github,
    },
  ];
  const nav = navItems.map((item) => (
    <a
      key={item.key}
      href={item.href}
      aria-current={active === item.key ? 'page' : undefined}
    >
      {item.label}
    </a>
  ));

  return (
    <div className={`app-shell app-shell--${layout}`}>
      <header className="app-header">
        <a
          className="app-brand"
          href={`${accountOrigin}/home`}
          aria-label={dictionary['nav.homeLabel']}
        >
          <img src="/assets/tech-echo-logo.svg" alt="Tech Echo Collective" />
          <span className="app-brand__motto" lang="la">
            Mementote humilitatis, etiam ex pulvere stellarum nati.
          </span>
          <small>{copy.brandSupport}</small>
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
        <nav aria-label="Legal">
          <a href={`${accountOrigin}/privacy`}>{copy.common.privacy}</a>
          <a href={`${accountOrigin}/terms`}>{copy.common.terms}</a>
          <span>WEB / 0.2</span>
        </nav>
      </footer>
    </div>
  );
}
