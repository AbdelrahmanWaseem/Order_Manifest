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
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h3 className="text-base font-bold text-cream">{order.customer}</h3>
          <span className="font-mono text-xs text-stamp-pending">{order.id}</span>
          {order.fulfillmentStatus && (
            <span
              className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-[3px] border ${
                order.fulfillmentStatus.toUpperCase() === 'FULFILLED'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : order.fulfillmentStatus.toUpperCase().includes('PARTIAL')
                  ? 'bg-blue-950/60 text-blue-400 border-blue-800/60'
                  : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
              }`}
            >
              {order.fulfillmentStatus.toUpperCase() === 'FULFILLED'
                ? 'Fulfilled'
                : order.fulfillmentStatus.toUpperCase().includes('PARTIAL')
                ? 'Partially Fulfilled'
                : 'Unfulfilled'}
            </span>
          )}
          <span className="font-mono text-[11.5px] text-stone-500">
            {totalItemCount} item{totalItemCount > 1 ? 's' : ''}
          </span>
          {activeFilter && (
            <span className="font-mono text-[11px] text-stone-400">
              ({filteredItems.length} of {totalItemCount} shown)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRemoveOrder(order.id)}
            className="font-mono text-[10.5px] font-medium tracking-wider px-2 py-1 rounded-[3px] text-stone-400 hover:text-stamp-missing border border-ink-rule hover:border-stamp-missing transition cursor-pointer flex items-center gap-1"
            title="Remove this order from the board"
          >
            <span>✕</span>
            <span>Remove</span>
          </button>

          <button
            type="button"
            onClick={() => onMarkAllReady(order.id)}
            className="font-mono text-[10.5px] font-bold tracking-wider px-2.5 py-1 rounded-[3px] text-stamp-ready border border-stamp-ready hover:bg-stamp-ready hover:text-white transition cursor-pointer"
          >
            Mark all ready
          </button>
        </div>
      </div>

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
