'use client';

import React from 'react';
import { ManifestItem, ItemStatus } from '@/types/manifest';

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
  const isReady = item.status === 'ready';
  const isIncoming = item.status === 'incoming';
  const isMissing = item.status === 'missing';
  const isStamped = item.status !== 'pending';

  // Container styling based on stamped state
  let cardBgBorder = 'bg-surface border-border';
  if (isReady) {
    cardBgBorder = 'bg-[#F0FDF4] dark:bg-[#14532D] border-[#BBF7D0] dark:border-[#166534]';
  } else if (isIncoming) {
    cardBgBorder = 'bg-[#EFF6FF] dark:bg-[#1E3A8A] border-[#BFDBFE] dark:border-[#1E40AF]';
  } else if (isMissing) {
    cardBgBorder = 'bg-[#FEF2F2] dark:bg-[#7F1D1D] border-[#FECACA] dark:border-[#991B1B]';
  }

  return (
    <div
      className={`border rounded-lg p-3.5 flex flex-col justify-between transition-colors shadow-sm ${cardBgBorder}`}
      data-order-id={orderId}
      data-item-id={item.id}
    >
      <div>
        {/* Top row: Status pill in top-right corner + Reset button */}
        <div className="flex items-center justify-between gap-2 mb-2 min-h-[22px]">
          {isStamped ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => onSetStatus(orderId, item.id, 'pending')}
                className="text-xs text-text-muted hover:text-text underline font-medium transition cursor-pointer"
                title="Reset item to pending"
              >
                Reset
              </button>

              {isReady && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] dark:bg-[#166534] dark:text-[#BBF7D0] dark:border-[#166534]">
                  ✓ Ready
                </span>
              )}
              {isIncoming && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] dark:bg-[#1E40AF] dark:text-[#DBEAFE] dark:border-[#1E40AF]">
                  Incoming
                </span>
              )}
              {isMissing && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] dark:bg-[#991B1B] dark:text-[#FECACA] dark:border-[#991B1B]">
                  Missing
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-text-muted font-medium">Pending status</div>
          )}
        </div>

        {/* Product Title */}
        <h4 className="font-semibold text-sm text-text leading-snug">
          {item.name}
        </h4>

        {/* Brand, Size, Color, Qty */}
        <div className="text-xs text-text-muted flex items-center flex-wrap gap-1.5 mt-1.5">
          <span className="font-medium text-text">{item.brand}</span>
          <span>&middot;</span>
          <span className="font-medium text-text">sz {item.size}</span>
          {item.color && (
            <>
              <span>&middot;</span>
              <span>{item.color}</span>
            </>
          )}
          {item.quantity > 1 && (
            <span className="bg-surface border border-border px-1.5 py-0.2 rounded font-semibold text-text tabular-nums">
              &times;{item.quantity}
            </span>
          )}
          {item.sku && (
            <>
              <span>&middot;</span>
              <span className="text-[11px] text-text-muted tabular-nums">{item.sku}</span>
            </>
          )}
        </div>

        {/* Stock indicator (if positive) */}
        {item.inventoryQuantity !== null && item.inventoryQuantity > 0 && (
          <div className="mt-2 text-xs text-text-muted flex items-center gap-1.5 font-medium">
            <span>Stock:</span>
            <span className="text-text tabular-nums font-semibold">{item.inventoryQuantity}</span>
          </div>
        )}
      </div>

      {/* Bottom row: Note input + Action Buttons */}
      <div className="mt-3.5 pt-3 border-t border-border/70 space-y-2">
        <input
          type="text"
          placeholder="Add note…"
          value={item.note || ''}
          onChange={(e) => onSetNote(orderId, item.id, e.target.value)}
          className="w-full h-9 px-2.5 text-xs bg-surface border border-border rounded-md text-text placeholder-[#9CA3AF] focus:border-accent"
        />

        {/* Action Buttons: 3 in a row, 36px high, 14px font, 1px border */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onSetStatus(orderId, item.id, 'ready')}
            className={`h-[36px] min-h-[36px] text-[14px] rounded-md transition cursor-pointer flex items-center justify-center ${
              isReady
                ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] dark:bg-[#166534] dark:text-[#BBF7D0] dark:border-[#22C55E] font-bold'
                : 'bg-surface dark:bg-[#1E293B] border border-border text-text hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            Ready
          </button>

          <button
            type="button"
            onClick={() => onSetStatus(orderId, item.id, 'incoming')}
            className={`h-[36px] min-h-[36px] text-[14px] rounded-md transition cursor-pointer flex items-center justify-center ${
              isIncoming
                ? 'bg-[#DBEAFE] text-[#1E40AF] border border-[#93C5FD] dark:bg-[#1E40AF] dark:text-[#DBEAFE] dark:border-[#3B82F6] font-bold'
                : 'bg-surface dark:bg-[#1E293B] border border-border text-text hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            Incoming
          </button>

          <button
            type="button"
            onClick={() => onSetStatus(orderId, item.id, 'missing')}
            className={`h-[36px] min-h-[36px] text-[14px] rounded-md transition cursor-pointer flex items-center justify-center ${
              isMissing
                ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] dark:bg-[#991B1B] dark:text-[#FECACA] dark:border-[#EF4444] font-bold'
                : 'bg-surface dark:bg-[#1E293B] border border-border text-text hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            Missing
          </button>
        </div>
      </div>
    </div>
  );
}
