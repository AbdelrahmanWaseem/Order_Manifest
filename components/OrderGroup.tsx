'use client';

import React from 'react';
import { ManifestOrder, ManifestItem, ItemStatus } from '@/types/manifest';
import TicketCard from './TicketCard';
import { User, Phone, Calendar, CheckCircle2, Trash2 } from 'lucide-react';

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
    <div className="mb-9 bg-ink-night-2/60 border border-ink-rule/80 rounded-2xl p-4 sm:p-5 shadow-sm backdrop-blur-sm">
      {/* Group Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3.5 border-b border-ink-rule/70 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Customer Avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-md shrink-0">
            {initials}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-extrabold text-cream tracking-tight">
                {order.customer}
              </h3>

              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {order.id}
              </span>

              {isManual && (
                <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm">
                  Manual Order
                </span>
              )}

              {order.fulfillmentStatus && (
                <span
                  className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-lg border shadow-sm ${
                    order.fulfillmentStatus.toUpperCase() === 'FULFILLED'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : order.fulfillmentStatus.toUpperCase().includes('PARTIAL')
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {order.fulfillmentStatus.toUpperCase() === 'FULFILLED'
                    ? 'Fulfilled'
                    : order.fulfillmentStatus.toUpperCase().includes('PARTIAL')
                    ? 'Partially Fulfilled'
                    : 'Unfulfilled'}
                </span>
              )}
            </div>

            {/* Sub-row metadata: phone, date, items count */}
            <div className="flex items-center gap-3 text-xs text-stone-400 font-mono mt-1 flex-wrap">
              {order.customerPhone && (
                <span className="flex items-center gap-1 text-stone-300 font-medium">
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

              <span className="text-stone-300 font-bold">
                {totalItemCount} item{totalItemCount > 1 ? 's' : ''}
              </span>

              {activeFilter && (
                <span className="text-purple-400 font-bold">
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
            className="font-mono text-xs font-semibold px-3 py-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 border border-ink-rule hover:border-rose-500/30 transition-all duration-150 cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Remove this order from the manifest"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>

          <button
            type="button"
            onClick={() => onMarkAllReady(order.id)}
            className="font-mono text-xs font-extrabold tracking-wider px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark all ready</span>
          </button>
        </div>
      </div>

      {/* Order Notes Banner */}
      {order.notes && (
        <div className="text-xs text-stone-200 bg-ink-night border border-ink-rule rounded-xl px-3.5 py-2 mb-4 flex items-start gap-2 shadow-inner">
          <span className="font-mono text-[10px] uppercase font-bold text-purple-400 shrink-0 mt-0.5">
            Note:
          </span>
          <span className="italic">{order.notes}</span>
        </div>
      )}

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
