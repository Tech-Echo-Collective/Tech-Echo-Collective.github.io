import { describe, expect, it } from 'vitest';
import { normalizeLocale, safeInternalPath } from '../lib/validation';

describe('request validation', () => {
  it('only accepts the four supported locales', () => {
    expect(normalizeLocale('zh')).toBe('zh');
    expect(normalizeLocale('de')).toBe('en');
  });

  it('prevents open redirects', () => {
    expect(safeInternalPath('/forum/12?tab=latest')).toBe('/forum/12?tab=latest');
    expect(safeInternalPath('//evil.example')).toBe('/home');
    expect(safeInternalPath('https://evil.example')).toBe('/home');
  });
});
