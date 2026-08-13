import { Category, Product } from '../types';
import { API_BASE, fetchJson } from './apiClient';

export const menuService = {
  getMenu: async (slug: string): Promise<{ categories: Category[]; products: Product[] }> => {
    return fetchJson<{ categories: Category[]; products: Product[] }>(`${API_BASE}/cafes/${slug}/menu`);
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
