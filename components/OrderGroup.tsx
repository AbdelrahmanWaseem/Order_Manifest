'use client';

import React, { useState } from 'react';
import { ManifestOrder, ManifestItem, ItemStatus } from '@/types/manifest';
import TicketCard from './TicketCard';
import { getCustomerInitials } from '@/lib/utils';
import { Phone, Calendar, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface OrderGroupProps {
  order: ManifestOrder;
  filteredItems: ManifestItem[];
  totalItemCount: number;
  activeFilter: ItemStatus | null;
  onSetStatus: (orderId: string, itemId: string, status: ItemStatus) => void;
  onCycleStatus: (orderId: string, itemId: string) => void;
  onSetNote: (orderId: string, itemId: string, note: string) => void;
  onMarkAllReady: (orderId: string) => void;
  onRemoveOrder: (orderId: string) => void;
}

export default function OrderGroup({
  order,
  filteredItems,
  totalItemCount,
  activeFilter,
  onSetStatus,
  onCycleStatus,
  onSetNote,
  onMarkAllReady,
  onRemoveOrder,
}: OrderGroupProps) {
  if (filteredItems.length === 0) return null;

  const initials = getCustomerInitials(order.customer);
  const isManual = order.source === 'manual' || order.id.startsWith('MAN-');
  const isInstagram = Boolean(order.tags?.some((t) => t.toLowerCase().includes('ig') || t.toLowerCase().includes('instagram')));

  // Check if every item in this order is stamped (i.e. not pending)
  const allItemsStamped = order.items.length > 0 && order.items.every((i) => i.status !== 'pending');
  const allItemsReady = order.items.length > 0 && order.items.every((i) => i.status === 'ready');

  // Allow collapsing when all items are stamped
  const [isManuallyExpanded, setIsManuallyExpanded] = useState<boolean | null>(null);

  // If all items are stamped, default to collapsed unless user explicitly expanded
  const isCollapsed = allItemsStamped && isManuallyExpanded !== true;

  const fulfillmentUpper = order.fulfillmentStatus?.toUpperCase();

  return (
    <div className={`bg-surface border border-border rounded-lg shadow-sm transition-colors ${isCollapsed ? 'mb-3 p-3.5 sm:p-4' : 'mb-6 p-4 sm:p-5'}`}>
      {isCollapsed ? (
        /* Compact 1-row view for fully-stamped orders */
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3 min-w-0 flex-wrap">
            <div className="w-8 h-8 rounded-full bg-bg border border-border text-text font-semibold flex items-center justify-center text-xs shrink-0 select-none">
              {initials}
            </div>

            <h3 className="text-[15px] font-semibold text-text tracking-tight truncate max-w-[200px] sm:max-w-none" dir="auto">
              {order.customer}
            </h3>

            <span className="text-sm font-bold text-text tabular-nums">
              {order.id}
            </span>

            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] dark:bg-[#14532D] dark:text-[#BBF7D0] dark:border-[#166534] flex items-center gap-1">
              ✓ All items ready
            </span>

            <span className="text-xs text-text-muted tabular-nums hidden sm:inline-block">
              ({order.items.length} item{order.items.length > 1 ? 's' : ''})
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => onRemoveOrder(order.id)}
              className="h-8 px-2.5 bg-surface dark:bg-[#1E293B] hover:bg-red-50 dark:hover:bg-red-950/20 text-text hover:text-red-600 border border-border rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
              title="Remove order from manifest"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Remove</span>
            </button>

            <button
              type="button"
              onClick={() => setIsManuallyExpanded(true)}
              className="h-8 px-2.5 bg-surface dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 text-text border border-border rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
              title="Expand order items"
            >
              <span>Expand</span>
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>
      ) : (
        /* Full Expanded view */
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Customer Avatar - Arabic compatible */}
              <div className="w-9 h-9 rounded-full bg-bg border border-border text-text font-semibold flex items-center justify-center text-xs shrink-0 select-none">
                {initials}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Customer Name with dir="auto" */}
                  <h3 className="text-base font-semibold text-text tracking-tight" dir="auto">
                    {order.customer}
                  </h3>

                  {/* Order Number - Bold text, tabular-nums (NO ORANGE) */}
                  <span className="text-sm font-bold text-text tabular-nums">
                    {order.id}
                  </span>

                  {/* Tag Pills */}
                  {isManual && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-bg text-text-muted border border-border">
                      Manual Order
                    </span>
                  )}

                  {isInstagram && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-bg text-text-muted border border-border">
                      IG order
                    </span>
                  )}

                  {/* Fulfillment Status */}
                  {fulfillmentUpper && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        fulfillmentUpper === 'FULFILLED'
                          ? 'bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#BBF7D0]'
                          : fulfillmentUpper.includes('PARTIAL')
                          ? 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A] dark:text-[#BFDBFE]'
                          : 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F] dark:text-[#FDE68A]'
                      }`}
                    >
                      {fulfillmentUpper === 'FULFILLED'
                        ? 'Fulfilled'
                        : fulfillmentUpper.includes('PARTIAL')
                        ? 'Partial'
                        : 'Unfulfilled'}
                    </span>
                  )}

                  {/* All Items Stamped Badge */}
                  {allItemsStamped && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] dark:bg-[#14532D] dark:text-[#BBF7D0] dark:border-[#166534] flex items-center gap-1">
                      ✓ {allItemsReady ? 'All items ready' : 'All items stamped'}
                    </span>
                  )}
                </div>

                {/* Sub-row metadata: phone, date, items count */}
                <div className="flex items-center gap-3 text-xs text-text-muted mt-1 flex-wrap">
                  {order.customerPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-text-muted" />
                      <span className="tabular-nums" dir="ltr">{order.customerPhone}</span>
                    </span>
                  )}

                  {order.orderDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      <span className="tabular-nums">{new Date(order.orderDate).toLocaleDateString()}</span>
                    </span>
                  )}

                  <span className="tabular-nums">
                    {totalItemCount} item{totalItemCount > 1 ? 's' : ''}
                  </span>

                  {activeFilter && (
                    <span>({filteredItems.length} matching filter)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons: Remove and Mark all ready + Collapse button */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => onRemoveOrder(order.id)}
                className="h-9 px-3 bg-surface dark:bg-[#1E293B] hover:bg-red-50 dark:hover:bg-red-950/20 text-text hover:text-red-600 border border-border rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Remove this order from manifest"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>

              {!allItemsReady && (
                <button
                  type="button"
                  onClick={() => onMarkAllReady(order.id)}
                  className="h-9 px-3 bg-surface dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 text-text border border-border rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Mark all items in this order as Ready"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.25]" />
                  <span>Mark all ready</span>
                </button>
              )}

              {allItemsStamped && (
                <button
                  type="button"
                  onClick={() => setIsManuallyExpanded(false)}
                  className="h-9 px-2.5 bg-surface dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 text-text border border-border rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Collapse items"
                >
                  <span>Collapse</span>
                  <ChevronUp className="w-4 h-4 text-text-muted" />
                </button>
              )}
            </div>
          </div>

          {/* Order Notes Banner */}
          {order.notes && (
            <div className="text-xs text-text-muted bg-bg border border-border rounded-md px-3 py-2 mt-3 flex items-start gap-2">
              <span className="font-semibold text-text shrink-0">Note:</span>
              <span>{order.notes}</span>
            </div>
          )}

          {/* Responsive Item Cards Grid: minmax(280px, 1fr), stacked on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 pt-3.5">
            {filteredItems.map((item) => (
              <TicketCard
                key={item.id}
                orderId={order.id}
                item={item}
                onSetStatus={onSetStatus}
                onCycleStatus={onCycleStatus}
                onSetNote={onSetNote}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
