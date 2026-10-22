'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShopifyOrderSummary } from '@/lib/shopify';
import { Loader2, Search, ArrowRight, CheckSquare, Square, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

interface ImportSectionProps {
  onImportOrders: (orders: ShopifyOrderSummary[]) => void;
  existingOrderIds: string[]; // e.g. ["#1001", "#1002"]
}

export default function ImportSection({
  onImportOrders,
  existingOrderIds,
}: ImportSectionProps) {
  const [activeTab, setActiveTab] = useState<'paste' | 'browse'>('browse');

  // Paste mode state
  const [rawInput, setRawInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const [notFound, setNotFound] = useState<string[]>([]);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);

  // Browse mode state
  const [recentOrders, setRecentOrders] = useState<ShopifyOrderSummary[]>([]);
  const [defaultOrders, setDefaultOrders] = useState<ShopifyOrderSummary[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [pageCursor, setPageCursor] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<{ hasNextPage: boolean; endCursor?: string | null }>({
    hasNextPage: false,
  });
  const [defaultPageInfo, setDefaultPageInfo] = useState<{ hasNextPage: boolean; endCursor?: string | null }>({
    hasNextPage: false,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent orders when browse tab is active
  const loadRecentOrders = async (cursor: string | null = null, query: string = '') => {
    const isSearch = Boolean(query.trim());
    if (isSearch) {
      setSearchLoading(true);
    } else {
      setBrowseLoading(true);
    }
    setBrowseError(null);
    try {
      const params = new URLSearchParams();
      params.set('first', '25');
      if (cursor) params.set('after', cursor);
      if (query.trim()) params.set('query', query.trim());

      const res = await fetch(`/api/shopify/orders?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch Shopify orders');
      }

      const fetchedOrders: ShopifyOrderSummary[] = data.orders || [];
      const fetchedPageInfo = {
        hasNextPage: data.pageInfo?.hasNextPage || false,
        endCursor: data.pageInfo?.endCursor || null,
      };

      setRecentOrders(fetchedOrders);
      setPageInfo(fetchedPageInfo);
      setPageCursor(cursor);

      // Cache as default orders when fetching without a search filter
      if (!isSearch && !cursor) {
        setDefaultOrders(fetchedOrders);
        setDefaultPageInfo(fetchedPageInfo);
      }
    } catch (err: any) {
      setBrowseError(err.message || 'Error communicating with Shopify Admin API');
    } finally {
      setBrowseLoading(false);
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'browse' && recentOrders.length === 0 && !browseLoading) {
      loadRecentOrders();
    }
  }, [activeTab]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Instant live search as user types + instantaneous return to all orders when cleared
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const trimmed = val.trim();

    // When the input is deleted/cleared: immediately restore full list of orders
    if (!trimmed) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      setSearchLoading(false);
      if (defaultOrders.length > 0) {
        setRecentOrders(defaultOrders);
        setPageInfo(defaultPageInfo);
      } else {
        loadRecentOrders(null, '');
      }
      return;
    }

    // Instant local preview for zero-latency if matched in current/default orders
    const cleanTerm = trimmed.replace(/^#/, '').toLowerCase();
    const sourceList = defaultOrders.length > 0 ? defaultOrders : recentOrders;
    const localMatches = sourceList.filter((o) => {
      const oNum = o.name.replace(/^#/, '').toLowerCase();
      const cName = o.customer.toLowerCase();
      return (
        oNum.includes(cleanTerm) ||
        cName.includes(cleanTerm) ||
        o.name.toLowerCase().includes(trimmed.toLowerCase())
      );
    });

    if (localMatches.length > 0) {
      setRecentOrders(localMatches);
    }

    // Debounce live Shopify API query (250ms) to find any order across store
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(() => {
      loadRecentOrders(null, trimmed);
    }, 250);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    loadRecentOrders(null, searchQuery);
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

    // Filter duplicates
    const duplicates: string[] = [];
    const freshOrders: ShopifyOrderSummary[] = [];

    for (const o of toImport) {
      if (existingOrderIds.includes(o.name)) {
        duplicates.push(o.name);
      } else {
        freshOrders.push(o);
      }
    }

    if (duplicates.length > 0) {
      setDuplicateNotice(`Skipped ${duplicates.length} duplicate order(s) already in the batch: ${duplicates.join(', ')}`);
    } else {
      setDuplicateNotice(null);
    }

    if (freshOrders.length > 0) {
      onImportOrders(freshOrders);
      setSelectedOrderIds(new Set());
    }
  };

  // Paste manual lookup
  const performLookup = async (textToLookup?: string) => {
    const input = (textToLookup !== undefined ? textToLookup : rawInput).trim();
    if (!input) return;

    setFetching(true);
    setNotFound([]);
    setDuplicateNotice(null);

    const numbers = input
      .split(/[\s,]+/)
      .map((s) => s.replace(/^#/, '').trim())
      .filter(Boolean);

    if (numbers.length === 0) {
      setFetching(false);
      return;
    }

    // Check which are already imported
    const duplicates: string[] = [];
    const neededNumbers: string[] = [];

    for (const n of numbers) {
      const orderName = '#' + n;
      if (existingOrderIds.includes(orderName) || existingOrderIds.includes(n)) {
        duplicates.push(orderName);
      } else {
        neededNumbers.push(n);
      }
    }

    if (duplicates.length > 0) {
      setDuplicateNotice(`Skipped ${duplicates.length} order(s) already in this batch: ${duplicates.join(', ')}`);
    }

    if (neededNumbers.length === 0) {
      setFetching(false);
      setRawInput('');
      return;
    }

    try {
      const res = await fetch('/api/shopify/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: neededNumbers }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to lookup orders in Shopify');
      }

      if (data.notFound && data.notFound.length > 0) {
        setNotFound(data.notFound);
      }

      if (data.orders && data.orders.length > 0) {
        onImportOrders(data.orders);
        setRawInput('');
      }
    } catch (err: any) {
      setNotFound([`Error: ${err.message}`]);
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

  const loadSample = () => {
    setRawInput('1001, 1002, 1005\n1006, 1099');
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div className="bg-ink-night-2 border border-ink-rule rounded-md p-5 mb-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink-rule pb-3 mb-4 gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-cream">
            Import Orders
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Retrieve real orders and inventory live from Essentials EG Shopify Admin
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex rounded bg-ink-night p-1 border border-ink-rule self-start">
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`text-xs px-3 py-1 font-medium rounded transition ${
              activeTab === 'browse'
                ? 'bg-ink-rule text-cream font-semibold'
                : 'text-stone-400 hover:text-cream'
            }`}
          >
            Browse Shopify Store
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`text-xs px-3 py-1 font-medium rounded transition ${
              activeTab === 'paste'
                ? 'bg-ink-rule text-cream font-semibold'
                : 'text-stone-400 hover:text-cream'
            }`}
          >
            Paste Order #s
          </button>
        </div>
      </div>

      {/* Tab 1: Browse Recent Orders */}
      {activeTab === 'browse' && (
        <div className="space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search recent orders by customer, order #, or email…"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-ink-night border border-ink-rule rounded px-3 py-1.5 pl-8 pr-8 text-xs text-cream placeholder-stone-500 focus:outline-none focus:border-stamp-pending"
              />
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-2 text-stone-400 hover:text-cream text-xs font-mono"
                  title="Clear search and return to all orders"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={browseLoading || searchLoading}
              className="bg-ink-night hover:bg-stone-800 text-stone-300 border border-ink-rule px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              {browseLoading || searchLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-stamp-pending" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>{searchLoading ? 'Searching…' : 'Search'}</span>
            </button>
          </form>

          {browseError && (
            <div className="p-3 bg-red-950/30 border border-stamp-missing rounded text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-stamp-missing shrink-0" />
              <span>{browseError}</span>
            </div>
          )}

          {/* Orders list */}
          <div className="border border-ink-rule rounded bg-ink-night overflow-hidden max-h-80 overflow-y-auto">
            {(browseLoading || searchLoading) && recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-stamp-pending" />
                <span>{searchLoading ? 'Searching Shopify for matching orders…' : 'Loading recent orders from Shopify…'}</span>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No orders found. Check your search query or store connection.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink-rule bg-ink-night-2 font-mono text-[11px] text-stone-400">
                    <th className="p-2.5 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-stone-400 hover:text-cream"
                      >
                        {selectedOrderIds.size === recentOrders.length ? (
                          <CheckSquare className="w-4 h-4 text-stamp-ready" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-2.5">Order</th>
                    <th className="p-2.5">Customer</th>
                    <th className="p-2.5">Items</th>
                    <th className="p-2.5">Total</th>
                    <th className="p-2.5">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-rule/50">
                  {recentOrders.map((ord) => {
                    const isSelected = selectedOrderIds.has(ord.id);
                    const isAlreadyImported = existingOrderIds.includes(ord.name);

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => toggleSelectOrder(ord.id)}
                        className={`hover:bg-stone-900/60 cursor-pointer transition ${
                          isSelected ? 'bg-stamp-pending/10' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleSelectOrder(ord.id)}
                            className="text-stone-400 hover:text-cream"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-stamp-ready" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-stamp-pending">
                          {ord.name}
                          {isAlreadyImported && (
                            <span className="ml-1.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-800 text-stone-400">
                              Imported
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-medium text-cream">{ord.customer}</td>
                        <td className="p-2.5 text-stone-400">
                          <span className="font-mono text-cream">{ord.itemCount}</span> items &middot;{' '}
                          <span className="text-[11px] truncate inline-block max-w-[200px] align-bottom">
                            {ord.items.map((i) => `${i.name} (${i.size})`).join(', ')}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-stone-300">{ord.totalPrice}</td>
                        <td className="p-2.5 font-mono text-[11px] text-stone-500">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Action bar for browse */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-stone-400">
              {selectedOrderIds.size} order(s) selected
            </div>

            <div className="flex items-center gap-2">
              {pageInfo.hasNextPage && (
                <button
                  type="button"
                  onClick={() => loadRecentOrders(pageInfo.endCursor, searchQuery)}
                  disabled={browseLoading}
                  className="px-2.5 py-1.5 bg-ink-night border border-ink-rule hover:border-stone-500 rounded text-xs text-stone-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span>Next Page</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleImportSelected}
                disabled={selectedOrderIds.size === 0}
                className="bg-stamp-pending hover:bg-[#b57a24] text-ink-dark font-semibold text-xs px-3.5 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Import Selected</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Paste manual textarea */}
      {activeTab === 'paste' && (
        <div>
          <textarea
            ref={textareaRef}
            id="rawInput"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onPaste={handlePaste}
            placeholder="1001, 1002, 1005&#10;1006"
            className="w-full min-h-[90px] bg-ink-night border border-ink-rule rounded p-2.5 text-xs font-mono text-cream resize-y focus:outline-none focus:border-stamp-pending"
          />

          <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
            <button
              type="button"
              onClick={() => performLookup()}
              disabled={fetching || !rawInput.trim()}
              className="bg-stamp-pending hover:bg-[#b57a24] text-ink-dark font-semibold text-xs px-3.5 py-2 rounded transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {fetching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Looking up…</span>
                </>
              ) : (
                'Fetch from Shopify'
              )}
            </button>

            <button
              type="button"
              onClick={loadSample}
              className="bg-transparent hover:bg-stone-900 border border-ink-rule text-stone-300 text-xs px-3 py-2 rounded transition cursor-pointer"
            >
              Load sample order numbers
            </button>

            <span className="text-[11px] text-stone-500 font-mono">
              Format: order numbers, with or without &quot;#&quot; — pasting auto-fetches
            </span>
          </div>
        </div>
      )}

      {/* Not found notice */}
      {notFound.length > 0 && (
        <div className="mt-3 p-2.5 bg-[#a4392f]/15 border border-stamp-missing rounded text-xs text-[#e5b3ac]">
          <span className="font-bold text-white">Not found in Shopify: </span>
          {notFound.map((n) => (n.startsWith('Error:') ? n : '#' + n)).join(', ')} — double-check the order number.
        </div>
      )}

      {/* Duplicate notice */}
      {duplicateNotice && (
        <div className="mt-2.5 p-2 bg-stone-900/60 border border-stone-700 rounded text-xs text-stone-300 font-mono">
          ℹ {duplicateNotice}
        </div>
      )}
    </div>
  );
}
