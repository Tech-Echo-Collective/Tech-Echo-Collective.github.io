export type HomeQuickLinkId =
  | 'profile'
  | 'projects'
  | 'members'
  | 'settings'
  | 'about'
  | 'github';

export interface HomeQuickLink {
  id: HomeQuickLinkId;
  symbol: string;
  label: string;
  href: string;
}

type HomeQuickLinkLabels = Record<HomeQuickLinkId, string>;

export function getHomeQuickLinks(
  memberNumber: number,
  labels: HomeQuickLinkLabels,
): HomeQuickLink[] {
  return [
    { id: 'profile', symbol: 'ID', label: labels.profile, href: `/member/${memberNumber}` },
    { id: 'projects', symbol: 'PRJ', label: labels.projects, href: '/projects' },
    { id: 'members', symbol: 'MEM', label: labels.members, href: '/members' },
    { id: 'settings', symbol: 'SET', label: labels.settings, href: '/settings' },
    { id: 'about', symbol: 'TEC', label: labels.about, href: '/about' },
    {
      id: 'github',
      symbol: 'GH',
      label: labels.github,
      href: 'https://github.com/Tech-Echo-Collective',
    },
  ];
}

export function EchoOrbit({ links, label }: { links: HomeQuickLink[]; label: string }) {
  return (
    <nav className="echo-orbit" aria-label={label}>
      <span className="echo-orbit__ring echo-orbit__ring--outer" aria-hidden="true" />
      <span className="echo-orbit__ring echo-orbit__ring--middle" aria-hidden="true" />
      <span className="echo-orbit__ring echo-orbit__ring--inner" aria-hidden="true" />
      <span className="echo-orbit__core" aria-hidden="true">
        <img src="/assets/tech-echo-mark.svg" alt="" />
      </span>
      {links.map((link) => (
        <a
          className={`echo-orbit__node echo-orbit__node--${link.id}`}
          href={link.href}
          aria-label={link.label}
          title={link.label}
          key={link.id}
        >
          <span aria-hidden="true">{link.symbol}</span>
        </a>
      ))}
    </nav>
  );
}
