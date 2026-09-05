import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({ ensureDatabase: vi.fn(), getD1: vi.fn() }));

import { fetchPublicRepositoryContributors } from '../lib/github-public';
import type { ProjectRepository } from '../lib/projects';

const repository: ProjectRepository = {
  owner: 'Tech-Echo-Collective',
  name: 'atlas-physicus',
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
  vi.useRealTimers();
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
      '/repos/Tech-Echo-Collective/atlas-physicus/contributors',
    );
  });

  it('uses an explicit server-only token without changing the endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([contributor(1)]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchPublicRepositoryContributors(repository, 'github_pat_test_value_12345');

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get('Authorization')).toBe(
      'Bearer github_pat_test_value_12345',
    );
    expect(init?.cache).toBe('no-store');
    expect(init?.redirect).toBe('manual');
  });

  it('rejects redirects without forwarding credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: { Location: 'https://example.com/' },
        }),
      ),
    );

    await expect(
      fetchPublicRepositoryContributors(repository, 'github_pat_test_value_12345'),
    ).rejects.toMatchObject({ code: 'redirect' });
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

  it('normalizes fetch failures without leaking upstream error details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('socket detail')));

    await expect(fetchPublicRepositoryContributors(repository)).rejects.toMatchObject({
      code: 'network_fetch',
      message: 'GitHub contributor request could not reach GitHub.',
    });
  });

  it('normalizes response body failures without leaking upstream details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        text: () => Promise.reject(new Error('stream detail')),
      }),
    );

    await expect(fetchPublicRepositoryContributors(repository)).rejects.toMatchObject({
      code: 'network_body',
      message: 'GitHub contributor response could not be read.',
    });
  });

  it('times out a stalled response body', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: URL, init?: RequestInit) =>
        Promise.resolve({
          status: 200,
          text: () =>
            new Promise((_resolve, reject) => {
              init?.signal?.addEventListener('abort', () =>
                reject(new DOMException('Aborted', 'AbortError')),
              );
            }),
        }),
      ),
    );

    const pending = fetchPublicRepositoryContributors(repository);
    const rejection = expect(pending).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(8_000);

    await rejection;
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
