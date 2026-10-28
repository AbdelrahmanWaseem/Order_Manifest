'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import TopBar from '@/components/TopBar';
import ImportSection from '@/components/ImportSection';
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
import { PackageOpen, SearchX, Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';

const LOCAL_STORAGE_BATCH_KEY = 'order_manifest_active_batch';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

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
  const [hideBanner, setHideBanner] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const reportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

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
      const bannerDismissed = localStorage.getItem('hide_ops_banner');
      if (!bannerDismissed) {
        setHideBanner(false);
      }
    } catch (e) {
      console.warn('Failed to hydrate active batch from localStorage:', e);
    }

    refreshArchiveCount();

    if (window.location.search.includes('sample=1')) {
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

  const dismissBanner = () => {
    setHideBanner(true);
    try {
      localStorage.setItem('hide_ops_banner', '1');
    } catch {}
  };

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

  // Total and stamped items count
  const totalItemsCount = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.items.length, 0);
  }, [orders]);

  const stampedItemsCount = useMemo(() => {
    return orders.reduce(
      (sum, o) => sum + o.items.filter((i) => i.status !== 'pending').length,
      0
    );
  }, [orders]);

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
      setReportStatusMessage('All items stamped! Ready to generate shipment manifest report.');
    }
  }, [orders.length, counts.pending]);

  // Conflict detection (internal calculation for report persistence)
  const conflicts = useMemo<StockConflict[]>(() => {
    const readyItems = allItems.filter((i) => i.status === 'ready');
    const grouped: Record<
      string,
      {
        brand: string;
        name: string;
        size: string;
        inventoryQuantity: number | null;
        orders: Array<{ orderId: string; customer: string; quantity: number }>;
      }
    > = {};

    readyItems.forEach((item) => {
      const key = `${item.brand}:::${item.name}:::${item.size}`.toLowerCase();
      if (!grouped[key]) {
        grouped[key] = {
          brand: item.brand,
          name: item.name,
          size: item.size,
          inventoryQuantity: item.inventoryQuantity,
          orders: [],
        };
      }
      grouped[key].orders.push({
        orderId: item.orderId,
        customer: item.customer,
        quantity: item.quantity,
      });
    });

    const conflictList: StockConflict[] = [];
    Object.entries(grouped).forEach(([key, group]) => {
      const totalReadyQuantity = group.orders.reduce((sum, o) => sum + o.quantity, 0);
      const isMultiOrder = group.orders.length > 1;
      const exceedsInventory =
        group.inventoryQuantity !== null && totalReadyQuantity > group.inventoryQuantity;

      if (isMultiOrder || exceedsInventory) {
        conflictList.push({
          key,
          brand: group.brand,
          name: group.name,
          size: group.size,
          inventoryQuantity: group.inventoryQuantity,
          totalReadyQuantity,
          orders: group.orders.map((o) => ({
            orderId: o.orderId,
            customer: o.customer,
            quantity: o.quantity,
          })),
          reason: isMultiOrder ? 'multiple_orders' : 'inventory_exceeded',
        });
      }
    });

    return conflictList;
  }, [allItems]);

  // Convert Shopify Order to ManifestOrder
  const handleImportOrders = (imported: ShopifyOrderSummary[]) => {
    const existingIds = new Set(orders.map((o) => o.id));
    const newOrders: ManifestOrder[] = [];

    imported.forEach((summary) => {
      if (existingIds.has(summary.name)) return;

      const manifestItems: ManifestItem[] = summary.items.map((it, idx) => ({
        id: `${summary.name}-${idx}-${Date.now()}`,
        name: it.name,
        brand: it.brand || 'Essentials EG',
        brandColor: it.brandColor || '#4F46E5',
        size: it.size || 'M',
        color: (it as any).color || undefined,
        sku: it.sku || '',
        quantity: it.quantity || 1,
        status: 'pending' as ItemStatus,
        note: '',
        inventoryQuantity: it.inventoryQuantity,
        suggestReady: it.suggestReady,
      }));

      newOrders.push({
        id: summary.name,
        customer: summary.customer || 'Unknown Customer',
        customerPhone: (summary as any).customerPhone || undefined,
        customerEmail: summary.customerEmail,
        orderDate: summary.createdAt,
        fulfillmentStatus: summary.fulfillmentStatus,
        tags: summary.tags || undefined,
        items: manifestItems,
        source: 'shopify',
      });
    });

    if (newOrders.length > 0) {
      setOrders((prev) => [...prev, ...newOrders]);
      addToast(`Imported ${newOrders.length} order(s) successfully`);
      setTimeout(() => {
        if (boardRef.current) {
          boardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Convert and add manually created order
  const handleImportManualOrder = (newOrder: ManifestOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    addToast(`Manual order ${newOrder.id} created & imported`);
    setTimeout(() => {
      if (boardRef.current) {
        boardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Item Actions
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
    const cycleOrder: ItemStatus[] = ['pending', 'ready', 'incoming', 'missing'];
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((i) => {
            if (i.id !== itemId) return i;
            const currentIdx = cycleOrder.indexOf(i.status);
            const nextIdx = (currentIdx + 1) % cycleOrder.length;
            return { ...i, status: cycleOrder[nextIdx] };
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
    if (orders.length === 0) return;

    setSavingReport(true);

    try {
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

      setCurrentReport(snapshot);
      setOrders([]);
      localStorage.removeItem(LOCAL_STORAGE_BATCH_KEY);
      refreshArchiveCount();
      addToast('Shipment report saved successfully');

      setTimeout(() => {
        if (reportRef.current) {
          reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      addToast(err.message || 'Could not save report', 'error');
    } finally {
      setSavingReport(false);
    }
  };

  const handleEditBatch = (report: ReportSnapshot) => {
    const restoredOrders: ManifestOrder[] = JSON.parse(JSON.stringify(report.orders));
    restoredOrders.forEach((o) => {
      o.items.forEach((i) => {
        i.status = 'pending';
      });
    });

    setOrders(restoredOrders);
    setCurrentReport(null);
    setReportStatusMessage(
      `Editing batch from ${new Date(report.createdAt).toLocaleTimeString()} — all stamps reset to pending.`
    );
    addToast('Restored batch to active board');

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
        addToast('Report deleted successfully');
      }
    } catch {
      addToast('Failed to delete report', 'error');
    }
  };

  const visibleOrders = useMemo(() => {
    return filterAndSortOrders(orders, filters);
  }, [orders, filters]);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 pb-36">
      {/* Toast Notification Container (Top-Right) */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-lg border text-xs font-medium shadow-md transition-all flex items-center gap-2 ${
              toast.type === 'error'
                ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#7F1D1D] dark:text-[#FECACA] dark:border-[#991B1B]'
                : toast.type === 'info'
                ? 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE] dark:bg-[#1E3A8A] dark:text-[#BFDBFE] dark:border-[#1E40AF]'
                : 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#14532D] dark:text-[#BBF7D0] dark:border-[#166534]'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

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

      {/* Dismissible Info Banner */}
      {!hideBanner && (
        <div className="text-xs text-text-muted bg-surface border border-border rounded-lg px-3.5 py-2.5 mb-6 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>
              <strong className="text-text font-semibold">Production Ops Platform:</strong> Connected live to Essentials EG Shopify Admin API & internal PostgreSQL database.
            </span>
          </div>
          <button
            type="button"
            onClick={dismissBanner}
            className="text-text-muted hover:text-text p-0.5 rounded cursor-pointer"
            title="Dismiss note"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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

        {/* Empty States */}
        {orders.length === 0 ? (
          <div className="card-clean text-center py-16 px-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted mx-auto mb-3">
              <PackageOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-text mb-1">No orders in active manifest</h3>
            <p className="text-xs text-text-muted mb-4 max-w-sm mx-auto">
              Browse and import live orders above or create a manual order to start stamping.
            </p>
            <button
              type="button"
              onClick={() => setIsManualOrderOpen(true)}
              className="h-10 px-4 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Manual Order</span>
            </button>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="card-clean text-center py-16 px-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted mx-auto mb-3">
              <SearchX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-text mb-1">No orders match your filter criteria</h3>
            <p className="text-xs text-text-muted mb-4 max-w-sm mx-auto">
              Try adjusting your search terms, date range, or status filters.
            </p>
            <button
              type="button"
              onClick={() => setFilters(INITIAL_FILTER_STATE)}
              className="h-10 px-4 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-text border border-border rounded-lg text-sm font-medium transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
            >
              <span>Clear All Filters</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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

      {/* Bottom Sticky Action Bar: Progress on left, Saved Reports & Generate on right */}
      <ShipmentReportBar
        statusMessage={reportStatusMessage}
        savedReportsCount={savedReportsCount}
        onOpenArchive={() => setIsArchiveOpen(true)}
        onGenerateReport={handleGenerateReport}
        savingReport={savingReport}
        totalItems={totalItemsCount}
        stampedItems={stampedItemsCount}
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
