import { FloorObstacle, FloorPlan, TableEntity } from '../types';
import { API_BASE, fetchJson } from './apiClient';

export const tableService = {
  getTablesByCafe: async (slug: string): Promise<TableEntity[]> => {
    return fetchJson<TableEntity[]>(`${API_BASE}/cafes/${slug}/tables`);
  },

  saveTablesBatch: async (slug: string, tables: TableEntity[]): Promise<TableEntity[]> => {
    return fetchJson<TableEntity[]>(`${API_BASE}/cafes/${slug}/tables/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tables),
    });
  },

  getFloorPlans: async (slug: string): Promise<FloorPlan[]> =>
    fetchJson<FloorPlan[]>(`${API_BASE}/cafes/${slug}/floor-plans`),

  createFloorPlan: async (slug: string, plan: Pick<FloorPlan, 'name' | 'width' | 'height'>): Promise<FloorPlan> =>
    fetchJson<FloorPlan>(`${API_BASE}/cafes/${slug}/floor-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    }),

  updateFloorPlan: async (plan: FloorPlan): Promise<FloorPlan> =>
    fetchJson<FloorPlan>(`${API_BASE}/floor-plans/${plan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    }),

  deleteFloorPlan: async (planId: string): Promise<void> =>
    fetchJson<void>(`${API_BASE}/floor-plans/${planId}`, { method: 'DELETE' }),

  getFloorObstacles: async (planId: string): Promise<FloorObstacle[]> =>
    fetchJson<FloorObstacle[]>(`${API_BASE}/floor-plans/${planId}/obstacles`),

  saveFloorObstacles: async (planId: string, obstacles: FloorObstacle[]): Promise<FloorObstacle[]> =>
    fetchJson<FloorObstacle[]>(`${API_BASE}/floor-plans/${planId}/obstacles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obstacles),
    }),

  saveFloorPlanTables: async (planId: string, tables: TableEntity[]): Promise<TableEntity[]> =>
    fetchJson<TableEntity[]>(`${API_BASE}/floor-plans/${planId}/tables`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tables),
    }),

  getTableStatus: async (slug: string, tableNumber: number, sessionToken?: string | null): Promise<{ hasActiveOrders: boolean; gamesAllowed: boolean; sessionValid: boolean; gamesEnabledOverride: boolean | 'AUTO' }> => {
    const tokenQuery = sessionToken ? `?token=${encodeURIComponent(sessionToken)}` : '';
    return fetchJson<{ hasActiveOrders: boolean; gamesAllowed: boolean; sessionValid: boolean; gamesEnabledOverride: boolean | 'AUTO' }>(`${API_BASE}/cafes/${slug}/tables/${tableNumber}/status${tokenQuery}`);
  },

  toggleTableGames: async (slug: string, tableNumber: number, enabled: boolean | null): Promise<TableEntity> =>
    fetchJson<TableEntity>(`${API_BASE}/cafes/${slug}/tables/${tableNumber}/toggle-games`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }),
};
