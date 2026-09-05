import { describe, expect, it } from 'vitest';
import { ABOUT_SOURCE, getAboutDocument } from '../lib/about';
import type { Locale } from '../lib/types';

describe('README-backed About content', () => {
  it('pins the canonical organization README source and revision', () => {
    expect(ABOUT_SOURCE).toMatchObject({
      repository: 'Tech-Echo-Collective/.github',
      path: 'profile/README.md',
      commitSha: '0df73c22dbcd7a81a3e0ed7834fd2f460b4dbfb1',
      blobSha: '50cb65cbe910274601923e1cadccfb22145a5401',
    });
  });

  it('maintains all four localized derivatives with the required governance model', () => {
    const locales: Locale[] = ['en', 'zh', 'fr', 'es'];
    for (const locale of locales) {
      const document = getAboutDocument(locale);
      expect(document).toContain('Atlas Physicus');
      expect(document).toMatch(/^# Tech Echo Collective/m);
      expect(document.match(/^## /gm)?.length).toBeGreaterThanOrEqual(6);
    }
  });
});
