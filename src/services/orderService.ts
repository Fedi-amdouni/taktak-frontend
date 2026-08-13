import { CreateOrderPayload, Order, OrderStatus } from '../types';
import { API_BASE, fetchJson } from './apiClient';

type LocalOrderListener = (order: Order) => void;
const localListeners: LocalOrderListener[] = [];

export function subscribeLocalOrders(listener: LocalOrderListener) {
  localListeners.push(listener);
  return () => {
    const idx = localListeners.indexOf(listener);
    if (idx > -1) localListeners.splice(idx, 1);
  };
}

export function notifyLocalOrderCreated(order: Order) {
  localListeners.forEach((fn) => fn(order));
}

export const orderService = {
  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const order = await fetchJson<Order>(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    notifyLocalOrderCreated(order);
    return order;
  },

  getOrdersByCafe: async (slug: string): Promise<Order[]> => {
    return fetchJson<Order[]>(`${API_BASE}/cafes/${slug}/orders`);
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
    return fetchJson<Order>(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  },

  transferOrderTable: async (orderId: string, newTableNumber: number): Promise<Order> => {
    return fetchJson<Order>(`${API_BASE}/orders/${orderId}/transfer-table`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newTableNumber }),
    });
  },
};
