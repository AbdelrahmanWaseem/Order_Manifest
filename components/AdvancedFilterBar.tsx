'use client';

import React, { useState } from 'react';
import {
  OrderFilterState,
  OrderSortOption,
  DateFilterPreset,
  OrderSourceFilter,
  OrderStatusFilter,
} from '@/types/manifest';
import {
  Search,
  Filter,
  ArrowUpDown,
  X,
  Check,
  Calendar,
  Layers,
  Tag,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';

interface AdvancedFilterBarProps {
  filters: OrderFilterState;
  onFilterChange: (filters: OrderFilterState) => void;
  onResetFilters: () => void;
  totalOrders: number;
  filteredOrdersCount: number;
  onMarkAllRemainingReady?: () => void;
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

  const update = (partial: Partial<OrderFilterState>) => {
    onFilterChange({ ...filters, ...partial });
  };

  const activeFilterCount = [
    filters.datePreset !== 'all',
    filters.source !== 'all',
    filters.status !== 'all',
    Boolean(filters.customerPhone?.trim()),
    Boolean(filters.brand?.trim()),
    Boolean(filters.size?.trim()),
    Boolean(filters.sku?.trim()),
    filters.hasMissing,
    filters.hasIncoming,
    filters.hasReady,
  ].filter(Boolean).length;

  const hasAnyFilterOrSearch =
    Boolean(filters.searchQuery.trim()) || activeFilterCount > 0;

  return (
    <div className="space-y-3 mb-6">
      {/* Primary Tidy Toolbar */}
      <div className="bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search customer, phone, order #, product, size, color, or SKU…"
            value={filters.searchQuery}
            onChange={(e) => update({ searchQuery: e.target.value })}
            className="w-full h-10 bg-bg border border-border rounded-lg pl-9 pr-9 text-sm text-text placeholder-[#9CA3AF] focus:border-accent"
          />
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-3 pointer-events-none" />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => update({ searchQuery: '' })}
              className="text-text-muted hover:text-text absolute right-3 top-3 p-0.5 rounded cursor-pointer"
              title="Clear search query"
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
            className={`h-10 px-3.5 rounded-lg border text-sm font-medium transition cursor-pointer flex items-center gap-2 shadow-sm ${
              isPanelOpen || activeFilterCount > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
                : 'bg-surface border-border text-text hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter className="w-4 h-4 text-text-muted" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-semibold tabular-nums">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-text-muted transition-transform duration-150 ${
                isPanelOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
            <select
              value={filters.sortBy}
              onChange={(e) => update({ sortBy: e.target.value as OrderSortOption })}
              className="h-10 bg-surface border border-border hover:border-text-muted text-text text-sm font-medium rounded-lg pl-9 pr-8 appearance-none transition cursor-pointer shadow-sm"
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
            <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-3 pointer-events-none" />
          </div>

          {/* Mark All Remaining Ready Button: Clean Secondary Button */}
          {onMarkAllRemainingReady && (
            <button
              type="button"
              onClick={onMarkAllRemainingReady}
              className="h-10 px-3.5 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-text border border-border rounded-lg text-sm font-medium transition cursor-pointer ml-auto sm:ml-0 flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.25]" />
              <span>Mark all ready</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {isPanelOpen && (
        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-muted" />
              <h4 className="text-sm font-semibold text-text">
                Filter Criteria
              </h4>
              {activeFilterCount > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-bg text-text-muted border border-border tabular-nums">
                  {activeFilterCount} active
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onResetFilters}
              disabled={activeFilterCount === 0}
              className="text-xs text-text-muted hover:text-text flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset all</span>
            </button>
          </div>

          {/* Grid of Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Date Range */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
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
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition cursor-pointer border ${
                      filters.datePreset === item.id
                        ? 'bg-accent text-white border-accent'
                        : 'bg-bg border-border text-text hover:border-text-muted'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {filters.datePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.customStartDate || ''}
                      onChange={(e) => update({ customStartDate: e.target.value })}
                      className="w-full h-9 bg-bg border border-border rounded-md px-2 text-xs text-text focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.customEndDate || ''}
                      onChange={(e) => update({ customEndDate: e.target.value })}
                      className="w-full h-9 bg-bg border border-border rounded-md px-2 text-xs text-text focus:border-accent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Order Source & Status */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5 mb-2">
                  <Layers className="w-3.5 h-3.5 text-text-muted" />
                  <span>Order Source</span>
                </label>
                <div className="flex gap-1.5">
                  {[
                    { id: 'all', label: 'All Orders' },
                    { id: 'shopify', label: 'Shopify' },
                    { id: 'manual', label: 'Manual' },
                  ].map((src) => (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => update({ source: src.id as OrderSourceFilter })}
                      className={`text-xs px-2.5 py-1.5 rounded-md transition cursor-pointer border flex-1 text-center font-medium ${
                        filters.source === src.id
                          ? 'bg-accent text-white border-accent'
                          : 'bg-bg border-border text-text hover:border-text-muted'
                      }`}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-text-muted" />
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
                      className={`text-xs px-2.5 py-1.5 rounded-md transition cursor-pointer border text-center font-medium ${
                        filters.status === st.id
                          ? 'bg-accent text-white border-accent'
                          : 'bg-bg border-border text-text hover:border-text-muted'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Quick Filter Flags */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                <span>Quick Status Flags</span>
              </label>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => update({ hasMissing: !filters.hasMissing })}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition cursor-pointer border flex items-center justify-between font-medium ${
                    filters.hasMissing
                      ? 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B] dark:bg-[#7F1D1D] dark:border-[#991B1B] dark:text-[#FECACA]'
                      : 'bg-bg border-border text-text hover:border-text-muted'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Contains Missing Items
                  </span>
                  {filters.hasMissing && <X className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => update({ hasIncoming: !filters.hasIncoming })}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition cursor-pointer border flex items-center justify-between font-medium ${
                    filters.hasIncoming
                      ? 'bg-[#DBEAFE] border-[#BFDBFE] text-[#1E40AF] dark:bg-[#1E3A8A] dark:border-[#1E40AF] dark:text-[#BFDBFE]'
                      : 'bg-bg border-border text-text hover:border-text-muted'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Contains Incoming Items
                  </span>
                  {filters.hasIncoming && <X className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => update({ hasReady: !filters.hasReady })}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition cursor-pointer border flex items-center justify-between font-medium ${
                    filters.hasReady
                      ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#166534] dark:bg-[#14532D] dark:border-[#166534] dark:text-[#BBF7D0]'
                      : 'bg-bg border-border text-text hover:border-text-muted'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Contains Ready Items
                  </span>
                  {filters.hasReady && <X className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Specific Fields row */}
          <div className="pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1 font-medium">Customer Phone</label>
              <input
                type="text"
                placeholder="Phone number…"
                value={filters.customerPhone || ''}
                onChange={(e) => update({ customerPhone: e.target.value })}
                className="w-full h-9 bg-bg border border-border rounded-md px-2.5 text-xs text-text placeholder-[#9CA3AF] focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1 font-medium">Product Brand</label>
              <input
                type="text"
                placeholder="e.g. BAPE, Nike…"
                value={filters.brand || ''}
                onChange={(e) => update({ brand: e.target.value })}
                className="w-full h-9 bg-bg border border-border rounded-md px-2.5 text-xs text-text placeholder-[#9CA3AF] focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1 font-medium">Size / Variant</label>
              <input
                type="text"
                placeholder="e.g. S, M, XL…"
                value={filters.size || ''}
                onChange={(e) => update({ size: e.target.value })}
                className="w-full h-9 bg-bg border border-border rounded-md px-2.5 text-xs text-text placeholder-[#9CA3AF] focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1 font-medium">SKU</label>
              <input
                type="text"
                placeholder="e.g. NIK-5126…"
                value={filters.sku || ''}
                onChange={(e) => update({ sku: e.target.value })}
                className="w-full h-9 bg-bg border border-border rounded-md px-2.5 text-xs text-text placeholder-[#9CA3AF] focus:border-accent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips & Result Counter */}
      {hasAnyFilterOrSearch && (
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-text-muted font-medium">Active filters:</span>

            {/* Search query chip */}
            {filters.searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-surface border border-border text-text shadow-sm">
                <span>&ldquo;{filters.searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => update({ searchQuery: '' })}
                  className="hover:text-red-500 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Date preset chip */}
            {filters.datePreset !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-surface border border-border text-text shadow-sm">
                <span>Date: {filters.datePreset}</span>
                <button
                  type="button"
                  onClick={() => update({ datePreset: 'all', customStartDate: undefined, customEndDate: undefined })}
                  className="hover:text-red-500 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Source chip */}
            {filters.source !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-surface border border-border text-text shadow-sm">
                <span>Source: {filters.source}</span>
                <button
                  type="button"
                  onClick={() => update({ source: 'all' })}
                  className="hover:text-red-500 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Status chip */}
            {filters.status !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-surface border border-border text-text shadow-sm">
                <span>Status: {filters.status}</span>
                <button
                  type="button"
                  onClick={() => update({ status: 'all' })}
                  className="hover:text-red-500 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Phone chip */}
            {filters.customerPhone?.trim() && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-surface border border-border text-text shadow-sm">
                <span>Phone: {filters.customerPhone}</span>
                <button
                  type="button"
                  onClick={() => update({ customerPhone: '' })}
                  className="hover:text-red-500 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Brand chip */}
            {filters.brand?.trim() && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-surface border border-border text-text shadow-sm">
                <span>Brand: {filters.brand}</span>
                <button
                  type="button"
                  onClick={() => update({ brand: '' })}
                  className="hover:text-red-500 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Size chip */}
            {filters.size?.trim() && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-surface border border-border text-text shadow-sm">
                <span>Size: {filters.size}</span>
                <button
                  type="button"
                  onClick={() => update({ size: '' })}
                  className="hover:text-red-500 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* SKU chip */}
            {filters.sku?.trim() && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-surface border border-border text-text shadow-sm">
                <span>SKU: {filters.sku}</span>
                <button
                  type="button"
                  onClick={() => update({ sku: '' })}
                  className="hover:text-red-500 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Flag chips */}
            {filters.hasMissing && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D] dark:text-[#FECACA]">
                <span>Missing items</span>
                <button
                  type="button"
                  onClick={() => update({ hasMissing: false })}
                  className="hover:opacity-75 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.hasIncoming && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A] dark:text-[#BFDBFE]">
                <span>Incoming items</span>
                <button
                  type="button"
                  onClick={() => update({ hasIncoming: false })}
                  className="hover:opacity-75 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.hasReady && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#BBF7D0]">
                <span>Ready items</span>
                <button
                  type="button"
                  onClick={() => update({ hasReady: false })}
                  className="hover:opacity-75 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-text-muted hover:text-text underline underline-offset-2 ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>

          <div className="text-xs text-text-muted ml-auto">
            Showing <strong className="text-text tabular-nums">{filteredOrdersCount}</strong> of{' '}
            <strong className="text-text tabular-nums">{totalOrders}</strong> order{totalOrders === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  );
}
