import { z } from 'zod';
import { ensureDatabase, getD1 } from '../db';
import type { ProjectDefinition, ProjectRepository } from './projects';
import type {
  PublicGitHubContributor,
  RepositoryContributorResult,
} from './project-contributors';

export {
  isAutomationContributor,
  mergeRepositoryContributors,
} from './project-contributors';
export type {
  ProjectContributor,
  PublicGitHubContributor,
  RepositoryContributorResult,
} from './project-contributors';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_STALE_MS = 48 * 60 * 60 * 1000;
const DEFAULT_RETRY_MS = 15 * 60 * 1000;
const MAX_RETRY_MS = 6 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_PAGES = 10;
const MAX_CACHE_BYTES = 1_000_000;

const contributorSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1).max(100),
  html_url: z
    .string()
    .url()
    .refine((value) => {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'github.com';
    }, 'Unexpected GitHub contributor URL.'),
  type: z.string().min(1).max(40),
  contributions: z.number().int().nonnegative(),
});

const contributorListSchema = z.array(contributorSchema).max(1000);
const contributorPayloadSchema = z.object({
  contributors: contributorListSchema,
  truncated: z.boolean(),
});

export type ContributorPayload = z.infer<typeof contributorPayloadSchema>;

interface ContributorCacheRow {
  payload_json: string;
  fetched_at: string;
  expires_at: string;
  next_retry_at: string | null;
}

export class PublicGitHubError extends Error {
  constructor(
    message: string,
    public readonly code = 'github_public_error',
    public readonly retryAfterMs = DEFAULT_RETRY_MS,
  ) {
    super(message);
  }
}

type ContributorLogStage =
  | 'cache_read'
  | 'cache_write'
  | 'cache_delete'
  | 'cache_defer'
  | 'fetch'
  | 'refresh';

function repositoryKey(repository: ProjectRepository): string {
  return `${repository.owner}/${repository.name}`;
}

function logContributorIssue(
  repository: ProjectRepository,
  stage: ContributorLogStage,
  code: string,
  staleServed = false,
): void {
  console.warn('[tech-echo:contributors] GitHub source unavailable', {
    repository: repositoryKey(repository),
    stage,
    code,
    staleServed,
  });
}

function parseCachedContributors(
  row: ContributorCacheRow | null,
): ContributorPayload | null {
  if (!row || row.payload_json.length > MAX_CACHE_BYTES) return null;
  try {
    const value: unknown = JSON.parse(row.payload_json);
    const parsed = contributorPayloadSchema.safeParse(value);
    if (parsed.success) return parsed.data;

    // Accept the short-lived preview cache format created before v0.2 shipped.
    const legacy = contributorListSchema.safeParse(value);
    return legacy.success ? { contributors: legacy.data, truncated: false } : null;
  } catch {
    return null;
  }
}

async function readContributorCache(
  repository: ProjectRepository,
): Promise<ContributorCacheRow | null> {
  await ensureDatabase();
  return getD1()
    .prepare(
      `SELECT payload_json, fetched_at, expires_at, next_retry_at
       FROM github_contributor_cache WHERE repository_key = ?`,
    )
    .bind(repositoryKey(repository))
    .first<ContributorCacheRow>();
}

async function writeContributorCache(
  repository: ProjectRepository,
  result: ContributorPayload,
): Promise<void> {
  const payload = JSON.stringify(result);
  if (new TextEncoder().encode(payload).byteLength > MAX_CACHE_BYTES) {
    throw new PublicGitHubError('GitHub contributor response is too large.', 'payload');
  }
  const fetchedAt = new Date();
  const expiresAt = new Date(fetchedAt.getTime() + CACHE_TTL_MS);
  await getD1()
    .prepare(
      `INSERT INTO github_contributor_cache
       (repository_key, payload_json, fetched_at, expires_at, next_retry_at)
       VALUES (?, ?, ?, ?, NULL)
       ON CONFLICT(repository_key) DO UPDATE SET
         payload_json = excluded.payload_json,
         fetched_at = excluded.fetched_at,
         expires_at = excluded.expires_at,
         next_retry_at = NULL`,
    )
    .bind(
      repositoryKey(repository),
      payload,
      fetchedAt.toISOString(),
      expiresAt.toISOString(),
    )
    .run();
}

async function deleteContributorCache(repository: ProjectRepository): Promise<void> {
  await getD1()
    .prepare('DELETE FROM github_contributor_cache WHERE repository_key = ?')
    .bind(repositoryKey(repository))
    .run();
}

async function deferContributorRefresh(
  repository: ProjectRepository,
  retryAfterMs: number,
): Promise<void> {
  const delay = Math.min(Math.max(retryAfterMs, 60_000), MAX_RETRY_MS);
  await getD1()
    .prepare(
      `UPDATE github_contributor_cache SET next_retry_at = ?
       WHERE repository_key = ?`,
    )
    .bind(new Date(Date.now() + delay).toISOString(), repositoryKey(repository))
    .run();
}

function responseRetryDelay(response: Response, fallback: number): number {
  const retryAfterSeconds = Number(response.headers.get('retry-after'));
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }
  const resetSeconds = Number(response.headers.get('x-ratelimit-reset'));
  if (Number.isFinite(resetSeconds) && resetSeconds > 0) {
    return Math.max(resetSeconds * 1000 - Date.now(), fallback);
  }
  return fallback;
}

async function fetchPublicGitHubPage(
  url: URL,
  accessToken?: string,
): Promise<{ response: Response; body: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Tech-Echo-Collective',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // Keep credentials on api.github.com while letting Workers expose any
      // unexpected redirect as a response we can reject without following it.
      redirect: 'manual',
      headers,
    });
    if (response.status !== 200) return { response, body: null };
    try {
      return { response, body: await response.json() };
    } catch (error) {
      if (controller.signal.aborted) throw error;
      if (!(error instanceof SyntaxError)) {
        throw new PublicGitHubError(
          'GitHub contributor response could not be read.',
          'network',
        );
      }
      throw new PublicGitHubError('GitHub returned invalid contributor data.', 'invalid');
    }
  } catch (error) {
    if (error instanceof PublicGitHubError) throw error;
    if (controller.signal.aborted) {
      throw new PublicGitHubError('GitHub contributor request timed out.', 'timeout');
    }
    throw new PublicGitHubError(
      'GitHub contributor request could not reach GitHub.',
      'network',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPublicRepositoryContributors(
  repository: ProjectRepository,
  accessToken?: string,
): Promise<ContributorPayload> {
  const contributors: PublicGitHubContributor[] = [];
  let truncated = false;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(
      `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/contributors`,
    );
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));
    const { response, body } = await fetchPublicGitHubPage(url, accessToken);
    if (response.status === 204) return { contributors: [], truncated: false };
    if (response.status === 202) {
      throw new PublicGitHubError(
        'GitHub is calculating contributor data.',
        'pending',
        responseRetryDelay(response, 5 * 60 * 1000),
      );
    }
    if (response.status === 403 || response.status === 429) {
      throw new PublicGitHubError(
        'GitHub contributor rate limit reached.',
        'rate_limit',
        responseRetryDelay(response, 30 * 60 * 1000),
      );
    }
    if (!response.ok) {
      throw new PublicGitHubError(
        'GitHub contributor data could not be loaded.',
        `status_${response.status}`,
        response.status === 404 ? 60 * 60 * 1000 : DEFAULT_RETRY_MS,
      );
    }
    const parsed = contributorListSchema.safeParse(body);
    if (!parsed.success) {
      throw new PublicGitHubError('GitHub returned invalid contributor data.', 'invalid');
    }
    contributors.push(...parsed.data);
    const hasNextPage = /<[^>]+>;\s*rel="next"/.test(response.headers.get('link') || '');
    if (page === MAX_PAGES && hasNextPage) truncated = true;
    if (parsed.data.length < 100 || !hasNextPage) break;
  }
  return contributorPayloadSchema.parse({ contributors, truncated });
}

export async function listPublicRepositoryContributors(
  repository: ProjectRepository,
  accessToken?: string,
): Promise<RepositoryContributorResult> {
  let cachedRow: ContributorCacheRow | null = null;
  try {
    cachedRow = await readContributorCache(repository);
  } catch {
    logContributorIssue(repository, 'cache_read', 'storage');
  }
  const cached = parseCachedContributors(cachedRow);
  const now = Date.now();
  const fetchedAt = cachedRow ? Date.parse(cachedRow.fetched_at) : Number.NaN;
  const withinStaleWindow =
    cached !== null && Number.isFinite(fetchedAt) && now - fetchedAt <= MAX_STALE_MS;

  if (cached && cachedRow && withinStaleWindow) {
    if (Date.parse(cachedRow.expires_at) > now) {
      return { repository, ...cached, stale: false };
    }
    if (cachedRow.next_retry_at && Date.parse(cachedRow.next_retry_at) > now) {
      return { repository, ...cached, stale: true };
    }
  } else if (cachedRow) {
    try {
      await deleteContributorCache(repository);
    } catch {
      logContributorIssue(repository, 'cache_delete', 'storage');
    }
  }

  try {
    const result = await fetchPublicRepositoryContributors(repository, accessToken);
    try {
      await writeContributorCache(repository, result);
    } catch {
      // Fresh public data remains useful even if the short-lived cache cannot write.
      logContributorIssue(repository, 'cache_write', 'storage');
    }
    return { repository, ...result, stale: false };
  } catch (error) {
    if (cached && withinStaleWindow) {
      logContributorIssue(
        repository,
        'refresh',
        error instanceof PublicGitHubError ? error.code : 'unknown',
        true,
      );
      try {
        await deferContributorRefresh(
          repository,
          error instanceof PublicGitHubError ? error.retryAfterMs : DEFAULT_RETRY_MS,
        );
      } catch {
        // Serving bounded stale data is still safer than failing the full page.
        logContributorIssue(repository, 'cache_defer', 'storage', true);
      }
      return { repository, ...cached, stale: true };
    }
    throw error;
  }
}

export async function loadProjectContributorSources(
  project: ProjectDefinition,
  accessToken?: string,
): Promise<{ results: RepositoryContributorResult[]; partial: boolean }> {
  const settled = await Promise.allSettled(
    project.repositories.map((repository) =>
      listPublicRepositoryContributors(repository, accessToken),
    ),
  );
  const results = settled.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
  settled.forEach((result, index) => {
    if (result.status === 'rejected') {
      logContributorIssue(
        project.repositories[index],
        'fetch',
        result.reason instanceof PublicGitHubError ? result.reason.code : 'unknown',
      );
    }
  });
  if (results.length === 0 && settled.length > 0) {
    throw new PublicGitHubError('Project contributor data is unavailable.', 'unavailable');
  }
  return {
    results,
    partial:
      results.length !== project.repositories.length ||
      results.some((result) => result.truncated),
  };
}
