import { env } from 'cloudflare:workers';

const defaults = {
  owner: 'Tech-Echo-Collective',
  repository: 'Tech-Echo-Discussion',
  repositoryId: '1293776929',
  founderGithubUserId: '267296498',
};

export function getPublicOrigin(): string {
  const configured = env.APP_ORIGIN?.trim();
  if (!configured) return 'https://tech-echo-collective.github.io';
  try {
    return new URL(configured).origin;
  } catch {
    return 'https://tech-echo-collective.github.io';
  }
}

function required(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`Missing required environment variable: ${name}`);
  return value.trim();
}

export function getForumConfig() {
  return {
    owner: env.GITHUB_DISCUSSIONS_OWNER || defaults.owner,
    repository: env.GITHUB_DISCUSSIONS_REPO || defaults.repository,
    repositoryId: env.GITHUB_DISCUSSIONS_REPOSITORY_ID || defaults.repositoryId,
  };
}

export function getFounderGithubUserId(): string {
  return env.FOUNDER_GITHUB_USER_ID || defaults.founderGithubUserId;
}

export function getAuthConfig() {
  const appOrigin = required(env.APP_ORIGIN, 'APP_ORIGIN').replace(/\/$/, '');
  const origin = new URL(appOrigin);
  if (!['https:', 'http:'].includes(origin.protocol)) {
    throw new Error('APP_ORIGIN must use http or https.');
  }
  const isLocalDevelopment =
    origin.hostname === 'localhost' ||
    origin.hostname === '127.0.0.1' ||
    origin.hostname === '[::1]';
  if (origin.protocol !== 'https:' && !isLocalDevelopment) {
    throw new Error('APP_ORIGIN must use HTTPS outside local development.');
  }
  const sessionSecret = required(env.SESSION_SECRET, 'SESSION_SECRET');
  if (new TextEncoder().encode(sessionSecret).byteLength < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 bytes.');
  }

  return {
    appOrigin: origin.origin,
    clientId: required(env.GITHUB_CLIENT_ID, 'GITHUB_CLIENT_ID'),
    clientSecret: required(env.GITHUB_CLIENT_SECRET, 'GITHUB_CLIENT_SECRET'),
    sessionSecret,
    tokenEncryptionKey: required(env.TOKEN_ENCRYPTION_KEY, 'TOKEN_ENCRYPTION_KEY'),
    ...getForumConfig(),
  };
}

export function isAuthConfigured(): boolean {
  return Boolean(
    env.APP_ORIGIN &&
    env.GITHUB_CLIENT_ID &&
    env.GITHUB_CLIENT_SECRET &&
    env.SESSION_SECRET &&
    env.TOKEN_ENCRYPTION_KEY,
  );
}
