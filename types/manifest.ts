export type ItemStatus = 'pending' | 'ready' | 'incoming' | 'missing';

export interface ManifestItem {
  id: string; // unique item id in batch
  shopifyLineItemId?: string;
  name: string;
  brand: string;
  brandColor: string;
  size: string;
  sku: string;
  quantity: number;
  inventoryQuantity: number | null;
  suggestReady: boolean;
  status: ItemStatus;
  note: string;
  variantId?: string;
  productId?: string;
}

export interface ManifestOrder {
  id: string; // e.g. "#1001"
  shopifyOrderId?: string;
  customer: string;
  customerEmail?: string;
  items: ManifestItem[];
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
