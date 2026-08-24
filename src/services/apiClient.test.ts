import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJson } from './apiClient';

describe('fetchJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('retente une lecture après une erreur transitoire du backend', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('cold start', { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ products: ['cafe'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    vi.stubGlobal('fetch', fetchMock);

    const request = fetchJson<{ products: string[] }>('/api/menu');
    await vi.runAllTimersAsync();

    await expect(request).resolves.toEqual({ products: ['cafe'] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ne retente pas une erreur fonctionnelle 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('missing', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchJson('/api/missing')).rejects.toThrow('API Error: 404');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
