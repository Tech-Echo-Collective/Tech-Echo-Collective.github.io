import { describe, expect, it } from 'vitest';
import { AUTHENTICATED_HOME_HERO, CANONICAL_LATIN_MOTTO } from '../lib/branding';
import { getV02Copy } from '../lib/v02-copy';
import type { Locale } from '../lib/types';

describe('v0.2 interface localization', () => {
  it('keeps the dashboard and navigation complete in four languages', () => {
    const locales: Locale[] = ['en', 'zh', 'fr', 'es'];
    const localizedIntroductions = new Set<string>();

    for (const locale of locales) {
      const copy = getV02Copy(locale);
      localizedIntroductions.add(copy.home.intro);
      expect(copy.home.intro).toBeTruthy();
      expect(copy.home.enterForum).toBeTruthy();
      expect(copy.home.exploreProjects).toBeTruthy();
      expect(copy.common.playOnline).toBeTruthy();
      expect(copy.nav.members).toBeTruthy();
      expect(copy.projects['atlas-physicus'].ownership).toContain('#001');
      expect(copy.projects['illuminatio-physica']).toMatchObject({
        name: expect.any(String),
        summary: expect.any(String),
        description: expect.any(String),
        ownership: expect.stringContaining('#001'),
      });
      expect(copy).not.toHaveProperty('brandSupport');
      expect(copy.home).not.toHaveProperty('build');
      expect(copy.home).not.toHaveProperty('explore');
      expect(copy.home).not.toHaveProperty('share');
    }

    expect(localizedIntroductions.size).toBe(4);
  });

  it('keeps canonical Latin branding outside the localization system', () => {
    expect(CANONICAL_LATIN_MOTTO).toBe(
      'Mementote humilitatis, etiam ex pulvere stellarum nati.',
    );
    expect(AUTHENTICATED_HOME_HERO).toBe('Sapere Aude.');
  });
});
