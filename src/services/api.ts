import { authService, authSession, AuthSession } from './authService';
import { cafeService } from './cafeService';
import { menuService } from './menuService';
import { orderService, subscribeLocalOrders, notifyLocalOrderCreated } from './orderService';
import { tableService } from './tableService';
import { serviceCallService } from './serviceCallService';
import { waiterService } from './waiterService';
import { ambianceService } from './ambianceService';
import { analyticsService, OwnerAnalytics } from './analyticsService';

export { authSession, subscribeLocalOrders, notifyLocalOrderCreated };
export type { AuthSession, OwnerAnalytics };

export const api = {
  ...authService,
  ...cafeService,
  ...menuService,
  ...orderService,
  ...tableService,
  ...serviceCallService,
  ...waiterService,
  ...ambianceService,
  ...analyticsService,
};

export default api;
