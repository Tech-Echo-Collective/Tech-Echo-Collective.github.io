import { describe, expect, it } from 'vitest';
import { atlasLegacyDestination, canonicalPhysicaPath } from '../lib/routing';

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

it('redirects old project bookmarks without changing canonical or unrelated paths', () => {
  expect(canonicalPhysicaPath('/projects/physics-atlas')).toBe('/projects/atlas-physicus');
  expect(canonicalPhysicaPath('/projects/theatrum-physica/')).toBe(
    '/projects/theatrum-physicum',
  );
  expect(canonicalPhysicaPath('/projects/physica-illuminatio')).toBe(
    '/projects/illuminatio-physica',
  );
  expect(canonicalPhysicaPath('/assets/projects/theatrum-physica-mark.svg')).toBe(
    '/assets/projects/theatrum-physicum-mark.svg',
  );
  expect(canonicalPhysicaPath('/projects/atlas-physicus')).toBeUndefined();
  expect(canonicalPhysicaPath('/projects/physics-atlas/extra')).toBeUndefined();
});
