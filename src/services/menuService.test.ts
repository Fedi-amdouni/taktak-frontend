import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchJsonMock } = vi.hoisted(() => ({ fetchJsonMock: vi.fn() }));

vi.mock('./apiClient', () => ({
  API_BASE: '/api',
  fetchJson: fetchJsonMock,
}));

import { menuService } from './menuService';

describe('menuService', () => {
  beforeEach(() => {
    fetchJsonMock.mockReset();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it('affiche le dernier menu connu quand le backend redémarre', async () => {
    const cachedMenu = {
      categories: [{ id: 'hot', name: 'Chauds', sortOrder: 1 }],
      products: [{ id: 'coffee', name: 'Café', price: 3 }],
    };
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({
      savedAt: Date.now(),
      menu: cachedMenu,
    }));
    fetchJsonMock.mockRejectedValue(new Error('cold start'));

    await expect(menuService.getMenu('monastir-lounge')).resolves.toEqual(cachedMenu);
  });
});
