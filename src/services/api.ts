import { Cafe, Category, Product, Order, OrderStatus, CreateOrderPayload, ServiceCall, Waiter, WaiterPerformance, AmbianceState, TableEntity, FloorPlan, FloorObstacle } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export interface OwnerAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: { name: string; quantitySold: number; totalRevenue: number }[];
}

// Local listeners array for local fallbacks
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

// Helper for HTTP requests with error handling
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  if (response.status === 24 || response.status === 204) {
    return {} as T;
  }
  return response.json();
}

export const api = {
  // Cafe & Menu
  getAllCafes: async (): Promise<Cafe[]> => {
    return fetchJson<Cafe[]>(`${API_BASE}/cafes`);
  },

  getCafeBySlug: async (slug: string): Promise<Cafe> => {
    return fetchJson<Cafe>(`${API_BASE}/cafes/${slug}`);
  },

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

  // 2D Tables Floor Plan Management
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
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan),
    }),

  updateFloorPlan: async (plan: FloorPlan): Promise<FloorPlan> =>
    fetchJson<FloorPlan>(`${API_BASE}/floor-plans/${plan.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan),
    }),

  deleteFloorPlan: async (planId: string): Promise<void> =>
    fetchJson<void>(`${API_BASE}/floor-plans/${planId}`, { method: 'DELETE' }),

  getFloorObstacles: async (planId: string): Promise<FloorObstacle[]> =>
    fetchJson<FloorObstacle[]>(`${API_BASE}/floor-plans/${planId}/obstacles`),

  saveFloorObstacles: async (planId: string, obstacles: FloorObstacle[]): Promise<FloorObstacle[]> =>
    fetchJson<FloorObstacle[]>(`${API_BASE}/floor-plans/${planId}/obstacles`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obstacles),
    }),

  saveFloorPlanTables: async (planId: string, tables: TableEntity[]): Promise<TableEntity[]> =>
    fetchJson<TableEntity[]>(`${API_BASE}/floor-plans/${planId}/tables`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tables),
    }),

  // Products
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

  // Orders
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

  // Service Calls (Appel Serveur / Demande d'Addition)
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

  // Owner Analytics
  getAnalytics: async (slug: string): Promise<OwnerAnalytics> => {
    return fetchJson<OwnerAnalytics>(`${API_BASE}/cafes/${slug}/analytics`);
  },

  // Waiter & Zoning Management
  loginWaiter: async (cafeSlug: string, pinCode: string): Promise<Waiter> => {
    return fetchJson<Waiter>(`${API_BASE}/v1/cafes/${cafeSlug}/waiters/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinCode }),
    });
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

  updateWaiter: async (waiterId: string, payload: { name?: string; pinCode?: string; shiftHours?: string; isActive?: boolean }): Promise<Waiter> => {
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

  // Waiter Performance Analytics
  getWaiterPerformance: async (cafeSlug: string, period: 'TODAY' | 'WEEK' | 'MONTH' = 'TODAY'): Promise<WaiterPerformance[]> => {
    return fetchJson<WaiterPerformance[]>(`${API_BASE}/v1/cafes/${cafeSlug}/analytics/waiters?period=${period}`);
  },

  // Ambiance & Jukebox
  getActiveAmbiance: async (cafeSlug: string, voterSessionId?: string): Promise<AmbianceState> => {
    const param = voterSessionId ? `?voterSessionId=${voterSessionId}` : '';
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/active${param}`);
  },

  votePoll: async (cafeSlug: string, optionId: string, voterSessionId: string): Promise<AmbianceState> => {
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/vote-poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, voterSessionId }),
    });
  },

  voteMusic: async (cafeSlug: string, optionId: string, voterSessionId: string): Promise<AmbianceState> => {
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/vote-music`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, voterSessionId }),
    });
  },

  createPoll: async (cafeSlug: string, title: string, options: string[]): Promise<AmbianceState> => {
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, options }),
    });
  },

  resetMusicVotes: async (cafeSlug: string): Promise<AmbianceState> => {
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/reset-music`, {
      method: 'PUT',
    });
  },
};
