import { API_BASE, fetchJson } from './apiClient';

export interface OwnerAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalTips?: number;
  cancellationRate?: number;
  averageFulfillmentTimeMinutes?: number;
  topProducts: { name: string; quantitySold: number; totalRevenue: number }[];
  hourlyDistribution?: { hour: string; ordersCount: number; revenue: number }[];
  statusBreakdown?: Record<string, number>;
}

export const analyticsService = {
  getAnalytics: async (slug: string): Promise<OwnerAnalytics> => {
    return fetchJson<OwnerAnalytics>(`${API_BASE}/cafes/${slug}/analytics`);
  },
};
