import { describe, expect, it } from 'vitest';
import { atlasLegacyDestination } from '../lib/routing';

describe('host routing', () => {
  it('keeps legacy Physics redirects on the Atlas origin', () => {
    const destination = atlasLegacyDestination(
      '/Physics-Atlas-Web//evil.example/path',
      '?source=legacy',
      'https://atlas.techecho.org',
    );

    expect(destination.href).toBe(
      'https://atlas.techecho.org//evil.example/path?source=legacy',
    );
  });
});
