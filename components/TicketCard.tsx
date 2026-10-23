'use client';

import React from 'react';
import { ManifestItem, ItemStatus } from '@/types/manifest';
import { Check, Clock, AlertOctagon, RotateCcw } from 'lucide-react';

interface TicketCardProps {
  orderId: string;
  item: ManifestItem;
  onSetStatus: (orderId: string, itemId: string, status: ItemStatus) => void;
  onCycleStatus: (orderId: string, itemId: string) => void;
  onSetNote: (orderId: string, itemId: string, note: string) => void;
}

export default function TicketCard({
  orderId,
  item,
  onSetStatus,
  onCycleStatus,
  onSetNote,
}: TicketCardProps) {
  const isStamped = item.status !== 'pending';

  const stampLabelMap: Record<ItemStatus, string> = {
    pending: 'Pending',
    ready: 'Ready to Ship',
    incoming: 'Incoming Stock',
    missing: 'Item Missing',
  };

  const stampConfig: Record<
    ItemStatus,
    { border: string; bg: string; text: string; icon: React.ReactNode }
  > = {
    pending: {
      border: 'border-amber-500/50',
      bg: 'bg-amber-950/60',
      text: 'text-amber-300',
      icon: <Clock className="w-4 h-4" />,
    },
    ready: {
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-300',
      icon: <Check className="w-4 h-4 stroke-[2.5]" />,
    },
    incoming: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-950/60',
      text: 'text-blue-300',
      icon: <Clock className="w-4 h-4" />,
    },
    missing: {
      border: 'border-rose-500/50',
      bg: 'bg-rose-950/60',
      text: 'text-rose-300',
      icon: <AlertOctagon className="w-4 h-4" />,
    },
  };

  return (
    <div
      className={`ticket group transition-all duration-150 ${
        isStamped ? 'ticket-stamped opacity-85 hover:opacity-100' : ''
      }`}
      data-order-id={orderId}
      data-item-id={item.id}
    >
      <div className="p-3.5 flex flex-col justify-between h-full">
        {/* Click zone on header & name to cycle status */}
        <div
          onClick={() => onCycleStatus(orderId, item.id)}
          className="cursor-pointer select-none"
          title="Click to cycle status"
        >
          {/* Eyebrow: order ID + SKU */}
          <div className="font-mono text-xs font-semibold uppercase flex justify-between items-center text-stone-400 mb-1">
            <span className="font-bold text-stone-300">{orderId}</span>
            {item.sku && (
              <span className="text-[11px] text-stone-500 font-mono">
                {item.sku}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h4 className="font-bold text-[14.5px] leading-snug my-1 text-cream tracking-tight">
            {item.name}
          </h4>

          {/* Brand, Size, Qty */}
          <div className="font-mono text-xs text-stone-300 flex items-center flex-wrap gap-1.5 mt-1">
            <div className="flex items-center gap-1 font-semibold">
              <span
                className="w-2 h-2 rounded-full inline-block shrink-0 opacity-80"
                style={{ backgroundColor: item.brandColor }}
              />
              <span>{item.brand}</span>
            </div>
            <span className="text-stone-500">&middot;</span>
            <span className="font-semibold text-stone-200">
              sz {item.size}
            </span>
            {item.color && (
              <>
                <span className="text-stone-500">&middot;</span>
                <span className="text-stone-400">{item.color}</span>
              </>
            )}
            {item.quantity > 1 && (
              <span className="bg-ink-night-3 px-1.5 py-0.2 rounded text-stone-200 font-bold border border-ink-rule">
                &times;{item.quantity}
              </span>
            )}
          </div>

          {/* Stock inventory indicator */}
          {item.inventoryQuantity !== null && (
            <div className="mt-2 flex items-center gap-2 font-mono text-[11px] flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  item.inventoryQuantity >= item.quantity
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                    : item.inventoryQuantity > 0
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                    : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                }`}
              >
                Stock: {item.inventoryQuantity}
              </span>
              {item.suggestReady && item.status === 'pending' && (
                <span className="text-emerald-400 font-medium text-[11px]">
                  &bull; Suggest Ready
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section: Note field + Stamp Buttons */}
        <div className="mt-3 pt-2.5 border-t border-ink-rule space-y-2">
          {/* Note input */}
          <input
            type="text"
            placeholder="Add note…"
            value={item.note}
            onChange={(e) => onSetNote(orderId, item.id, e.target.value)}
            className="w-full text-xs font-mono bg-ink-night border border-ink-rule rounded-md px-2.5 py-1 text-cream placeholder-stone-500 focus:outline-none focus:border-stone-400 transition"
          />

          {/* Stamp action buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onSetStatus(orderId, item.id, 'ready')}
              className="font-mono text-xs font-bold tracking-wider py-1.5 rounded-md bg-emerald-950/30 text-emerald-300 hover:bg-emerald-700 hover:text-white border border-emerald-800/40 transition-colors duration-150 active:scale-95 cursor-pointer text-center"
            >
              READY
            </button>
            <button
              type="button"
              onClick={() => onSetStatus(orderId, item.id, 'incoming')}
              className="font-mono text-xs font-bold tracking-wider py-1.5 rounded-md bg-blue-950/30 text-blue-300 hover:bg-blue-700 hover:text-white border border-blue-800/40 transition-colors duration-150 active:scale-95 cursor-pointer text-center"
            >
              INCOMING
            </button>
            <button
              type="button"
              onClick={() => onSetStatus(orderId, item.id, 'missing')}
              className="font-mono text-xs font-bold tracking-wider py-1.5 rounded-md bg-rose-950/30 text-rose-300 hover:bg-rose-700 hover:text-white border border-rose-800/40 transition-colors duration-150 active:scale-95 cursor-pointer text-center"
            >
              MISSING
            </button>
          </div>
        </div>
      </div>

      {/* Stamped overlay when status is stamped */}
      {isStamped && (
        <>
          <div
            onClick={() => onCycleStatus(orderId, item.id)}
            className="absolute inset-0 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-[1px] cursor-pointer z-10 transition-all duration-150"
            title="Click to cycle status"
          >
            <div
              className={`font-mono font-bold text-sm sm:text-base tracking-wider border px-3.5 py-1.5 rounded-lg uppercase select-none shadow-md flex items-center gap-1.5 transform -rotate-2 ${
                stampConfig[item.status].bg
              } ${stampConfig[item.status].border} ${stampConfig[item.status].text}`}
            >
              {stampConfig[item.status].icon}
              <span>{stampLabelMap[item.status]}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetStatus(orderId, item.id, 'pending');
            }}
            className="absolute bottom-2 right-2 text-xs font-mono font-medium text-stone-400 hover:text-white bg-ink-night border border-ink-rule rounded px-2 py-0.5 shadow-sm transition cursor-pointer z-20 flex items-center gap-1"
            title="Reset status back to Pending"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </>
      )}
    </div>
  );
}
