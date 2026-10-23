'use client';

import React, { useState } from 'react';
import {
  OrderFilterState,
  OrderSortOption,
  DateFilterPreset,
  OrderSourceFilter,
  OrderStatusFilter,
} from '@/types/manifest';
import { countActiveFilters } from '@/lib/filterOrders';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  RotateCcw,
  Calendar,
  Layers,
  Tag,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpDown,
} from 'lucide-react';

interface AdvancedFilterBarProps {
  filters: OrderFilterState;
  onFilterChange: (newFilters: OrderFilterState) => void;
  onResetFilters: () => void;
  totalOrders: number;
  filteredOrdersCount: number;
  onMarkAllRemainingReady: () => void;
}

export default function AdvancedFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  totalOrders,
  filteredOrdersCount,
  onMarkAllRemainingReady,
}: AdvancedFilterBarProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const activeFilterCount = countActiveFilters(filters);

  const update = (patch: Partial<OrderFilterState>) => {
    onFilterChange({ ...filters, ...patch });
  };

  const hasAnyFilterOrSearch =
    Boolean(filters.searchQuery.trim()) || activeFilterCount > 0;

  return (
    <div className="space-y-3 mb-6">
      {/* Primary Bar: Search + Filters Toggle + Sort + Mark All Ready */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by customer, phone, order #, product name, size, color, or SKU…"
            value={filters.searchQuery}
            onChange={(e) => update({ searchQuery: e.target.value })}
            className="w-full bg-ink-night-2 border border-ink-rule rounded px-3.5 py-2 pl-9 pr-8 text-xs text-cream placeholder-stone-500 focus:outline-none focus:border-purple-500 transition"
          />
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => update({ searchQuery: '' })}
              className="text-stone-400 hover:text-cream absolute right-2.5 top-2.5 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setIsPanelOpen((prev) => !prev)}
            className={`font-mono text-xs font-semibold px-3 py-2 rounded border transition cursor-pointer flex items-center gap-2 ${
              isPanelOpen || activeFilterCount > 0
                ? 'bg-purple-950/60 border-purple-600 text-purple-200'
                : 'bg-ink-night-2 border-ink-rule hover:border-stone-500 text-stone-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isPanelOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 pointer-events-none" />
            <select
              value={filters.sortBy}
              onChange={(e) => update({ sortBy: e.target.value as OrderSortOption })}
              className="bg-ink-night-2 border border-ink-rule hover:border-stone-500 text-stone-300 font-mono text-xs rounded pl-8 pr-7 py-2 appearance-none focus:outline-none focus:border-purple-500 transition cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="customer_asc">Sort: Customer A → Z</option>
              <option value="customer_desc">Sort: Customer Z → A</option>
              <option value="order_number_asc">Sort: Order # (Asc)</option>
              <option value="order_number_desc">Sort: Order # (Desc)</option>
              <option value="most_items">Sort: Most Items</option>
              <option value="fewest_items">Sort: Fewest Items</option>
            </select>
            <ChevronDown className="w-3 h-3 text-stone-500 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Mark All Remaining Ready Button */}
          <button
            type="button"
            onClick={onMarkAllRemainingReady}
            className="bg-transparent hover:bg-stone-900 border border-ink-rule hover:border-stone-500 text-stone-300 font-mono text-xs px-3 py-2 rounded transition cursor-pointer ml-auto sm:ml-0"
          >
            Mark all remaining Ready
          </button>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {isPanelOpen && (
        <div className="bg-ink-night border border-ink-rule rounded-lg p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-ink-rule/80">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-400" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-cream">
                Order Filters & Criteria
              </h4>
              {activeFilterCount > 0 && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                  {activeFilterCount} active
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onResetFilters}
              disabled={activeFilterCount === 0}
              className="font-mono text-[11px] text-stone-400 hover:text-cream flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>

          {/* Grid of Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Date & Time Filters */}
            <div className="space-y-3">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Date Range</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Dates' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: '7days', label: 'Last 7 Days' },
                  { id: '30days', label: 'Last 30 Days' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'prev_month', label: 'Prev Month' },
                  { id: 'custom', label: 'Custom' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => update({ datePreset: item.id as DateFilterPreset })}
                    className={`font-mono text-[10.5px] px-2.5 py-1 rounded transition cursor-pointer border ${
                      filters.datePreset === item.id
                        ? 'bg-purple-600 border-purple-500 text-white font-semibold'
                        : 'bg-ink-night-2 border-ink-rule text-stone-300 hover:border-stone-500'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {filters.datePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">Start Date</label>
                    <input
                      type="date"
                      value={filters.customStartDate || ''}
                      onChange={(e) => update({ customStartDate: e.target.value })}
                      className="w-full bg-ink-night-2 border border-ink-rule rounded px-2 py-1 text-xs text-cream focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">End Date</label>
                    <input
                      type="date"
                      value={filters.customEndDate || ''}
                      onChange={(e) => update({ customEndDate: e.target.value })}
                      className="w-full bg-ink-night-2 border border-ink-rule rounded px-2 py-1 text-xs text-cream focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Order Source & Status */}
            <div className="space-y-3">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Order Source</span>
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All Orders' },
                    { id: 'shopify', label: 'Shopify' },
                    { id: 'manual', label: 'Manual' },
                  ].map((src) => (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => update({ source: src.id as OrderSourceFilter })}
                      className={`font-mono text-[10.5px] px-3 py-1 rounded transition cursor-pointer border flex-1 text-center ${
                        filters.source === src.id
                          ? 'bg-purple-600 border-purple-500 text-white font-semibold'
                          : 'bg-ink-night-2 border-ink-rule text-stone-300 hover:border-stone-500'
                      }`}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>Status Filter</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'All Statuses' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'ready', label: 'Ready' },
                    { id: 'incoming', label: 'Incoming' },
                    { id: 'missing', label: 'Missing' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => update({ status: st.id as OrderStatusFilter })}
                      className={`font-mono text-[10.5px] px-2 py-1 rounded transition cursor-pointer border text-center ${
                        filters.status === st.id
                          ? 'bg-purple-600 border-purple-500 text-white font-semibold'
                          : 'bg-ink-night-2 border-ink-rule text-stone-300 hover:border-stone-500'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Quick Filter Toggles & Criteria */}
            <div className="space-y-3">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                <span>Quick Item Flags</span>
              </label>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => update({ hasMissing: !filters.hasMissing })}
                  className={`w-full text-left font-mono text-[11px] px-3 py-1.5 rounded transition cursor-pointer border flex items-center justify-between ${
                    filters.hasMissing
                      ? 'bg-red-950/80 border-red-600 text-red-200'
                      : 'bg-ink-night-2 border-ink-rule text-stone-300 hover:border-stone-500'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    Contains Missing Items
                  </span>
                  {filters.hasMissing && <X className="w-3 h-3 text-red-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => update({ hasIncoming: !filters.hasIncoming })}
                  className={`w-full text-left font-mono text-[11px] px-3 py-1.5 rounded transition cursor-pointer border flex items-center justify-between ${
                    filters.hasIncoming
                      ? 'bg-blue-950/80 border-blue-600 text-blue-200'
                      : 'bg-ink-night-2 border-ink-rule text-stone-300 hover:border-stone-500'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Contains Incoming Items
                  </span>
                  {filters.hasIncoming && <X className="w-3 h-3 text-blue-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => update({ hasReady: !filters.hasReady })}
                  className={`w-full text-left font-mono text-[11px] px-3 py-1.5 rounded transition cursor-pointer border flex items-center justify-between ${
                    filters.hasReady
                      ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                      : 'bg-ink-night-2 border-ink-rule text-stone-300 hover:border-stone-500'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Contains Ready Items
                  </span>
                  {filters.hasReady && <X className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Specific Fields row: Brand, Size, Color, SKU */}
          <div className="pt-3 border-t border-ink-rule/60 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] text-stone-400 mb-1">Customer Phone</label>
              <input
                type="text"
                placeholder="Phone number…"
                value={filters.customerPhone || ''}
                onChange={(e) => update({ customerPhone: e.target.value })}
                className="w-full bg-ink-night-2 border border-ink-rule rounded px-2.5 py-1 text-xs text-cream placeholder-stone-600 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-stone-400 mb-1">Product Brand</label>
              <input
                type="text"
                placeholder="e.g. BAPE, Nike…"
                value={filters.brand || ''}
                onChange={(e) => update({ brand: e.target.value })}
                className="w-full bg-ink-night-2 border border-ink-rule rounded px-2.5 py-1 text-xs text-cream placeholder-stone-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-stone-400 mb-1">Size / Variant</label>
              <input
                type="text"
                placeholder="e.g. S, M, XL…"
                value={filters.size || ''}
                onChange={(e) => update({ size: e.target.value })}
                className="w-full bg-ink-night-2 border border-ink-rule rounded px-2.5 py-1 text-xs text-cream placeholder-stone-600 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-stone-400 mb-1">SKU</label>
              <input
                type="text"
                placeholder="e.g. NIK-5126…"
                value={filters.sku || ''}
                onChange={(e) => update({ sku: e.target.value })}
                className="w-full bg-ink-night-2 border border-ink-rule rounded px-2.5 py-1 text-xs text-cream placeholder-stone-600 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips & Result Counter */}
      {hasAnyFilterOrSearch && (
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[11px] text-stone-400 font-medium">Active filters:</span>

            {/* Search query chip */}
            {filters.searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-200">
                <span>Search: &ldquo;{filters.searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => update({ searchQuery: '' })}
                  className="hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Date preset chip */}
            {filters.datePreset !== 'all' && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-200">
                <span>Date: {filters.datePreset}</span>
                <button
                  type="button"
                  onClick={() => update({ datePreset: 'all', customStartDate: undefined, customEndDate: undefined })}
                  className="hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Source chip */}
            {filters.source !== 'all' && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-200">
                <span>Source: {filters.source}</span>
                <button
                  type="button"
                  onClick={() => update({ source: 'all' })}
                  className="hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Status chip */}
            {filters.status !== 'all' && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-200">
                <span>Status: {filters.status}</span>
                <button
                  type="button"
                  onClick={() => update({ status: 'all' })}
                  className="hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Quick flags chips */}
            {filters.hasMissing && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-200">
                <span>Has Missing Items</span>
                <button
                  type="button"
                  onClick={() => update({ hasMissing: false })}
                  className="hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.hasIncoming && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-blue-200">
                <span>Has Incoming Items</span>
                <button
                  type="button"
                  onClick={() => update({ hasIncoming: false })}
                  className="hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.hasReady && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-200">
                <span>Has Ready Items</span>
                <button
                  type="button"
                  onClick={() => update({ hasReady: false })}
                  className="hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Brand chip */}
            {filters.brand && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-200">
                <span>Brand: {filters.brand}</span>
                <button
                  type="button"
                  onClick={() => update({ brand: undefined })}
                  className="hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Size chip */}
            {filters.size && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-200">
                <span>Size: {filters.size}</span>
                <button
                  type="button"
                  onClick={() => update({ size: undefined })}
                  className="hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* SKU chip */}
            {filters.sku && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-200">
                <span>SKU: {filters.sku}</span>
                <button
                  type="button"
                  onClick={() => update({ sku: undefined })}
                  className="hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Phone chip */}
            {filters.customerPhone && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-200">
                <span>Phone: {filters.customerPhone}</span>
                <button
                  type="button"
                  onClick={() => update({ customerPhone: undefined })}
                  className="hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={onResetFilters}
              className="font-mono text-[10.5px] text-stone-400 hover:text-red-400 underline underline-offset-2 ml-1 cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="font-mono text-[11px] text-stone-400 ml-auto">
            Showing <strong className="text-cream">{filteredOrdersCount}</strong> of{' '}
            <strong className="text-cream">{totalOrders}</strong> order{totalOrders === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  );
}
