import { ensureDatabase, getD1 } from '@/db';
import { z } from 'zod';
import { getAuthConfig, getForumConfig } from './config';
import { decryptSecret } from './crypto';
import { saveGitHubCredential } from './auth';
import type { GitHubViewer } from './types';

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  error?: string;
  error_description?: string;
}

interface CredentialRow {
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  expires_at: string | null;
  refresh_token_expires_at: string | null;
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly code = 'github_error',
    public readonly status = 502,
  ) {
    super(message);
  }
}

const githubViewerSchema = z.object({
  id: z.number().int().positive(),
  node_id: z.string().min(4).max(128),
  login: z.string().min(1).max(39),
  name: z.string().max(255).nullable(),
  avatar_url: z
    .string()
    .url()
    .refine((value) => {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'avatars.githubusercontent.com';
    }, 'Unexpected GitHub avatar URL.'),
});

async function tokenRequest(parameters: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Tech-Echo-Collective',
    },
    body: parameters,
  });
  const payload = (await response.json()) as TokenResponse;
  if (!response.ok || payload.error || !payload.access_token) {
    const code =
      payload.error === 'unverified_user_email' ? 'unverified_email' : 'oauth_exchange';
    throw new GitHubApiError(
      payload.error_description || 'GitHub authorization could not be completed.',
      code,
      401,
    );
  }
  return payload;
}

export async function exchangeOAuthCode(
  code: string,
  verifier: string,
): Promise<TokenResponse & { access_token: string }> {
  const config = getAuthConfig();
  return (await tokenRequest(
    new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      code_verifier: verifier,
      redirect_uri: `${config.appOrigin}/auth/callback`,
      repository_id: config.repositoryId,
    }),
  )) as TokenResponse & { access_token: string };
}

export async function fetchGitHubViewer(accessToken: string): Promise<GitHubViewer> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Tech-Echo-Collective',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) {
    throw new GitHubApiError(
      'GitHub identity could not be loaded.',
      'github_identity',
      401,
    );
  }
  const parsed = githubViewerSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new GitHubApiError(
      'GitHub returned an invalid identity response.',
      'github_identity',
      502,
    );
  }
  return parsed.data;
}

async function credentialRow(memberId: string): Promise<CredentialRow | null> {
  await ensureDatabase();
  return getD1()
    .prepare(
      `SELECT access_token_encrypted, refresh_token_encrypted, expires_at,
       refresh_token_expires_at FROM github_credentials WHERE member_id = ?`,
    )
    .bind(memberId)
    .first<CredentialRow>();
}

async function refreshAccessToken(memberId: string, row: CredentialRow): Promise<string> {
  const config = getAuthConfig();
  if (!row.refresh_token_encrypted) {
    throw new GitHubApiError('GitHub authorization has expired.', 'reauthorize', 401);
  }
  if (
    row.refresh_token_expires_at &&
    Date.parse(row.refresh_token_expires_at) <= Date.now()
  ) {
    throw new GitHubApiError('GitHub authorization has expired.', 'reauthorize', 401);
  }

  const oldAccessCiphertext = row.access_token_encrypted;
  try {
    const refreshToken = await decryptSecret(
      row.refresh_token_encrypted,
      config.tokenEncryptionKey,
    );
    const refreshed = await tokenRequest(
      new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    );
    await saveGitHubCredential(memberId, {
      accessToken: refreshed.access_token!,
      refreshToken: refreshed.refresh_token,
      tokenType: refreshed.token_type,
      expiresIn: refreshed.expires_in,
      refreshTokenExpiresIn: refreshed.refresh_token_expires_in,
    });
    return refreshed.access_token!;
  } catch (error) {
    try {
      const raced = await credentialRow(memberId);
      if (raced && raced.access_token_encrypted !== oldAccessCiphertext) {
        return await decryptSecret(
          raced.access_token_encrypted,
          config.tokenEncryptionKey,
        );
      }
    } catch {
      // The stable public result below intentionally hides credential material.
    }
    console.warn('GitHub credential refresh requires reauthorization.', {
      stage: 'refresh',
      code: error instanceof GitHubApiError ? error.code : 'credential_error',
    });
    throw new GitHubApiError(
      'GitHub authorization needs to be renewed.',
      'reauthorize',
      401,
    );
  }
}

export async function getUserAccessToken(memberId: string): Promise<string> {
  const row = await credentialRow(memberId);
  if (!row)
    throw new GitHubApiError('GitHub authorization is missing.', 'reauthorize', 401);
  const config = getAuthConfig();
  const refreshThreshold = Date.now() + 5 * 60 * 1000;
  if (row.expires_at && Date.parse(row.expires_at) <= refreshThreshold) {
    return refreshAccessToken(memberId, row);
  }
  try {
    return await decryptSecret(row.access_token_encrypted, config.tokenEncryptionKey);
  } catch {
    console.warn('GitHub credential could not be decrypted.', {
      stage: 'access_token',
      code: 'credential_error',
    });
    throw new GitHubApiError(
      'GitHub authorization needs to be renewed.',
      'reauthorize',
      401,
    );
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; type?: string }>;
}

export async function githubGraphql<T>(
  memberId: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const token = await getUserAccessToken(memberId);
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Tech-Echo-Collective',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = (await response.json()) as GraphQLResponse<T>;
  if (response.status === 401) {
    throw new GitHubApiError(
      'GitHub authorization needs to be renewed.',
      'reauthorize',
      401,
    );
  }
  if (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0') {
    throw new GitHubApiError('GitHub API rate limit exceeded.', 'github_rate_limit', 429);
  }
  if (response.status === 403) {
    throw new GitHubApiError(
      'The GitHub App does not have the required permission.',
      'github_permission',
      403,
    );
  }
  if (!response.ok || payload.errors?.length || !payload.data) {
    throw new GitHubApiError(
      payload.errors?.[0]?.message || 'GitHub Discussions is temporarily unavailable.',
      'github_graphql',
      502,
    );
  }
  return payload.data;
}

export interface GitHubAuthor {
  login: string;
  avatarUrl: string;
  url: string;
  id?: string;
  databaseId?: number;
}

export interface DiscussionCategory {
  id: string;
  name: string;
  description: string | null;
  isAnswerable: boolean;
}

export interface ReactionGroup {
  content: 'THUMBS_UP' | 'HEART' | 'ROCKET' | 'EYES' | string;
  viewerHasReacted: boolean;
  reactors: { totalCount: number };
}

export interface DiscussionSummary {
  id: string;
  number: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  author: GitHubAuthor | null;
  category: { id: string; name: string };
  comments: { totalCount: number };
}

export interface DiscussionComment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  author: GitHubAuthor | null;
  reactionGroups: ReactionGroup[];
}

export interface DiscussionDetail extends DiscussionSummary {
  body: string;
  reactionGroups: ReactionGroup[];
  comments: {
    totalCount: number;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: DiscussionComment[];
  };
}

const authorFragment = `
  author {
    login
    avatarUrl
    url
    ... on User { id databaseId }
  }
`;

const repositoryHeader = `
  id
  databaseId
  nameWithOwner
  hasDiscussionsEnabled
`;

function repositoryVariables(extra: Record<string, unknown> = {}) {
  const config = getForumConfig();
  return { owner: config.owner, repo: config.repository, ...extra };
}

function assertForumRepository(
  repository: {
    databaseId: number;
    nameWithOwner: string;
    hasDiscussionsEnabled: boolean;
  } | null,
) {
  const config = getForumConfig();
  if (
    !repository ||
    String(repository.databaseId) !== config.repositoryId ||
    repository.nameWithOwner !== `${config.owner}/${config.repository}` ||
    !repository.hasDiscussionsEnabled
  ) {
    throw new GitHubApiError(
      'The configured Tech Echo Discussions repository could not be verified.',
      'repository_mismatch',
      503,
    );
  }
}

export async function listForum(
  memberId: string,
  options: { categoryId?: string | null; after?: string | null } = {},
) {
  const data = await githubGraphql<{
    repository: {
      id: string;
      databaseId: number;
      nameWithOwner: string;
      hasDiscussionsEnabled: boolean;
      discussionCategories: { nodes: DiscussionCategory[] };
      discussions: {
        totalCount: number;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: DiscussionSummary[];
      };
    } | null;
  }>(
    memberId,
    `query Forum($owner: String!, $repo: String!, $categoryId: ID, $after: String) {
      repository(owner: $owner, name: $repo) {
        ${repositoryHeader}
        discussionCategories(first: 25) {
          nodes { id name description isAnswerable }
        }
        discussions(first: 25, after: $after, categoryId: $categoryId,
          orderBy: { field: UPDATED_AT, direction: DESC }) {
          totalCount
          pageInfo { hasNextPage endCursor }
          nodes {
            id number title createdAt updatedAt url
            ${authorFragment}
            category { id name }
            comments { totalCount }
          }
        }
      }
    }`,
    repositoryVariables({
      categoryId: options.categoryId || null,
      after: options.after || null,
    }),
  );
  assertForumRepository(data.repository);
  return data.repository!;
}

export async function getDiscussion(memberId: string, number: number) {
  const data = await githubGraphql<{
    repository: {
      databaseId: number;
      nameWithOwner: string;
      hasDiscussionsEnabled: boolean;
      discussion: DiscussionDetail | null;
    } | null;
  }>(
    memberId,
    `query Discussion($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        ${repositoryHeader}
        discussion(number: $number) {
          id number title body createdAt updatedAt url
          ${authorFragment}
          category { id name }
          reactionGroups {
            content viewerHasReacted reactors { totalCount }
          }
          comments(first: 50) {
            totalCount
            pageInfo { hasNextPage endCursor }
            nodes {
              id body createdAt updatedAt url
              ${authorFragment}
              reactionGroups {
                content viewerHasReacted reactors { totalCount }
              }
            }
          }
        }
      }
    }`,
    repositoryVariables({ number }),
  );
  assertForumRepository(data.repository);
  return data.repository!.discussion;
}

export async function listCategories(memberId: string): Promise<{
  repositoryId: string;
  categories: DiscussionCategory[];
}> {
  const data = await githubGraphql<{
    repository: {
      id: string;
      databaseId: number;
      nameWithOwner: string;
      hasDiscussionsEnabled: boolean;
      discussionCategories: { nodes: DiscussionCategory[] };
    } | null;
  }>(
    memberId,
    `query Categories($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        ${repositoryHeader}
        discussionCategories(first: 25) { nodes { id name description isAnswerable } }
      }
    }`,
    repositoryVariables(),
  );
  assertForumRepository(data.repository);
  return {
    repositoryId: data.repository!.id,
    categories: data.repository!.discussionCategories.nodes,
  };
}

export async function createDiscussion(
  memberId: string,
  input: { title: string; body: string; categoryId: string },
) {
  const { repositoryId, categories } = await listCategories(memberId);
  if (!categories.some((category) => category.id === input.categoryId)) {
    throw new GitHubApiError(
      'The selected Discussion category is invalid.',
      'category',
      400,
    );
  }
  const data = await githubGraphql<{
    createDiscussion: { discussion: { number: number; url: string } | null };
  }>(
    memberId,
    `mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
      createDiscussion(input: {
        repositoryId: $repositoryId,
        categoryId: $categoryId,
        title: $title,
        body: $body
      }) { discussion { number url } }
    }`,
    { repositoryId, ...input },
  );
  if (!data.createDiscussion.discussion) {
    throw new GitHubApiError('GitHub did not return the new Discussion.', 'create_failed');
  }
  return data.createDiscussion.discussion;
}

export async function addDiscussionComment(
  memberId: string,
  discussionId: string,
  body: string,
) {
  const data = await githubGraphql<{
    addDiscussionComment: { comment: { id: string; url: string } | null };
  }>(
    memberId,
    `mutation AddComment($discussionId: ID!, $body: String!) {
      addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
        comment { id url }
      }
    }`,
    { discussionId, body },
  );
  return data.addDiscussionComment.comment;
}

export async function changeReaction(
  memberId: string,
  subjectId: string,
  content: string,
  remove: boolean,
) {
  const mutationName = remove ? 'removeReaction' : 'addReaction';
  return githubGraphql(
    memberId,
    `mutation Reaction($subjectId: ID!, $content: ReactionContent!) {
      ${mutationName}(input: { subjectId: $subjectId, content: $content }) {
        subject { id }
      }
    }`,
    { subjectId, content },
  );
}
