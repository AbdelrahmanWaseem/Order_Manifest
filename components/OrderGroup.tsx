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
    <div className="mb-6 bg-surface border border-border rounded-lg p-4 sm:p-5 shadow-sm transition-colors">
      {/* Header Row */}
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
              <span className="text-sm font-semibold text-text tabular-nums">
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
                      : 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#451A03] dark:text-[#FDE68A]'
                  }`}
                >
                  {fulfillmentUpper === 'FULFILLED'
                    ? 'Fulfilled'
                    : fulfillmentUpper.includes('PARTIAL')
                    ? 'Partial'
                    : 'Unfulfilled'}
                </span>
              )}

              {/* All Items Stamped Badge when collapsed */}
              {allItemsStamped && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#BBF7D0] flex items-center gap-1">
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

        {/* Action buttons: Remove and Mark all ready + Expand/Collapse button */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onRemoveOrder(order.id)}
            className="h-9 px-3 bg-surface hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 border border-border hover:border-red-200 dark:hover:border-red-800 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Remove this order from manifest"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>

          {!allItemsReady && (
            <button
              type="button"
              onClick={() => onMarkAllReady(order.id)}
              className="h-9 px-3 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-text border border-border rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Mark all items in this order as Ready"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.25]" />
              <span>Mark all ready</span>
            </button>
          )}

          {allItemsStamped && (
            <button
              type="button"
              onClick={() => setIsManuallyExpanded(isCollapsed)}
              className="h-9 px-2.5 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-text-muted hover:text-text border border-border rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
              title={isCollapsed ? 'Expand items' : 'Collapse items'}
            >
              {isCollapsed ? (
                <>
                  <span>View items</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Collapse</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              )}
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

      {/* Responsive Item Cards Grid: repeat(auto-fill, minmax(260px, 1fr)) */}
      {!isCollapsed && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 pt-3.5">
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
      )}
    </div>
  );
}
