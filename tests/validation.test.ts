import { describe, expect, it } from 'vitest';
import { normalizeLocale, safeForumReturnPath, safeInternalPath } from '../lib/validation';

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

  it('limits forum handoffs to real forum pages', () => {
    expect(safeForumReturnPath('/')).toBe('/');
    expect(safeForumReturnPath('/forum?category=abc')).toBe('/forum?category=abc');
    expect(safeForumReturnPath('/forum/new')).toBe('/forum/new');
    expect(safeForumReturnPath('/forum/42#replies')).toBe('/forum/42#replies');

    for (const malicious of [
      'https://evil.example',
      '//evil.example',
      '/%2f%2fevil.example',
      '/%252f%252fevil.example',
      '/\\evil.example',
      '/auth/handoff',
      '/api/discussions',
      '/forum/0',
      '/forum/not-a-number',
      '/forum/1\r\nX-Test: injected',
    ]) {
      expect(safeForumReturnPath(malicious)).toBe('/');
    }
  });
});
