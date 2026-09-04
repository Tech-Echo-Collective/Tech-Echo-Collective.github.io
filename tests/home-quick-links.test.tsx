import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EchoOrbit, getHomeQuickLinks } from '../components/echo-orbit';
import { getV02Copy } from '../lib/v02-copy';
import type { Locale } from '../lib/types';

function linksFor(locale: Locale, memberNumber = 7) {
  const copy = getV02Copy(locale);
  return {
    label: copy.home.quickLinks,
    links: getHomeQuickLinks(memberNumber, {
      profile: copy.common.profile,
      projects: copy.nav.projects,
      members: copy.nav.members,
      settings: copy.common.settings,
      about: copy.nav.about,
      github: copy.nav.github,
    }),
  };
}

describe('home orbit quick links', () => {
  it('keeps the orbit and Quick Links destinations in one canonical list', () => {
    const { links } = linksFor('en');

    expect(links.map(({ id, symbol, href }) => ({ id, symbol, href }))).toEqual([
      { id: 'profile', symbol: 'ID', href: '/member/7' },
      { id: 'projects', symbol: 'PRJ', href: '/projects' },
      { id: 'members', symbol: 'MEM', href: '/members' },
      { id: 'settings', symbol: 'SET', href: '/settings' },
      { id: 'about', symbol: 'TEC', href: '/about' },
      {
        id: 'github',
        symbol: 'GH',
        href: 'https://github.com/Tech-Echo-Collective',
      },
    ]);
    expect(new Set(links.map((link) => link.symbol))).toHaveLength(6);
  });

  it('renders six named links in each supported interface language', () => {
    for (const locale of ['en', 'zh', 'fr', 'es'] satisfies Locale[]) {
      const { label, links } = linksFor(locale);
      const markup = renderToStaticMarkup(<EchoOrbit links={links} label={label} />);

      expect(links).toHaveLength(6);
      expect(links.every((link) => link.label.length > 0)).toBe(true);
      expect(markup).toContain(`<nav class="echo-orbit" aria-label="${label}">`);
      expect(markup.match(/class="echo-orbit__node /g)).toHaveLength(6);
      for (const link of links) {
        expect(markup).toContain(`href="${link.href}"`);
        expect(markup).toContain(`aria-label="${link.label}"`);
      }
    }
  });
});
