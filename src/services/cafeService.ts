import { Cafe } from '../types';
import { API_BASE, fetchJson } from './apiClient';

export const cafeService = {
  getAllCafes: async (): Promise<Cafe[]> => {
    return fetchJson<Cafe[]>(`${API_BASE}/cafes`);
  },

  getCafeBySlug: async (slug: string): Promise<Cafe> => {
    return fetchJson<Cafe>(`${API_BASE}/cafes/${slug}`);
  },
};
