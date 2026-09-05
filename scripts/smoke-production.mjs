const accountOrigin = process.env.TECH_ECHO_ACCOUNT_ORIGIN || 'https://techecho.org';
const forumOrigin = process.env.TECH_ECHO_FORUM_ORIGIN || 'https://forum.techecho.org';
const atlasOrigin = process.env.TECH_ECHO_ATLAS_ORIGIN || 'https://atlas.techecho.org';
const previewHostPattern = /(?:chatgpt\.site|pages\.dev)/i;

async function request(url, options = {}) {
  return fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
    headers: { 'User-Agent': 'Tech-Echo-Production-Smoke/0.2.1' },
    ...options,
  });
}

function requireStatus(response, expected, label) {
  if (!expected.includes(response.status)) {
    throw new Error(`${label} returned HTTP ${response.status}.`);
  }
}

function requireNoPreviewDomain(value, label) {
  if (previewHostPattern.test(value)) {
    throw new Error(`${label} unexpectedly references a preview domain.`);
  }
}

async function checkGateway() {
  const response = await request(`${accountOrigin}/`);
  requireStatus(response, [200], 'Account gateway');
  requireNoPreviewDomain(response.url, 'Account gateway');
  const requiredHeaders = [
    'content-security-policy',
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
  ];
  for (const header of requiredHeaders) {
    if (!response.headers.get(header)) {
      throw new Error(`Account gateway is missing ${header}.`);
    }
  }
  const body = await response.text();
  if (!body.includes('Tech Echo Collective') || !body.includes('Member Gateway')) {
    throw new Error('Account gateway did not return the expected Tech Echo page.');
  }
}

async function checkHealth() {
  const response = await request(`${accountOrigin}/api/health`);
  requireStatus(response, [200], 'Health endpoint');
  const payload = await response.json();
  if (payload?.status !== 'ok') throw new Error('Health endpoint is not ready.');
}

async function checkWwwRedirect() {
  const source = new URL('/ops-smoke?source=scheduled', 'https://www.techecho.org');
  const response = await request(source);
  requireStatus(response, [308], 'WWW redirect');
  const location = response.headers.get('location') || '';
  requireNoPreviewDomain(location, 'WWW redirect');
  const target = new URL(location, source);
  if (
    target.origin !== accountOrigin ||
    target.pathname !== source.pathname ||
    target.search !== source.search
  ) {
    throw new Error('WWW redirect does not preserve the canonical path and query.');
  }
}

async function checkForumEntry() {
  const response = await request(`${forumOrigin}/forum`);
  requireStatus(response, [301, 302, 303, 307, 308], 'Forum entry');
  const location = response.headers.get('location') || '';
  requireNoPreviewDomain(location, 'Forum entry');
  const target = new URL(location, forumOrigin);
  if (
    target.origin !== accountOrigin ||
    target.pathname !== '/auth/forum' ||
    target.searchParams.get('returnTo') !== '/'
  ) {
    throw new Error('Forum entry does not hand authentication to the account origin.');
  }
}

async function checkAtlas() {
  const response = await request(`${atlasOrigin}/`);
  requireStatus(response, [200], 'Atlas Physicus');
  requireNoPreviewDomain(response.url, 'Atlas Physicus');
  const body = await response.text();
  if (!body.includes('Atlas Physicus')) {
    throw new Error('Atlas Physicus did not return the expected site.');
  }
}

const checks = [checkGateway, checkHealth, checkWwwRedirect, checkForumEntry, checkAtlas];

try {
  for (const check of checks) await check();
  console.log('Tech Echo production smoke checks passed.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Production smoke check failed.');
  process.exitCode = 1;
}
