export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'SERVED' | 'PAID' | 'ARCHIVED' | 'CANCELLED';

export interface Cafe {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt?: string;
}

export type TableShape = 'SQUARE' | 'ROUND' | 'RECTANGLE' | 'SOFA';

export interface TableEntity {
  id: string;
  cafeId: string;
  tableNumber: number;
  tableCode?: string;
  zoneName?: string;
  floorPlanId?: string;
  posX: number;
  posY: number;
  width?: number;
  height?: number;
  shape?: TableShape;
  seatsCount?: number;
  rotation?: number;
}

export interface FloorPlan {
  id: string;
  cafeId: string;
  name: string;
  width: number;
  height: number;
  sortOrder: number;
}

export interface FloorObstacle {
  id: string;
  floorPlanId: string;
  label: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
}

export interface Category {
  id: string;
  cafeId: string;
  name: string;
  sortOrder: number;
  categoryIcon?: string;
}

export interface ProductOptionGroup {
  name: string;
  choices: string[];
}

export type ProductBadge = 'BEST_SELLER' | 'CHEF_SUGGESTION' | 'SPICY' | 'NEW' | 'VEGETARIAN' | 'PROMO';

export interface Product {
  id: string;
  cafeId: string;
  categoryId: string;
  name: string;
  price: number;
  promoPrice?: number;
  isAvailable: boolean;
  imageUrl?: string;
  optionsJson?: string | ProductOptionGroup[];
  suggestedProducts?: Product[];
  badge?: ProductBadge;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  selectedOptions: Record<string, string>;
  notes?: string;
  imageUrl?: string;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  cafeId: string;
  tableId: string;
  tableNumber: number;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  tableChangedAlert?: boolean;
}

export interface CreateOrderPayload {
  cafeSlug: string;
  tableNumber: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }[];
  totalPrice: number;
}

export interface TableSession {
  cafeSlug: string;
  tableNumber: number;
  activeOrderId?: string;
  lastUpdated: number;
}

export interface ServiceCall {
  id: string;
  cafeId: string;
  tableNumber: number;
  type: 'BILL' | 'WAITER';
  paymentMethod?: 'CASH' | 'CARD';
  active: boolean;
  createdAt: string;
}

export interface Waiter {
  id: string;
  cafeId: string;
  name: string;
  pinCode?: string;
  shiftHours?: string;
  isActive: boolean;
  assignedTables: number[];
}

export interface WaiterPerformance {
  waiterId: string;
  waiterName: string;
  totalRevenue: number;
  ordersCount: number;
  avgResponseTimeSeconds: number;
  avgFulfillmentTimeMinutes: number;
  totalTips: number;
}

export interface PollOptionItem {
  id: string;
  optionText: string;
  votesCount: number;
  percentage: number;
}

export interface PollData {
  id: string;
  title: string;
  totalVotes: number;
  options: PollOptionItem[];
}

export interface MusicOptionItem {
  id: string;
  title: string;
  genre: string;
  votesCount: number;
}

export interface AmbianceState {
  activePoll: PollData | null;
  musicOptions: MusicOptionItem[];
  userVotedPollOptionId?: string;
  userVotedMusicOptionId?: string;
}
