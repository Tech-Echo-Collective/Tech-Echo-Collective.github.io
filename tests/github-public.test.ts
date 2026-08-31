import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({ ensureDatabase: vi.fn(), getD1: vi.fn() }));

import { fetchPublicRepositoryContributors } from '../lib/github-public';
import type { ProjectRepository } from '../lib/projects';

const repository: ProjectRepository = {
  owner: 'Tech-Echo-Collective',
  name: 'Physics-Atlas',
  label: 'core',
};

function contributor(id: number) {
  return {
    id,
    login: `member-${id}`,
    html_url: `https://github.com/member-${id}`,
    type: 'User',
    contributions: 1,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('public GitHub contributor reader', () => {
  it('uses the public endpoint without credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([contributor(1)]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchPublicRepositoryContributors(repository);

    expect(result).toEqual({ contributors: [contributor(1)], truncated: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).has('Authorization')).toBe(false);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/repos/Tech-Echo-Collective/Physics-Atlas/contributors',
    );
  });

  it('marks a ten-page response as truncated when GitHub still has a next page', async () => {
    const page = Array.from({ length: 100 }, (_, index) => contributor(index + 1));
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(page), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            Link: '<https://api.github.com/example?page=next>; rel="next"',
          },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchPublicRepositoryContributors(repository);

    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(result.contributors).toHaveLength(1000);
    expect(result.truncated).toBe(true);
  });

  it('honors GitHub retry guidance after a rate limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{}', {
          status: 429,
          headers: { 'Retry-After': '120' },
        }),
      ),
    );

    await expect(fetchPublicRepositoryContributors(repository)).rejects.toMatchObject({
      code: 'rate_limit',
      retryAfterMs: 120_000,
    });
  });

  it('rejects contributor profile links outside GitHub', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify([
              { ...contributor(1), html_url: 'https://example.com/member-1' },
            ]),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
    );

    await expect(fetchPublicRepositoryContributors(repository)).rejects.toMatchObject({
      code: 'invalid',
    });
  });
});
