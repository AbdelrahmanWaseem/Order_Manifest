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
      border: 'border-amber-500',
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      icon: <Clock className="w-4 h-4" />,
    },
    ready: {
      border: 'border-emerald-500',
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      icon: <Check className="w-4 h-4 stroke-[3]" />,
    },
    incoming: {
      border: 'border-blue-500',
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      icon: <Clock className="w-4 h-4" />,
    },
    missing: {
      border: 'border-rose-500',
      bg: 'bg-rose-500/20',
      text: 'text-rose-400',
      icon: <AlertOctagon className="w-4 h-4" />,
    },
  };

  return (
    <div
      className={`ticket group transition-all duration-200 ${
        isStamped ? 'ticket-stamped' : ''
      }`}
      data-order-id={orderId}
      data-item-id={item.id}
    >
      {/* Top accent bar indicating status */}
      <div
        className={`h-1 w-full transition-colors ${
          item.status === 'ready'
            ? 'bg-emerald-500'
            : item.status === 'incoming'
            ? 'bg-blue-500'
            : item.status === 'missing'
            ? 'bg-rose-500'
            : 'bg-transparent group-hover:bg-violet-500/40'
        }`}
      />

      <div className="p-4 flex flex-col justify-between h-full">
        {/* Click zone on header & name to cycle status */}
        <div
          onClick={() => onCycleStatus(orderId, item.id)}
          className="cursor-pointer select-none"
          title="Click to cycle status"
        >
          {/* Eyebrow: order ID + SKU */}
          <div className="font-mono text-xs font-bold tracking-wider uppercase flex justify-between items-center text-stone-400 mb-1.5">
            <span className="bg-ink-night px-2 py-0.5 rounded border border-ink-rule text-stamp-pending">
              {orderId}
            </span>
            {item.sku && (
              <span className="text-[11px] font-medium text-stone-400">
                {item.sku}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h4 className="font-extrabold text-[15px] sm:text-base leading-snug my-1 text-cream tracking-tight group-hover:text-purple-300 transition-colors">
            {item.name}
          </h4>

          {/* Brand, Size, Qty */}
          <div className="font-mono text-xs text-stone-300 flex items-center flex-wrap gap-2 mt-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                style={{ backgroundColor: item.brandColor }}
              />
              <span>{item.brand}</span>
            </div>
            <span className="text-stone-500">&middot;</span>
            <span className="font-bold px-2 py-0.5 rounded bg-ink-night border border-ink-rule text-cream">
              Size {item.size}
            </span>
            {item.color && (
              <>
                <span className="text-stone-500">&middot;</span>
                <span className="text-stone-300">{item.color}</span>
              </>
            )}
            {item.quantity > 1 && (
              <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded font-black">
                &times;{item.quantity}
              </span>
            )}
          </div>

          {/* Stock inventory indicator */}
          {item.inventoryQuantity !== null && (
            <div className="mt-2.5 flex items-center gap-2 font-mono text-xs flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide border ${
                  item.inventoryQuantity >= item.quantity
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : item.inventoryQuantity > 0
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                Stock: {item.inventoryQuantity}
              </span>
              {item.suggestReady && item.status === 'pending' && (
                <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <span>✓</span> Suggest Ready
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section: Note field + Stamp Buttons */}
        <div className="mt-3.5 pt-3 border-t border-ink-rule/70 space-y-2.5">
          {/* Note input */}
          <input
            type="text"
            placeholder="Add note (e.g. arriving soon, replacement)…"
            value={item.note}
            onChange={(e) => onSetNote(orderId, item.id, e.target.value)}
            className="w-full text-xs font-mono font-medium bg-ink-night/60 border border-ink-rule rounded-lg px-3 py-1.5 text-cream placeholder-stone-500 focus:outline-none focus:border-purple-500 focus:bg-ink-night transition shadow-inner"
          />

          {/* Stamp action buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onSetStatus(orderId, item.id, 'ready')}
              className="font-mono text-xs font-extrabold tracking-wider py-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm text-center"
            >
              READY
            </button>
            <button
              type="button"
              onClick={() => onSetStatus(orderId, item.id, 'incoming')}
              className="font-mono text-xs font-extrabold tracking-wider py-2 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/30 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm text-center"
            >
              INCOMING
            </button>
            <button
              type="button"
              onClick={() => onSetStatus(orderId, item.id, 'missing')}
              className="font-mono text-xs font-extrabold tracking-wider py-2 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm text-center"
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
            className="absolute inset-0 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-[2px] cursor-pointer z-10 transition-all duration-200"
            title="Click to cycle status"
          >
            <div
              className={`font-mono font-black text-base sm:text-lg tracking-wider border-2 px-4 py-2 rounded-xl uppercase select-none shadow-2xl flex items-center gap-2 transform -rotate-3 hover:scale-105 transition-transform ${
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
            className="absolute bottom-2.5 right-3 text-xs font-mono font-bold text-stone-300 hover:text-white bg-ink-night/90 hover:bg-ink-night border border-ink-rule rounded-md px-2 py-1 shadow-md transition-all cursor-pointer z-20 flex items-center gap-1 active:scale-95"
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
