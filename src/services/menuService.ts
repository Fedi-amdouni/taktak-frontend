import { Category, Product } from '../types';
import { API_BASE, fetchJson } from './apiClient';

type MenuPayload = { categories: Category[]; products: Product[] };
type CachedMenu = { savedAt: number; menu: MenuPayload };

const MENU_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;
const menuCacheKey = (slug: string) => `taktak_menu_cache_${slug}`;

const readCachedMenu = (slug: string): MenuPayload | null => {
  try {
    const raw = globalThis.localStorage?.getItem(menuCacheKey(slug));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedMenu;
    if (!cached.savedAt || Date.now() - cached.savedAt > MENU_CACHE_MAX_AGE_MS) return null;
    if (!Array.isArray(cached.menu?.categories) || !Array.isArray(cached.menu?.products)) return null;
    return cached.menu;
  } catch {
    return null;
  }
};

const cacheMenu = (slug: string, menu: MenuPayload) => {
  try {
    globalThis.localStorage?.setItem(menuCacheKey(slug), JSON.stringify({ savedAt: Date.now(), menu }));
  } catch {
    // A full or disabled browser storage must never block the live menu.
  }
};

export const menuService = {
  getMenu: async (slug: string): Promise<MenuPayload> => {
    try {
      const menu = await fetchJson<MenuPayload>(`${API_BASE}/cafes/${slug}/menu`);
      cacheMenu(slug, menu);
      return menu;
    } catch (error) {
      const cached = readCachedMenu(slug);
      if (cached) return cached;
      throw error;
    }
  },

  createCategory: async (payload: Pick<Category, 'cafeId' | 'name'> & Partial<Pick<Category, 'sortOrder'>>): Promise<Category> => {
    return fetchJson<Category>(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  saveProduct: async (product: Partial<Product>): Promise<Product> => {
    const isUpdate = !!product.id;
    const url = isUpdate ? `${API_BASE}/products/${product.id}` : `${API_BASE}/products`;
    const method = isUpdate ? 'PUT' : 'POST';

    return fetchJson<Product>(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  },

  toggleProductAvailability: async (productId: string): Promise<Product> => {
    return fetchJson<Product>(`${API_BASE}/products/${productId}/toggle-availability`, {
      method: 'PATCH',
    });
  },
};
