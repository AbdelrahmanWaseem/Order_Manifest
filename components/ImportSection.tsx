'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShopifyOrderSummary } from '@/lib/shopify';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Search, ArrowRight, CheckSquare, Square, RefreshCw, X } from 'lucide-react';

interface ImportSectionProps {
  onImportOrders: (orders: ShopifyOrderSummary[]) => void;
  existingOrderIds: string[]; // e.g. ["#1001", "#1002"]
  onOpenManualOrder?: () => void;
}

export default function ImportSection({
  onImportOrders,
  existingOrderIds,
  onOpenManualOrder,
}: ImportSectionProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'paste'>('browse');

  // Paste mode state
  const [rawInput, setRawInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);

  // Browse mode state
  const [recentOrders, setRecentOrders] = useState<ShopifyOrderSummary[]>([]);
  const [defaultOrders, setDefaultOrders] = useState<ShopifyOrderSummary[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent orders when browse tab is active
  const loadRecentOrders = async (cursor: string | null = null, query: string = '', loadAll: boolean = false) => {
    const isSearch = Boolean(query.trim());
    if (loadAll) {
      setLoadingAll(true);
    } else if (isSearch) {
      setSearchLoading(true);
    } else {
      setBrowseLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (loadAll) {
        params.set('all', 'true');
      } else {
        params.set('first', '50');
        if (cursor) params.set('after', cursor);
      }
      if (query.trim()) params.set('query', query.trim());

      const res = await fetch(`/api/shopify/orders?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch Shopify orders');
      }

      const fetchedOrders: ShopifyOrderSummary[] = data.orders || [];

      setRecentOrders(fetchedOrders);

      // Cache default orders
      if (!isSearch && !cursor) {
        setDefaultOrders(fetchedOrders);
      }
    } catch {
      // Clean silent handling
    } finally {
      setBrowseLoading(false);
      setSearchLoading(false);
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'browse' && recentOrders.length === 0 && !browseLoading) {
      loadRecentOrders(null, '', true);
    }
  }, [activeTab]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val.trim()) {
      if (defaultOrders.length > 0) {
        setRecentOrders(defaultOrders);
      } else {
        loadRecentOrders(null, '', true);
      }
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadRecentOrders(null, val, false);
    }, 400);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    loadRecentOrders(null, searchQuery, false);
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === recentOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(recentOrders.map((o) => o.id)));
    }
  };

  const handleImportSelected = () => {
    const toImport = recentOrders.filter((o) => selectedOrderIds.has(o.id));
    if (toImport.length === 0) return;

    onImportOrders(toImport);
    setSelectedOrderIds(new Set());
  };

  const performLookup = async (textToParse?: string) => {
    const text = textToParse !== undefined ? textToParse : rawInput;
    const tokens = text
      .split(/[\s,\n\r]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    if (tokens.length === 0) return;

    const uniqueTokens = Array.from(new Set(tokens));
    setFetching(true);
    setDuplicateNotice(null);

    try {
      const res = await fetch('/api/shopify/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: uniqueTokens }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to lookup orders');

      const foundOrders: ShopifyOrderSummary[] = data.orders || [];

      if (foundOrders.length > 0) {
        onImportOrders(foundOrders);
        setRawInput('');
      }
    } catch {
      // Clean fallback
    } finally {
      setFetching(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.trim()) {
      setTimeout(() => {
        performLookup(pastedText);
      }, 50);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-5 mb-8 shadow-sm">
      {/* Header and Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 mb-4 gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text">
            Import Orders
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Browse live orders from Shopify Admin or paste order numbers
          </p>
        </div>

        {/* Segmented Toggle */}
        <div className="flex items-center gap-1 bg-bg border border-border p-1 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`text-xs px-3 py-1.5 font-medium rounded-md transition cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-surface text-text shadow-sm border border-border/60'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Browse Store
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`text-xs px-3 py-1.5 font-medium rounded-md transition cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-surface text-text shadow-sm border border-border/60'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Paste Order #s
          </button>
        </div>
      </div>

      {/* Tab 1: Browse Store */}
      {activeTab === 'browse' && (
        <div className="space-y-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search recent orders by customer, order #, or email…"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-10 bg-bg border border-border rounded-lg pl-9 pr-9 text-sm text-text placeholder-[#9CA3AF] focus:border-accent"
              />
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-3 text-text-muted hover:text-text p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={browseLoading || searchLoading}
              className="h-10 px-4 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-text border border-border rounded-lg text-sm font-medium flex items-center gap-2 transition cursor-pointer"
            >
              {browseLoading || searchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              ) : (
                <RefreshCw className="w-4 h-4 text-text-muted" />
              )}
              <span>{searchLoading ? 'Searching…' : 'Refresh'}</span>
            </button>
          </form>

          {/* Table Container: Sticky header, 48px rows, max 360px scrollable */}
          <div className="border border-border rounded-lg bg-surface overflow-hidden max-h-[360px] overflow-y-auto">
            {(browseLoading || searchLoading || loadingAll) && recentOrders.length === 0 ? (
              <div className="py-16 text-center text-sm text-text-muted flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span>Loading live Shopify orders…</span>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-16 text-center text-sm text-text-muted">
                No orders match your search query.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-surface z-10 shadow-[0_1px_0_0_var(--border)]">
                  <tr className="border-b border-border text-xs font-semibold text-text-muted">
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-text-muted hover:text-text cursor-pointer flex items-center justify-center"
                        aria-label="Select all orders"
                      >
                        {selectedOrderIds.size === recentOrders.length && recentOrders.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-accent" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3">Order</th>
                    <th className="py-3 px-3">Fulfillment</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Items</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3 text-right">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((ord) => {
                    const isSelected = selectedOrderIds.has(ord.id);
                    const isAlreadyImported = existingOrderIds.includes(ord.name);
                    const itemsSummary = ord.items.map((i) => `${i.name} (${i.size})`).join(', ');

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => toggleSelectOrder(ord.id)}
                        className={`h-12 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleSelectOrder(ord.id)}
                            className="text-text-muted hover:text-text cursor-pointer flex items-center justify-center mx-auto"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-accent" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-2 px-3 font-semibold text-text tabular-nums whitespace-nowrap">
                          {ord.name}
                          {isAlreadyImported && (
                            <span className="ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded bg-bg text-text-muted border border-border">
                              Imported
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {ord.fulfillmentStatus?.toUpperCase() === 'FULFILLED' ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#BBF7D0]">
                              Fulfilled
                            </span>
                          ) : ord.fulfillmentStatus?.toUpperCase()?.includes('PARTIAL') ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A] dark:text-[#BFDBFE]">
                              Partial
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F] dark:text-[#FDE68A]">
                              Unfulfilled
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-text text-sm whitespace-nowrap" dir="auto">
                          {ord.customer}
                        </td>
                        <td className="py-2 px-3 text-text-muted max-w-[280px]">
                          <span className="font-semibold text-text tabular-nums">{ord.itemCount}</span> items &middot;{' '}
                          <span
                            className="truncate inline-block max-w-[210px] align-bottom text-text-muted"
                            title={itemsSummary}
                          >
                            {itemsSummary}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-text text-right tabular-nums whitespace-nowrap">
                          {formatCurrency(ord.totalPrice)}
                          <span className="text-text-muted text-[11px] ml-1 font-normal">EGP</span>
                        </td>
                        <td className="py-2 px-3 text-text-muted text-right tabular-nums whitespace-nowrap text-xs">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Action Bar for Browse: muted counter left, Import Selected anchored right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-3">
            <div className="text-xs text-text-muted">
              <span className="font-medium text-text tabular-nums">{selectedOrderIds.size}</span> selected &middot;{' '}
              <span className="tabular-nums">{recentOrders.length}</span> orders loaded
            </div>

            <button
              type="button"
              onClick={handleImportSelected}
              disabled={selectedOrderIds.size === 0}
              className="h-10 px-4 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium transition cursor-pointer flex items-center justify-center gap-2 disabled:bg-[#E5E7EB] disabled:text-[#6B7280] dark:disabled:bg-[#334155] dark:disabled:text-[#9CA3AF] disabled:cursor-not-allowed shadow-sm self-end sm:self-auto"
            >
              <span>Import Selected {selectedOrderIds.size > 0 ? `(${selectedOrderIds.size})` : ''}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Paste Order Numbers */}
      {activeTab === 'paste' && (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            id="rawInput"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onPaste={handlePaste}
            placeholder="Paste order numbers here, separated by comma, space, or newline (e.g. 1001, 1002, 1005)..."
            className="w-full min-h-[100px] bg-bg border border-border rounded-lg p-3 text-sm text-text resize-y focus:border-accent"
          />

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <span className="text-xs text-text-muted">
              Pasting automatically parses and fetches live order details from Shopify.
            </span>

            <button
              type="button"
              onClick={() => performLookup()}
              disabled={fetching || !rawInput.trim()}
              className="h-10 px-4 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium transition cursor-pointer flex items-center gap-2 disabled:bg-[#E5E7EB] disabled:text-[#6B7280] dark:disabled:bg-[#334155] dark:disabled:text-[#9CA3AF] disabled:cursor-not-allowed shadow-sm"
            >
              {fetching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Looking up orders…</span>
                </>
              ) : (
                <>
                  <span>Fetch from Shopify</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
