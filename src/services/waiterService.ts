import { Waiter, WaiterPerformance } from '../types';
import { API_BASE, AuthSession, authSession, fetchJson } from './apiClient';

export const waiterService = {
  loginWaiter: async (cafeSlug: string, pinCode: string): Promise<Waiter> => {
    const session = await fetchJson<AuthSession>(`${API_BASE}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeSlug, pinCode }),
    });
    authSession.set(session);
    if (!session.waiter) throw new Error('Session serveur invalide');
    return session.waiter;
  },

  assignWaiterTables: async (waiterId: string, tableNumbers: number[]): Promise<Waiter> => {
    return fetchJson<Waiter>(`${API_BASE}/v1/waiters/${waiterId}/assign-tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumbers }),
    });
  },

  getActiveWaiters: async (cafeSlug: string): Promise<Waiter[]> => {
    return fetchJson<Waiter[]>(`${API_BASE}/v1/cafes/${cafeSlug}/waiters/active`);
  },

  createWaiter: async (cafeSlug: string, waiter: { name: string; pinCode: string; shiftHours?: string }): Promise<Waiter> => {
    return fetchJson<Waiter>(`${API_BASE}/v1/cafes/${cafeSlug}/waiters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(waiter),
    });
  },

  updateWaiter: async (
    waiterId: string,
    payload: { name?: string; pinCode?: string; shiftHours?: string; isActive?: boolean }
  ): Promise<Waiter> => {
    return fetchJson<Waiter>(`${API_BASE}/v1/waiters/${waiterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  deleteWaiter: async (waiterId: string): Promise<void> => {
    return fetchJson<void>(`${API_BASE}/v1/waiters/${waiterId}`, {
      method: 'DELETE',
    });
  },

  getWaiterPerformance: async (
    cafeSlug: string,
    period: 'TODAY' | 'WEEK' | 'MONTH' = 'TODAY'
  ): Promise<WaiterPerformance[]> => {
    return fetchJson<WaiterPerformance[]>(`${API_BASE}/v1/cafes/${cafeSlug}/analytics/waiters?period=${period}`);
  },
};
