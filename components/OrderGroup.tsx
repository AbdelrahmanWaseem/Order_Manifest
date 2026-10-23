'use client';

import React from 'react';
import { ManifestOrder, ManifestItem, ItemStatus } from '@/types/manifest';
import TicketCard from './TicketCard';
import { Phone, Calendar, Check, Trash2 } from 'lucide-react';

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

  // Generate 2-letter customer initials for avatar
  const initials = order.customer
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CU';

  const isManual = order.source === 'manual' || order.id.startsWith('MAN-');

  return (
    <div className="mb-8 bg-ink-night-2 border border-ink-rule rounded-xl p-4 sm:p-5 shadow-sm">
      {/* Group Header */}
      <div className="flex items-center justify-between gap-3 mb-3.5 pb-3 border-b border-ink-rule flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Customer Avatar */}
          <div className="w-8 h-8 rounded-lg bg-ink-night-3 border border-ink-rule text-stone-300 font-bold flex items-center justify-center text-xs shrink-0">
            {initials}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-cream tracking-tight">
                {order.customer}
              </h3>

              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-ink-night border border-ink-rule text-stone-300">
                {order.id}
              </span>

              {isManual && (
                <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Manual Order
                </span>
              )}

              {order.fulfillmentStatus && (
                <span
                  className={`font-mono text-[11px] font-medium px-2 py-0.5 rounded border ${
                    order.fulfillmentStatus.toUpperCase() === 'FULFILLED'
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                      : order.fulfillmentStatus.toUpperCase().includes('PARTIAL')
                      ? 'bg-blue-950/40 text-blue-300 border-blue-800/40'
                      : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                  }`}
                >
                  {order.fulfillmentStatus.toUpperCase() === 'FULFILLED'
                    ? 'Fulfilled'
                    : order.fulfillmentStatus.toUpperCase().includes('PARTIAL')
                    ? 'Partial'
                    : 'Unfulfilled'}
                </span>
              )}
            </div>

            {/* Sub-row metadata: phone, date, items count */}
            <div className="flex items-center gap-3 text-xs text-stone-400 font-mono mt-0.5 flex-wrap">
              {order.customerPhone && (
                <span className="flex items-center gap-1 text-stone-300">
                  <Phone className="w-3 h-3 text-stone-400" />
                  <span>{order.customerPhone}</span>
                </span>
              )}

              {order.orderDate && (
                <span className="flex items-center gap-1 text-stone-400">
                  <Calendar className="w-3 h-3 text-stone-500" />
                  <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                </span>
              )}

              <span className="text-stone-300">
                {totalItemCount} item{totalItemCount > 1 ? 's' : ''}
              </span>

              {activeFilter && (
                <span className="text-stone-400">
                  ({filteredItems.length} matching filter)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons: Remove and Mark all ready */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRemoveOrder(order.id)}
            className="font-mono text-xs font-medium px-2.5 py-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-ink-night-3 border border-ink-rule transition cursor-pointer flex items-center gap-1"
            title="Remove this order from the manifest"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>

          <button
            type="button"
            onClick={() => onMarkAllReady(order.id)}
            className="font-mono text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-800 text-emerald-300 hover:text-white border border-emerald-800/40 transition cursor-pointer flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Mark all ready</span>
          </button>
        </div>
      </div>

      {/* Order Notes Banner */}
      {order.notes && (
        <div className="text-xs text-stone-300 bg-ink-night border border-ink-rule rounded-lg px-3 py-1.5 mb-3.5 flex items-start gap-2">
          <span className="font-mono text-[10px] uppercase font-bold text-stone-400 shrink-0 mt-0.5">
            Note:
          </span>
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
