import { Cafe, CafeFeatureSettings } from '../types';
import { API_BASE, fetchJson } from './apiClient';

export const cafeService = {
  getAllCafes: async (): Promise<Cafe[]> => {
    return fetchJson<Cafe[]>(`${API_BASE}/cafes`);
  },

  getCafeBySlug: async (slug: string): Promise<Cafe> => {
    return fetchJson<Cafe>(`${API_BASE}/cafes/${slug}`);
  },

  checkCafeWifi: async (slug: string): Promise<boolean> => {
    try {
      const res = await fetchJson<{ onCafeWifi: boolean }>(`${API_BASE}/cafes/${slug}/check-wifi`);
      return Boolean(res?.onCafeWifi);
    } catch {
      return false;
    }
  },

  updateCafeLocation: async (
    slug: string,
    latitude: number,
    longitude: number,
    geofenceRadiusMeters: number
  ): Promise<Cafe> => {
    return fetchJson<Cafe>(`${API_BASE}/cafes/${slug}/location`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude, geofenceRadiusMeters }),
    });
  },

  updateCafeFeatures: async (slug: string, settings: CafeFeatureSettings): Promise<Cafe> => {
    return fetchJson<Cafe>(`${API_BASE}/cafes/${slug}/features`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },

  sendStaffHeartbeat: async (slug: string): Promise<void> => {
    try {
      await fetchJson(`${API_BASE}/cafes/${slug}/staff-heartbeat`, { method: 'POST' });
    } catch {
      // Non-bloquant, ignore
    }
  },
};
