import { ManifestOrder, OrderFilterState } from '@/types/manifest';

export const INITIAL_FILTER_STATE: OrderFilterState = {
  searchQuery: '',
  datePreset: 'all',
  source: 'all',
  status: 'all',
  sortBy: 'newest',
};

/**
 * Check if an ISO date string falls into a given preset or custom date range
 */
export function matchesDatePreset(
  dateString?: string,
  preset: OrderFilterState['datePreset'] = 'all',
  customStart?: string,
  customEnd?: string
): boolean {
  if (preset === 'all' && !customStart && !customEnd) return true;
  if (!dateString) return false;

  const orderDate = new Date(dateString);
  if (isNaN(orderDate.getTime())) return false;

  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(now);
  const orderDayStart = startOfDay(orderDate);

  switch (preset) {
    case 'today':
      return orderDayStart.getTime() === todayStart.getTime();

    case 'yesterday': {
      const yesterday = new Date(todayStart);
      yesterday.setDate(yesterday.getDate() - 1);
      return orderDayStart.getTime() === yesterday.getTime();
    }

    case '7days': {
      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return orderDate >= sevenDaysAgo && orderDate <= now;
    }

    case '30days': {
      const thirtyDaysAgo = new Date(todayStart);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return orderDate >= thirtyDaysAgo && orderDate <= now;
    }

    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return orderDate >= startOfMonth && orderDate <= now;
    }

    case 'prev_month': {
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return orderDate >= startOfPrevMonth && orderDate <= endOfPrevMonth;
    }

    case 'custom': {
      if (customStart) {
        const start = new Date(customStart);
        if (!isNaN(start.getTime()) && orderDate < start) return false;
      }
      if (customEnd) {
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        if (!isNaN(end.getTime()) && orderDate > end) return false;
      }
      return true;
    }

    default:
      return true;
  }
}

/**
 * Filter and sort manifest orders according to comprehensive filter state
 */
export function filterAndSortOrders(
  orders: ManifestOrder[],
  filters: OrderFilterState
): ManifestOrder[] {
  const filtered = orders.filter((order) => {
    // 1. Global Search Query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      const matchesCustomer = order.customer.toLowerCase().includes(q);
      const matchesOrderId = order.id.toLowerCase().includes(q);
      const matchesPhone = order.customerPhone ? order.customerPhone.toLowerCase().includes(q) : false;
      const matchesNotes = order.notes ? order.notes.toLowerCase().includes(q) : false;
      const matchesItems = order.items.some((it) => {
        return (
          it.name.toLowerCase().includes(q) ||
          it.brand.toLowerCase().includes(q) ||
          it.size.toLowerCase().includes(q) ||
          (it.color && it.color.toLowerCase().includes(q)) ||
          it.sku.toLowerCase().includes(q)
        );
      });

      if (!matchesCustomer && !matchesOrderId && !matchesPhone && !matchesNotes && !matchesItems) {
        return false;
      }
    }

    // 2. Date Filter
    const effectiveDate = order.orderDate || order.createdAt;
    if (!matchesDatePreset(effectiveDate, filters.datePreset, filters.customStartDate, filters.customEndDate)) {
      return false;
    }

    // 3. Customer Specific Name Filter
    if (filters.customerName?.trim()) {
      const q = filters.customerName.trim().toLowerCase();
      if (!order.customer.toLowerCase().includes(q)) return false;
    }

    // 4. Customer Phone Filter
    if (filters.customerPhone?.trim()) {
      const q = filters.customerPhone.trim().toLowerCase();
      if (!order.customerPhone || !order.customerPhone.toLowerCase().includes(q)) return false;
    }

    // 5. Order Number Filter (exact or partial)
    if (filters.orderNumber?.trim()) {
      const q = filters.orderNumber.trim().toLowerCase().replace(/^#/, '');
      const orderIdClean = order.id.toLowerCase().replace(/^#/, '');
      if (!orderIdClean.includes(q)) return false;
    }

    // 6. Source Filter ('all' | 'shopify' | 'manual')
    if (filters.source !== 'all') {
      const orderSource = order.source || (order.id.startsWith('MAN-') ? 'manual' : 'shopify');
      if (orderSource !== filters.source) return false;
    }

    // 7. Order Status Filter ('all' | 'ready' | 'incoming' | 'missing')
    if (filters.status !== 'all') {
      const hasMatchingStatus = order.items.some((it) => it.status === filters.status);
      if (!hasMatchingStatus) return false;
    }

    // 8. Product Filters (name, brand, size, color, SKU)
    if (filters.productName?.trim()) {
      const q = filters.productName.trim().toLowerCase();
      if (!order.items.some((it) => it.name.toLowerCase().includes(q))) return false;
    }

    if (filters.brand?.trim()) {
      const q = filters.brand.trim().toLowerCase();
      if (!order.items.some((it) => it.brand.toLowerCase().includes(q))) return false;
    }

    if (filters.size?.trim()) {
      const q = filters.size.trim().toLowerCase();
      if (!order.items.some((it) => it.size.toLowerCase() === q)) return false;
    }

    if (filters.color?.trim()) {
      const q = filters.color.trim().toLowerCase();
      if (!order.items.some((it) => it.color && it.color.toLowerCase().includes(q))) return false;
    }

    if (filters.sku?.trim()) {
      const q = filters.sku.trim().toLowerCase();
      if (!order.items.some((it) => it.sku.toLowerCase().includes(q))) return false;
    }

    // 9. Quick Filters
    if (filters.hasMissing && !order.items.some((it) => it.status === 'missing')) {
      return false;
    }

    if (filters.hasIncoming && !order.items.some((it) => it.status === 'incoming')) {
      return false;
    }

    if (filters.hasReady && !order.items.some((it) => it.status === 'ready')) {
      return false;
    }

    return true;
  });

  // Sorting
  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest': {
        const dateA = new Date(a.orderDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.orderDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      }

      case 'oldest': {
        const dateA = new Date(a.orderDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.orderDate || b.createdAt || 0).getTime();
        return dateA - dateB;
      }

      case 'customer_asc':
        return a.customer.localeCompare(b.customer);

      case 'customer_desc':
        return b.customer.localeCompare(a.customer);

      case 'order_number_asc':
        return a.id.localeCompare(b.id, undefined, { numeric: true });

      case 'order_number_desc':
        return b.id.localeCompare(a.id, undefined, { numeric: true });

      case 'most_items': {
        const countA = a.items.reduce((acc, i) => acc + i.quantity, 0);
        const countB = b.items.reduce((acc, i) => acc + i.quantity, 0);
        return countB - countA;
      }

      case 'fewest_items': {
        const countA = a.items.reduce((acc, i) => acc + i.quantity, 0);
        const countB = b.items.reduce((acc, i) => acc + i.quantity, 0);
        return countA - countB;
      }

      default:
        return 0;
    }
  });
}

/**
 * Count active filters applied excluding default sortBy
 */
export function countActiveFilters(filters: OrderFilterState): number {
  let count = 0;
  if (filters.datePreset !== 'all') count++;
  if (filters.customStartDate || filters.customEndDate) count++;
  if (filters.customerName?.trim()) count++;
  if (filters.customerPhone?.trim()) count++;
  if (filters.orderNumber?.trim()) count++;
  if (filters.source !== 'all') count++;
  if (filters.status !== 'all') count++;
  if (filters.productName?.trim()) count++;
  if (filters.brand?.trim()) count++;
  if (filters.size?.trim()) count++;
  if (filters.color?.trim()) count++;
  if (filters.sku?.trim()) count++;
  if (filters.hasMissing) count++;
  if (filters.hasIncoming) count++;
  if (filters.hasReady) count++;
  return count;
}
