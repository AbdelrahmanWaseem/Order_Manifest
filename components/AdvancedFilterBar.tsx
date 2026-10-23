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
  ArrowUpDown,
  Check,
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
    <div className="space-y-3.5 mb-7">
      {/* Primary Bar: Floating modern island */}
      <div className="bg-ink-night-2/90 border border-ink-rule/80 rounded-2xl p-2.5 sm:p-3 shadow-lg backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search customer, phone, order #, product name, size, color, or SKU…"
            value={filters.searchQuery}
            onChange={(e) => update({ searchQuery: e.target.value })}
            className="w-full bg-ink-night border border-ink-rule/80 rounded-xl px-4 py-2.5 pl-10 pr-9 text-xs sm:text-sm font-semibold text-cream placeholder-stone-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => update({ searchQuery: '' })}
              className="text-stone-400 hover:text-cream absolute right-3 top-3 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setIsPanelOpen((prev) => !prev)}
            className={`font-mono text-xs font-bold px-4 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center gap-2 shadow-sm active:scale-95 ${
              isPanelOpen || activeFilterCount > 0
                ? 'bg-purple-500/15 border-purple-500 text-purple-300 ring-1 ring-purple-500/30'
                : 'bg-ink-night border-ink-rule hover:border-stone-400 text-stone-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] flex items-center justify-center font-black shadow-sm">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isPanelOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
            <select
              value={filters.sortBy}
              onChange={(e) => update({ sortBy: e.target.value as OrderSortOption })}
              className="bg-ink-night border border-ink-rule hover:border-stone-400 text-stone-200 font-mono text-xs font-bold rounded-xl pl-8 pr-8 py-2.5 appearance-none focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer shadow-sm"
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
            <ChevronDown className="w-3 h-3 text-stone-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Mark All Remaining Ready Button */}
          <button
            type="button"
            onClick={onMarkAllRemainingReady}
            className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 font-mono text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ml-auto sm:ml-0 shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Mark all ready</span>
          </button>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {isPanelOpen && (
        <div className="bg-ink-night-2 border border-ink-rule rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in duration-150 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3.5 border-b border-ink-rule/80">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-mono text-xs font-black uppercase tracking-wider text-cream">
                  Filter & Search Controls
                </h4>
                <p className="text-[11px] text-stone-400">
                  Combine multiple criteria with real-time live preview
                </p>
              </div>
              {activeFilterCount > 0 && (
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {activeFilterCount} active
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onResetFilters}
              disabled={activeFilterCount === 0}
              className="font-mono text-xs font-bold text-stone-400 hover:text-cream flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-ink-night px-3 py-1.5 rounded-lg border border-ink-rule"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>

          {/* Grid of Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Date Range */}
            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-300 font-extrabold flex items-center gap-1.5">
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
                    className={`font-mono text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer border ${
                      filters.datePreset === item.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 text-white shadow-sm'
                        : 'bg-ink-night border-ink-rule text-stone-300 hover:border-stone-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {filters.datePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.customStartDate || ''}
                      onChange={(e) => update({ customStartDate: e.target.value })}
                      className="w-full bg-ink-night border border-ink-rule rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cream focus:outline-none focus:border-purple-500 font-mono shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.customEndDate || ''}
                      onChange={(e) => update({ customEndDate: e.target.value })}
                      className="w-full bg-ink-night border border-ink-rule rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cream focus:outline-none focus:border-purple-500 font-mono shadow-inner"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Order Source & Status */}
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-stone-300 font-extrabold mb-2 flex items-center gap-1.5">
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
                      className={`font-mono text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer border flex-1 text-center ${
                        filters.source === src.id
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 text-white shadow-sm'
                          : 'bg-ink-night border-ink-rule text-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-stone-300 font-extrabold mb-2 flex items-center gap-1.5">
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
                      className={`font-mono text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer border text-center ${
                        filters.status === st.id
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 text-white shadow-sm'
                          : 'bg-ink-night border-ink-rule text-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Quick Filter Flags */}
            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-300 font-extrabold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                <span>Quick Status Flags</span>
              </label>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => update({ hasMissing: !filters.hasMissing })}
                  className={`w-full text-left font-mono text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer border flex items-center justify-between ${
                    filters.hasMissing
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500/30'
                      : 'bg-ink-night border-ink-rule text-stone-300 hover:border-stone-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    Contains Missing Items
                  </span>
                  {filters.hasMissing && <X className="w-3.5 h-3.5 text-rose-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => update({ hasIncoming: !filters.hasIncoming })}
                  className={`w-full text-left font-mono text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer border flex items-center justify-between ${
                    filters.hasIncoming
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/30'
                      : 'bg-ink-night border-ink-rule text-stone-300 hover:border-stone-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Contains Incoming Items
                  </span>
                  {filters.hasIncoming && <X className="w-3.5 h-3.5 text-blue-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => update({ hasReady: !filters.hasReady })}
                  className={`w-full text-left font-mono text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer border flex items-center justify-between ${
                    filters.hasReady
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-ink-night border-ink-rule text-stone-300 hover:border-stone-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Contains Ready Items
                  </span>
                  {filters.hasReady && <X className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Specific Fields row */}
          <div className="pt-4 border-t border-ink-rule/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Customer Phone</label>
              <input
                type="text"
                placeholder="Phone number…"
                value={filters.customerPhone || ''}
                onChange={(e) => update({ customerPhone: e.target.value })}
                className="w-full bg-ink-night border border-ink-rule rounded-lg px-3 py-1.5 text-xs font-medium text-cream placeholder-stone-500 focus:outline-none focus:border-purple-500 font-mono shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Product Brand</label>
              <input
                type="text"
                placeholder="e.g. BAPE, Nike…"
                value={filters.brand || ''}
                onChange={(e) => update({ brand: e.target.value })}
                className="w-full bg-ink-night border border-ink-rule rounded-lg px-3 py-1.5 text-xs font-medium text-cream placeholder-stone-500 focus:outline-none focus:border-purple-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Size / Variant</label>
              <input
                type="text"
                placeholder="e.g. S, M, XL…"
                value={filters.size || ''}
                onChange={(e) => update({ size: e.target.value })}
                className="w-full bg-ink-night border border-ink-rule rounded-lg px-3 py-1.5 text-xs font-bold text-cream placeholder-stone-500 focus:outline-none focus:border-purple-500 font-mono shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">SKU</label>
              <input
                type="text"
                placeholder="e.g. NIK-5126…"
                value={filters.sku || ''}
                onChange={(e) => update({ sku: e.target.value })}
                className="w-full bg-ink-night border border-ink-rule rounded-lg px-3 py-1.5 text-xs font-bold text-cream placeholder-stone-500 focus:outline-none focus:border-purple-500 font-mono shadow-inner"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips & Result Counter */}
      {hasAnyFilterOrSearch && (
        <div className="flex items-center justify-between gap-2.5 flex-wrap text-xs pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-stone-400 font-bold">Active:</span>

            {/* Search query chip */}
            {filters.searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 shadow-sm">
                <span>&ldquo;{filters.searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => update({ searchQuery: '' })}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {/* Date preset chip */}
            {filters.datePreset !== 'all' && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 shadow-sm">
                <span>Date: {filters.datePreset}</span>
                <button
                  type="button"
                  onClick={() => update({ datePreset: 'all', customStartDate: undefined, customEndDate: undefined })}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {/* Source chip */}
            {filters.source !== 'all' && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 shadow-sm">
                <span>Source: {filters.source}</span>
                <button
                  type="button"
                  onClick={() => update({ source: 'all' })}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {/* Status chip */}
            {filters.status !== 'all' && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 shadow-sm">
                <span>Status: {filters.status}</span>
                <button
                  type="button"
                  onClick={() => update({ status: 'all' })}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {/* Quick flags chips */}
            {filters.hasMissing && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-sm">
                <span>Has Missing Items</span>
                <button
                  type="button"
                  onClick={() => update({ hasMissing: false })}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.hasIncoming && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 shadow-sm">
                <span>Has Incoming Items</span>
                <button
                  type="button"
                  onClick={() => update({ hasIncoming: false })}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.hasReady && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm">
                <span>Has Ready Items</span>
                <button
                  type="button"
                  onClick={() => update({ hasReady: false })}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.brand && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 shadow-sm">
                <span>Brand: {filters.brand}</span>
                <button
                  type="button"
                  onClick={() => update({ brand: undefined })}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.size && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 shadow-sm">
                <span>Size: {filters.size}</span>
                <button
                  type="button"
                  onClick={() => update({ size: undefined })}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.sku && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 shadow-sm">
                <span>SKU: {filters.sku}</span>
                <button
                  type="button"
                  onClick={() => update({ sku: undefined })}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={onResetFilters}
              className="font-mono text-xs font-bold text-stone-400 hover:text-rose-400 underline underline-offset-4 ml-1 cursor-pointer transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="font-mono text-xs font-bold text-stone-400 ml-auto">
            Showing <strong className="text-cream font-black">{filteredOrdersCount}</strong> of{' '}
            <strong className="text-cream font-black">{totalOrders}</strong> order{totalOrders === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  );
}
