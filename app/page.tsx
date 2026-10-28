'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import TopBar from '@/components/TopBar';
import ImportSection from '@/components/ImportSection';
import StockConflictBanner from '@/components/StockConflictBanner';
import AdvancedFilterBar from '@/components/AdvancedFilterBar';
import OrderGroup from '@/components/OrderGroup';
import ShipmentReportBar from '@/components/ShipmentReportBar';
import ReportView from '@/components/ReportView';
import ArchiveModal from '@/components/ArchiveModal';
import ManualOrderModal from '@/components/ManualOrderModal';
import { ShopifyOrderSummary } from '@/lib/shopify';
import {
  ManifestOrder,
  ManifestItem,
  ItemStatus,
  StockConflict,
  ReportSnapshot,
  OrderFilterState,
} from '@/types/manifest';
import { filterAndSortOrders, INITIAL_FILTER_STATE } from '@/lib/filterOrders';

const LOCAL_STORAGE_BATCH_KEY = 'order_manifest_active_batch';

export default function OrderManifestApp() {
  // Manifest batch state
  const [orders, setOrders] = useState<ManifestOrder[]>([]);
  const [filters, setFilters] = useState<OrderFilterState>(INITIAL_FILTER_STATE);
  const [reportStatusMessage, setReportStatusMessage] = useState('Stamp every item to generate the report.');
  const [savingReport, setSavingReport] = useState(false);
  const [currentReport, setCurrentReport] = useState<ReportSnapshot | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [savedReportsCount, setSavedReportsCount] = useState(0);

  const reportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Fetch saved reports count on load
  const refreshArchiveCount = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (res.ok && Array.isArray(data.reports)) {
        setSavedReportsCount(data.reports.length);
      }
    } catch {
      // ignore
    }
  };

  // Hydrate active manifest batch from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_BATCH_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate active batch from localStorage:', e);
    }

    refreshArchiveCount();

    if (window.location.search.includes('sample=1')) {
      // Pre-load sample orders for demonstration
      fetch('/api/shopify/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: ['1001', '1002', '1005', '1006'] }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.orders) handleImportOrders(res.orders);
        });
    }
  }, []);

  // Sync active manifest batch to localStorage
  useEffect(() => {
    try {
      if (orders.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_BATCH_KEY, JSON.stringify(orders));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_BATCH_KEY);
      }
    } catch (e) {
      console.warn('Failed to sync batch to localStorage:', e);
    }
  }, [orders]);

  // Compute all items across active orders
  const allItems = useMemo(() => {
    return orders.flatMap((o) =>
      o.items.map((i) => ({
        ...i,
        orderId: o.id,
        customer: o.customer,
      }))
    );
  }, [orders]);

  // Live status counts
  const counts = useMemo(() => {
    const res: Record<ItemStatus, number> = {
      pending: 0,
      ready: 0,
      incoming: 0,
      missing: 0,
    };
    allItems.forEach((i) => {
      res[i.status] = (res[i.status] || 0) + 1;
    });
    return res;
  }, [allItems]);

  // Update status message dynamically based on remaining items
  useEffect(() => {
    if (orders.length === 0) {
      setReportStatusMessage('No orders in the current batch. Import orders above to begin.');
      return;
    }
    const pendingCount = counts.pending;
    if (pendingCount > 0) {
      setReportStatusMessage(`${pendingCount} item(s) still pending — stamp items or mark remaining Ready.`);
    } else {
      setReportStatusMessage('All items stamped. Ready to generate shipment report.');
    }
  }, [orders.length, counts.pending]);

  // Conflict detection
  const conflicts = useMemo<StockConflict[]>(() => {
    const readyItems = allItems.filter((i) => i.status === 'ready');
    const grouped: Record<
      string,
      {
        brand: string;
        name: string;
        size: string;
        inventoryQuantity: number | null;
        totalReadyQuantity: number;
        orders: Array<{ orderId: string; customer: string; quantity: number }>;
      }
    > = {};

    readyItems.forEach((i) => {
      const key = `${i.brand}|${i.name}|${i.size}`.toLowerCase();
      if (!grouped[key]) {
        grouped[key] = {
          brand: i.brand,
          name: i.name,
          size: i.size,
          inventoryQuantity: i.inventoryQuantity,
          totalReadyQuantity: 0,
          orders: [],
        };
      }
      grouped[key].totalReadyQuantity += i.quantity;
      grouped[key].orders.push({
        orderId: i.orderId,
        customer: i.customer,
        quantity: i.quantity,
      });
    });

    const conflictList: StockConflict[] = [];

    Object.entries(grouped).forEach(([key, data]) => {
      const hasMultipleOrders = data.orders.length > 1;
      const exceedsInventory =
        data.inventoryQuantity !== null && data.totalReadyQuantity > data.inventoryQuantity;

      if (hasMultipleOrders || exceedsInventory) {
        conflictList.push({
          key,
          brand: data.brand,
          name: data.name,
          size: data.size,
          inventoryQuantity: data.inventoryQuantity,
          totalReadyQuantity: data.totalReadyQuantity,
          orders: data.orders,
          reason: exceedsInventory ? 'inventory_exceeded' : 'multiple_orders',
        });
      }
    });

    return conflictList;
  }, [allItems]);

  // Handlers for importing Shopify orders
  const handleImportOrders = (incoming: ShopifyOrderSummary[]) => {
    const newManifestOrders: ManifestOrder[] = incoming.map((o) => ({
      id: o.name,
      shopifyOrderId: o.id,
      source: 'shopify',
      customer: o.customer,
      customerEmail: o.customerEmail,
      orderDate: o.createdAt,
      createdAt: o.createdAt,
      fulfillmentStatus: o.fulfillmentStatus,
      items: o.items.map((it) => ({
        id: Math.random().toString(36).substring(2, 9),
        shopifyLineItemId: it.id,
        name: it.name,
        brand: it.brand,
        brandColor: it.brandColor,
        size: it.size,
        sku: it.sku,
        quantity: it.quantity,
        inventoryQuantity: it.inventoryQuantity,
        suggestReady: it.suggestReady,
        status: 'pending',
        note: '',
        variantId: it.variantId,
        productId: it.productId,
      })),
    }));

    setOrders((prev) => {
      const existingIds = new Set(prev.map((ord) => ord.id.toLowerCase()));
      const unique = newManifestOrders.filter((ord) => !existingIds.has(ord.id.toLowerCase()));
      return [...prev, ...unique];
    });

    setTimeout(() => {
      const firstTicket = document.querySelector('.ticket');
      if (firstTicket) {
        firstTicket.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Handler for importing manually created order
  const handleImportManualOrder = (createdOrder: ManifestOrder) => {
    setOrders((prev) => {
      // Prevent duplicates
      if (prev.some((o) => o.id.toLowerCase() === createdOrder.id.toLowerCase())) {
        return prev;
      }
      return [createdOrder, ...prev];
    });

    setTimeout(() => {
      const firstTicket = document.querySelector('.ticket');
      if (firstTicket) {
        firstTicket.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleSetStatus = (orderId: string, itemId: string, status: ItemStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((i) => (i.id === itemId ? { ...i, status } : i)),
        };
      })
    );
  };

  const handleCycleStatus = (orderId: string, itemId: string) => {
    const seq: ItemStatus[] = ['pending', 'ready', 'incoming', 'missing'];
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((i) => {
            if (i.id !== itemId) return i;
            const nextIdx = (seq.indexOf(i.status) + 1) % seq.length;
            return { ...i, status: seq[nextIdx] };
          }),
        };
      })
    );
  };

  const handleSetNote = (orderId: string, itemId: string, note: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((i) => (i.id === itemId ? { ...i, note } : i)),
        };
      })
    );
  };

  const handleMarkAllReady = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((i) => ({ ...i, status: 'ready' })),
        };
      })
    );
  };

  const handleMarkAllRemainingReady = () => {
    setOrders((prev) =>
      prev.map((o) => ({
        ...o,
        items: o.items.map((i) => (i.status === 'pending' ? { ...i, status: 'ready' } : i)),
      }))
    );
  };

  const handleGenerateReport = async () => {
    if (orders.length === 0) {
      alert('No orders in the current batch to generate a report.');
      return;
    }

    setSavingReport(true);

    try {
      // 1. Compute brand breakdown
      const brandBreakdown: ReportSnapshot['brandBreakdown'] = {};
      allItems.forEach((i) => {
        if (!brandBreakdown[i.brand]) {
          brandBreakdown[i.brand] = {
            color: i.brandColor,
            total: 0,
            ready: 0,
            incoming: 0,
            missing: 0,
            pending: 0,
          };
        }
        brandBreakdown[i.brand].total += i.quantity;
        brandBreakdown[i.brand][i.status] += i.quantity;
      });

      // 2. Compute ready order IDs
      const readyOrderIds = orders
        .filter((o) => o.items.every((i) => i.status === 'ready'))
        .map((o) => o.id);

      const reportId = 'r' + Date.now();
      const snapshot: ReportSnapshot = {
        id: reportId,
        createdAt: new Date().toISOString(),
        orderCount: orders.length,
        itemCount: allItems.length,
        counts,
        conflicts,
        orders: JSON.parse(JSON.stringify(orders)),
        readyOrderIds,
        brandBreakdown,
      };

      // 3. Persist to Postgres database
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reportId,
          orderCount: orders.length,
          itemCount: allItems.length,
          snapshot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save report to database');
      }

      // 4. On confirmed save, display report, clear active board, update archive
      setCurrentReport(snapshot);
      setOrders([]);
      localStorage.removeItem(LOCAL_STORAGE_BATCH_KEY);
      refreshArchiveCount();

      setTimeout(() => {
        if (reportRef.current) {
          reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      alert(`Could not save report: ${err.message}. Your batch was NOT cleared.`);
    } finally {
      setSavingReport(false);
    }
  };

  const handleEditBatch = (report: ReportSnapshot) => {
    // Restore orders, reset statuses to pending, keep notes intact
    const restoredOrders: ManifestOrder[] = JSON.parse(JSON.stringify(report.orders));
    restoredOrders.forEach((o) => {
      o.items.forEach((i) => {
        i.status = 'pending';
      });
    });

    setOrders(restoredOrders);
    setCurrentReport(null);
    setReportStatusMessage(
      `Editing batch from ${new Date(report.createdAt).toLocaleTimeString()} — all stamps reset to pending, notes preserved.`
    );

    setTimeout(() => {
      if (boardRef.current) {
        boardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleRemoveOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        if (currentReport?.id === reportId) {
          setCurrentReport(null);
        }
        refreshArchiveCount();
      }
    } catch {
      alert('Failed to delete report');
    }
  };

  // Filter and sort orders using multi-criteria pipeline
  const visibleOrders = useMemo(() => {
    return filterAndSortOrders(orders, filters);
  }, [orders, filters]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Top Header */}
      <TopBar
        counts={counts}
        activeFilter={filters.status !== 'all' ? (filters.status as ItemStatus) : null}
        onToggleFilter={(status) => {
          setFilters((prev) => ({
            ...prev,
            status: prev.status === status ? 'all' : status,
          }));
        }}
        onOpenManualOrder={() => setIsManualOrderOpen(true)}
      />

      {/* Info Banner */}
      <div className="text-xs text-stone-300 bg-ink-night-2 border border-ink-rule rounded-xl p-3 sm:p-3.5 mb-6 leading-relaxed flex items-center justify-between flex-wrap gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
          <div>
            <b className="text-cream font-bold">Production Ops Platform:</b> Connected live to Essentials EG Shopify Admin API & internal PostgreSQL database. Search orders, create manual entries, and allocate stock seamlessly.
          </div>
        </div>
      </div>

      {/* Import Section */}
      <ImportSection
        onImportOrders={handleImportOrders}
        existingOrderIds={orders.map((o) => o.id)}
        onOpenManualOrder={() => setIsManualOrderOpen(true)}
      />

      {/* Board & Toolbar */}
      <div ref={boardRef}>
        {orders.length > 0 && (
          <AdvancedFilterBar
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={() => setFilters(INITIAL_FILTER_STATE)}
            totalOrders={orders.length}
            filteredOrdersCount={visibleOrders.length}
            onMarkAllRemainingReady={handleMarkAllRemainingReady}
          />
        )}

        {orders.length === 0 ? (
          <div className="text-center py-14 px-4 text-stone-600 dark:text-stone-400 text-xs sm:text-sm font-medium border border-dashed border-ink-rule rounded-xl mb-8 bg-ink-night-2/40">
            No orders in active manifest &mdash; click{' '}
            <button
              type="button"
              onClick={() => setIsManualOrderOpen(true)}
              className="text-purple-600 dark:text-purple-400 font-bold underline hover:opacity-80 cursor-pointer"
            >
              Create Manual Order
            </button>{' '}
            or browse/paste Shopify orders above to populate the board.
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-ink-rule rounded-md mb-8 bg-ink-night-2">
            <p className="text-sm font-semibold text-cream mb-1">No orders match your filter criteria</p>
            <p className="text-xs text-stone-400 mb-4">
              Try adjusting your search terms, date range, or status filters.
            </p>
            <button
              type="button"
              onClick={() => setFilters(INITIAL_FILTER_STATE)}
              className="font-mono text-xs px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer font-semibold shadow-sm"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleOrders.map((order) => {
              const activeFilterStatus = filters.status !== 'all' ? (filters.status as ItemStatus) : null;
              const filteredItems = activeFilterStatus
                ? order.items.filter((i) => i.status === activeFilterStatus)
                : order.items;

              return (
                <OrderGroup
                  key={order.id}
                  order={order}
                  filteredItems={filteredItems}
                  totalItemCount={order.items.length}
                  activeFilter={activeFilterStatus}
                  onSetStatus={handleSetStatus}
                  onCycleStatus={handleCycleStatus}
                  onSetNote={handleSetNote}
                  onMarkAllReady={handleMarkAllReady}
                  onRemoveOrder={handleRemoveOrder}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <ShipmentReportBar
        statusMessage={reportStatusMessage}
        savedReportsCount={savedReportsCount}
        onOpenArchive={() => setIsArchiveOpen(true)}
        onGenerateReport={handleGenerateReport}
        savingReport={savingReport}
      />

      {/* Generated Report View */}
      {currentReport && (
        <div ref={reportRef}>
          <ReportView
            report={currentReport}
            onEditBatch={handleEditBatch}
            onDeleteReport={handleDeleteReport}
          />
        </div>
      )}

      {/* Saved Reports Archive Modal */}
      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onDeleteReport={handleDeleteReport}
        onSelectReport={(report) => {
          setCurrentReport(report);
          setTimeout(() => {
            if (reportRef.current) {
              reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }}
      />

      {/* Manual Order Creation Modal */}
      <ManualOrderModal
        isOpen={isManualOrderOpen}
        onClose={() => setIsManualOrderOpen(false)}
        onOrderCreated={handleImportManualOrder}
      />
    </div>
  );
}
