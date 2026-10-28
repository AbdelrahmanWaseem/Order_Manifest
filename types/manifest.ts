export type ItemStatus = 'pending' | 'ready' | 'incoming' | 'missing';

export interface ManifestItem {
  id: string; // unique item id in batch
  shopifyLineItemId?: string;
  name: string;
  brand: string;
  brandColor: string;
  size: string;
  color?: string;
  sku: string;
  quantity: number;
  inventoryQuantity: number | null;
  suggestReady: boolean;
  status: ItemStatus;
  note: string;
  variantId?: string;
  productId?: string;
}

export type OrderSource = 'shopify' | 'manual';

export interface ManifestOrder {
  id: string; // e.g. "#1001" or "MAN-1001"
  shopifyOrderId?: string;
  source: OrderSource;
  customer: string;
  customerPhone?: string;
  customerEmail?: string;
  orderDate?: string; // ISO date string for order date
  createdAt?: string; // ISO creation timestamp
  notes?: string;
  fulfillmentStatus?: string; // e.g. "FULFILLED", "UNFULFILLED", "PARTIALLY_FULFILLED"
  tags?: string[];
  items: ManifestItem[];
}

export type DateFilterPreset = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'prev_month' | 'custom';
export type OrderSourceFilter = 'all' | 'shopify' | 'manual';
export type OrderStatusFilter = 'all' | 'pending' | 'ready' | 'incoming' | 'missing';
export type OrderSortOption = 
  | 'newest'
  | 'oldest'
  | 'customer_asc'
  | 'customer_desc'
  | 'order_number_asc'
  | 'order_number_desc'
  | 'most_items'
  | 'fewest_items';

export interface OrderFilterState {
  searchQuery: string;
  datePreset: DateFilterPreset;
  customStartDate?: string;
  customEndDate?: string;
  customerName?: string;
  customerPhone?: string;
  orderNumber?: string;
  source: OrderSourceFilter;
  status: OrderStatusFilter;
  productName?: string;
  brand?: string;
  size?: string;
  color?: string;
  sku?: string;
  hasMissing?: boolean;
  hasIncoming?: boolean;
  hasReady?: boolean;
  sortBy: OrderSortOption;
}

export interface StockConflict {
  key: string;
  brand: string;
  name: string;
  size: string;
  inventoryQuantity: number | null;
  totalReadyQuantity: number;
  orders: Array<{
    orderId: string;
    customer: string;
    quantity: number;
  }>;
  reason: 'multiple_orders' | 'inventory_exceeded';
}

export interface ReportSnapshot {
  id: string;
  createdAt: string;
  orderCount: number;
  itemCount: number;
  counts: Record<ItemStatus, number>;
  conflicts: StockConflict[];
  orders: ManifestOrder[];
  readyOrderIds: string[];
  brandBreakdown: Record<
    string,
    {
      color: string;
      total: number;
      ready: number;
      incoming: number;
      missing: number;
      pending: number;
    }
  >;
}
