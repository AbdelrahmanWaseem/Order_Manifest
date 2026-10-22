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
}: OrderGroupProps) {
  if (filteredItems.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Group Header */}
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h3 className="text-base font-bold text-cream">{order.customer}</h3>
          <span className="font-mono text-xs text-stamp-pending">{order.id}</span>
          <span className="font-mono text-[11.5px] text-stone-500">
            {totalItemCount} item{totalItemCount > 1 ? 's' : ''}
          </span>
          {activeFilter && (
            <span className="font-mono text-[11px] text-stone-400">
              ({filteredItems.length} of {totalItemCount} shown)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onMarkAllReady(order.id)}
          className="font-mono text-[10.5px] font-bold tracking-wider px-2.5 py-1 rounded-[3px] text-stamp-ready border border-stamp-ready hover:bg-stamp-ready hover:text-white transition cursor-pointer"
        >
          Mark all ready
        </button>
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
