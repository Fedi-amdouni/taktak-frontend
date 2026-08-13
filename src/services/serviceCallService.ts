import { ServiceCall } from '../types';
import { API_BASE, fetchJson } from './apiClient';

export const serviceCallService = {
  sendServiceCall: async (
    slug: string,
    tableNumber: number,
    type: 'BILL' | 'WAITER',
    paymentMethod?: 'CASH' | 'CARD'
  ): Promise<ServiceCall> => {
    return fetchJson<ServiceCall>(`${API_BASE}/cafes/${slug}/service-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber, type, paymentMethod }),
    });
  },

  getServiceCalls: async (slug: string): Promise<ServiceCall[]> => {
    return fetchJson<ServiceCall[]>(`${API_BASE}/cafes/${slug}/service-calls`);
  },

  dismissServiceCall: async (id: string): Promise<ServiceCall> => {
    return fetchJson<ServiceCall>(`${API_BASE}/service-calls/${id}/dismiss`, {
      method: 'PATCH',
    });
  },
};
