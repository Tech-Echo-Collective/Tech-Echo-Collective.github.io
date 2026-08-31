import { describe, expect, it } from 'vitest';
import { getV02Copy } from '../lib/v02-copy';
import type { Locale } from '../lib/types';

describe('v0.2 interface localization', () => {
  it('keeps the dashboard, navigation and translated motto complete in four languages', () => {
    const locales: Locale[] = ['en', 'zh', 'fr', 'es'];
    for (const locale of locales) {
      const copy = getV02Copy(locale);
      expect(copy.home.build).toBeTruthy();
      expect(copy.home.explore).toBeTruthy();
      expect(copy.home.share).toBeTruthy();
      expect(copy.nav.members).toBeTruthy();
      expect(copy.brandSupport).toBeTruthy();
      expect(copy.projects['physics-atlas'].ownership).toContain('#001');
    }
  });
});
