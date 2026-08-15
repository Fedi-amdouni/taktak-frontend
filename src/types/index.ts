export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'SERVED' | 'PAID' | 'ARCHIVED' | 'CANCELLED';

export interface Cafe {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  latitude?: number;
  longitude?: number;
  geofenceRadiusMeters?: number;
  lastKnownWifiIp?: string;
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
  gamesEnabledOverride?: boolean | null;
  sessionToken?: string;
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

export interface ComboSlot {
  id: string;
  title: string; // ex: "Choix de la boisson chaude", "Choix du jus", "Choix de la viennoiserie"
  selectionType: 'CATEGORY' | 'SPECIFIC_PRODUCTS';
  categoryId?: string; // ID of the category dynamically bound (e.g. ID of "Boissons Chaudes")
  allowedProductIds?: string[];
  requiredQuantity: number; // e.g. 1 or 2
  isOptional?: boolean;
}

export type ProductBadge = 'BEST_SELLER' | 'CHEF_SUGGESTION' | 'SPICY' | 'NEW' | 'VEGETARIAN' | 'PROMO' | 'BREAKFAST' | 'COMBO';

export interface Product {
  id: string;
  cafeId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  promoPrice?: number;
  isAvailable: boolean;
  imageUrl?: string;
  optionsJson?: string | ProductOptionGroup[];
  isCombo?: boolean;
  comboSlotsJson?: string | ComboSlot[];
  prepTimeMinutes?: number;
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
  selectedOptions?: Record<string, string>;
  notes?: string;
}

export type OrderPresenceStatus = 'VERIFIED_WIFI' | 'VERIFIED_GPS' | 'UNVERIFIED_LOCATION';

export interface Order {
  id: string;
  cafeId: string;
  tableId: string;
  tableNumber: number;
  status: OrderStatus;
  presenceStatus?: OrderPresenceStatus;
  clientLatitude?: number;
  clientLongitude?: number;
  distanceMeters?: number;
  totalPrice: number;
  couponId?: string;
  discountAmount?: number;
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
    selectedOptions?: Record<string, string>;
    notes?: string;
  }[];
  totalPrice: number;
  couponCode?: string;
  clientLatitude?: number;
  clientLongitude?: number;
}

export interface RewardOption { id?: string; label: string; discountPercent: number; probabilityPercent: number; enabled: boolean; }
export interface RewardCampaign { enabled: boolean; googleReviewUrl?: string; couponValidDays: number; participationCooldownDays: number; minimumOrderAmount: number; options: RewardOption[]; }
export interface CouponReward { code?: string; rewardLabel: string; discountPercent: number; expiresAt: string; googleReviewUrl?: string; }
export interface CouponValidation { valid: boolean; code: string; rewardLabel: string; discountPercent: number; discountAmount: number; finalAmount: number; expiresAt: string; }

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
