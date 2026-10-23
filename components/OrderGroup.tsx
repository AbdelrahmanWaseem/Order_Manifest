'use client';

import React from 'react';
import { ManifestOrder, ManifestItem, ItemStatus } from '@/types/manifest';
import TicketCard from './TicketCard';

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

  return (
    <div className="mb-8">
      {/* Group Header */}
      <div className="flex items-baseline justify-between gap-3 mb-3.5 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-lg md:text-xl font-extrabold text-cream tracking-tight">{order.customer}</h3>
          <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-stamp-pending/15 text-stamp-pending border border-stamp-pending/30">
            {order.id}
          </span>
          {(order.source === 'manual' || order.id.startsWith('MAN-')) && (
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-[4px] bg-purple-950 text-purple-300 border border-purple-800 shadow-sm">
              Manual Order
            </span>
          )}
          {order.fulfillmentStatus && (
            <span
              className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-[4px] border shadow-sm ${
                order.fulfillmentStatus.toUpperCase() === 'FULFILLED'
                  ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                  : order.fulfillmentStatus.toUpperCase().includes('PARTIAL')
                  ? 'bg-blue-950/70 text-blue-400 border-blue-800'
                  : 'bg-amber-950/70 text-amber-400 border-amber-800'
              }`}
            >
              {order.fulfillmentStatus.toUpperCase() === 'FULFILLED'
                ? 'Fulfilled'
                : order.fulfillmentStatus.toUpperCase().includes('PARTIAL')
                ? 'Partially Fulfilled'
                : 'Unfulfilled'}
            </span>
          )}
          {order.customerPhone && (
            <span className="font-mono text-xs font-semibold text-stone-300">
              📞 {order.customerPhone}
            </span>
          )}
          {order.orderDate && (
            <span className="font-mono text-xs font-medium text-stone-400">
              📅 {new Date(order.orderDate).toLocaleDateString()}
            </span>
          )}
          <span className="font-mono text-xs font-bold text-stone-400">
            {totalItemCount} item{totalItemCount > 1 ? 's' : ''}
          </span>
          {activeFilter && (
            <span className="font-mono text-xs font-bold text-purple-400">
              ({filteredItems.length} of {totalItemCount} shown)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRemoveOrder(order.id)}
            className="font-mono text-xs font-semibold tracking-wider px-2.5 py-1 rounded-[4px] text-stone-400 hover:text-stamp-missing border border-ink-rule hover:border-stamp-missing transition cursor-pointer flex items-center gap-1"
            title="Remove this order from the board"
          >
            <span>✕</span>
            <span>Remove</span>
          </button>

          <button
            type="button"
            onClick={() => onMarkAllReady(order.id)}
            className="font-mono text-xs font-extrabold tracking-wider px-3 py-1 rounded-[4px] text-stamp-ready border border-stamp-ready hover:bg-stamp-ready hover:text-white transition cursor-pointer shadow-sm"
          >
            Mark all ready
          </button>
        </div>
      </div>

      {order.notes && (
        <div className="text-[11px] text-stone-300 bg-ink-night-2/70 border border-ink-rule/80 rounded px-3 py-1.5 mb-3 flex items-start gap-2">
          <span className="font-mono text-[10px] uppercase font-semibold text-stone-500 shrink-0">Note:</span>
          <span className="italic">{order.notes}</span>
        </div>
      )}

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
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
    </div>
  );
}
