import { env } from 'cloudflare:workers';
import { CANONICAL_FOUNDER_GITHUB_USER_ID } from './identity';

const defaults = {
  owner: 'Tech-Echo-Collective',
  repository: 'Tech-Echo-Discussion',
  repositoryId: '1293776929',
  accountOrigin: 'https://techecho.org',
  forumOrigin: 'https://forum.techecho.org',
};

export function getPublicOrigin(): string {
  try {
    return getOriginConfig().accountOrigin;
  } catch {
    return defaults.accountOrigin;
  }
}

function required(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`Missing required environment variable: ${name}`);
  return value.trim();
}

function validatedOrigin(value: string, name: string): string {
  const normalized = value.trim().replace(/\/$/, '');
  const origin = new URL(normalized);
  if (origin.origin !== normalized || !['https:', 'http:'].includes(origin.protocol)) {
    throw new Error(`${name} must be an origin without a path.`);
  }
  const isLocalDevelopment =
    origin.hostname === 'localhost' ||
    origin.hostname === '127.0.0.1' ||
    origin.hostname === '[::1]';
  if (origin.protocol !== 'https:' && !isLocalDevelopment) {
    throw new Error(`${name} must use HTTPS outside local development.`);
  }
  return origin.origin;
}

export function getOriginConfig() {
  const accountValue = env.ACCOUNT_ORIGIN || env.APP_ORIGIN || defaults.accountOrigin;
  const forumValue = env.FORUM_ORIGIN || defaults.forumOrigin;
  return {
    accountOrigin: validatedOrigin(accountValue, 'ACCOUNT_ORIGIN'),
    forumOrigin: validatedOrigin(forumValue, 'FORUM_ORIGIN'),
  };
}

export function forumEntryUrl(returnPath = '/'): string {
  const { accountOrigin } = getOriginConfig();
  const url = new URL('/auth/forum', accountOrigin);
  url.searchParams.set('returnTo', returnPath);
  return url.toString();
}

export function getForumConfig() {
  return {
    owner: env.GITHUB_DISCUSSIONS_OWNER || defaults.owner,
    repository: env.GITHUB_DISCUSSIONS_REPO || defaults.repository,
    repositoryId: env.GITHUB_DISCUSSIONS_REPOSITORY_ID || defaults.repositoryId,
  };
}

export function getFounderGithubUserId(): string {
  const configured = env.FOUNDER_GITHUB_USER_ID?.trim();
  if (configured && configured !== CANONICAL_FOUNDER_GITHUB_USER_ID) {
    throw new Error(
      'FOUNDER_GITHUB_USER_ID does not match the permanent founder identity.',
    );
  }
  return CANONICAL_FOUNDER_GITHUB_USER_ID;
}

export function getPublicGitHubReadToken(): string | undefined {
  const token = env.GITHUB_PUBLIC_READ_TOKEN?.trim();
  if (!token) return undefined;
  if (token.length < 20 || token.length > 512 || /[\r\n]/.test(token)) {
    throw new Error('GITHUB_PUBLIC_READ_TOKEN has an invalid format.');
  }
  return token;
}

export function getBackupExportToken(): string {
  const token = required(env.BACKUP_EXPORT_TOKEN, 'BACKUP_EXPORT_TOKEN');
  const byteLength = new TextEncoder().encode(token).byteLength;
  if (byteLength < 32 || byteLength > 256 || /[\r\n]/.test(token)) {
    throw new Error('BACKUP_EXPORT_TOKEN has an invalid format.');
  }
  return token;
}

export function getAuthConfig() {
  const { accountOrigin, forumOrigin } = getOriginConfig();
  const sessionSecret = required(env.SESSION_SECRET, 'SESSION_SECRET');
  if (new TextEncoder().encode(sessionSecret).byteLength < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 bytes.');
  }

  return {
    appOrigin: accountOrigin,
    accountOrigin,
    forumOrigin,
    clientId: required(env.GITHUB_CLIENT_ID, 'GITHUB_CLIENT_ID'),
    clientSecret: required(env.GITHUB_CLIENT_SECRET, 'GITHUB_CLIENT_SECRET'),
    sessionSecret,
    tokenEncryptionKey: required(env.TOKEN_ENCRYPTION_KEY, 'TOKEN_ENCRYPTION_KEY'),
    ...getForumConfig(),
  };
}

export function isAuthConfigured(): boolean {
  return Boolean(
    (env.ACCOUNT_ORIGIN || env.APP_ORIGIN) &&
    env.GITHUB_CLIENT_ID &&
    env.GITHUB_CLIENT_SECRET &&
    env.SESSION_SECRET &&
    env.TOKEN_ENCRYPTION_KEY,
  );
}
