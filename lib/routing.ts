const LEGACY_ATLAS_PREFIX = '/Physics-Atlas-Web';

export function atlasLegacyDestination(
  pathname: string,
  search: string,
  atlasOrigin: string,
): URL {
  const suffix = pathname.slice(LEGACY_ATLAS_PREFIX.length) || '/';
  const destination = new URL(atlasOrigin);
  destination.pathname = suffix;
  destination.search = search;
  return destination;
}

// Compatibility entry points only; all emitted links use canonical project slugs.
const LEGACY_PHYSICA_PATHS: Record<string, string> = {
  '/projects/physics-atlas': '/projects/atlas-physicus',
  '/projects/atlas-physica': '/projects/atlas-physicus',
  '/projects/physica-illuminatio': '/projects/illuminatio-physica',
  '/projects/theatrum-physica': '/projects/theatrum-physicum',
  '/assets/projects/physics-atlas-mark.svg': '/assets/projects/atlas-physicus-mark.svg',
  '/assets/projects/physics-atlas-logo.svg': '/assets/projects/atlas-physicus-logo.svg',
  '/assets/projects/theatrum-physica-mark.svg':
    '/assets/projects/theatrum-physicum-mark.svg',
};

export function canonicalPhysicaPath(pathname: string): string | undefined {
  return LEGACY_PHYSICA_PATHS[pathname.replace(/\/$/, '')];
}
