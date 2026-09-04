import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  exportToken: 'x'.repeat(48),
  fail: false,
  oversized: false,
  createCalls: 0,
}));

vi.mock('@/lib/config', () => ({
  getBackupExportToken: () => state.exportToken,
  getOriginConfig: () => ({ accountOrigin: 'https://techecho.org' }),
}));
vi.mock('@/lib/backup', () => ({
  BACKUP_MAX_BYTES: 2_048,
  createDurableIdentityBackup: async () => {
    state.createCalls += 1;
    if (state.fail) throw new Error('private database detail');
    return {
      format: 'tech-echo-durable-identity-snapshot',
      exportedAt: '2026-09-04T10:00:00.000Z',
      tables: state.oversized ? { data: 's'.repeat(3_000) } : {},
    };
  },
}));

import { POST } from '../app/api/ops/backup/route';

function request(token = state.exportToken, origin = 'https://techecho.org') {
  return new Request(`${origin}/api/ops/backup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

beforeEach(() => {
  state.exportToken = 'x'.repeat(48);
  state.fail = false;
  state.oversized = false;
  state.createCalls = 0;
});

describe('backup route', () => {
  it('rejects missing or incorrect bearer credentials before reading D1', async () => {
    const missing = await POST(
      new Request('https://techecho.org/api/ops/backup', { method: 'POST' }),
    );
    const incorrect = await POST(request('wrong-token'));

    expect(missing.status).toBe(401);
    expect(incorrect.status).toBe(401);
    expect(state.createCalls).toBe(0);
    expect(await missing.json()).toEqual({ status: 'unavailable' });
  });

  it('rejects preview and alternate origins before exporting', async () => {
    const response = await POST(request(state.exportToken, 'https://preview.example'));
    expect(response.status).toBe(421);
    expect(state.createCalls).toBe(0);
  });

  it('returns a private attachment with hardened headers', async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(state.createCalls).toBe(1);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('pragma')).toBe('no-cache');
    expect(response.headers.get('vary')).toBe('Authorization');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin');
    expect(response.headers.get('content-disposition')).toContain(
      'tech-echo-durable-2026-09-04T10-00-00-000Z.json',
    );
  });

  it('returns only a stable error for database failures and oversized output', async () => {
    state.fail = true;
    const failed = await POST(request());
    expect(failed.status).toBe(503);
    expect(await failed.text()).not.toContain('private database detail');

    state.fail = false;
    state.oversized = true;
    const oversized = await POST(request());
    expect(oversized.status).toBe(503);
    expect(await oversized.json()).toEqual({ status: 'unavailable' });
  });
});
