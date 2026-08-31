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
