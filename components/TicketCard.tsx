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
  const isStamped = item.status !== 'pending';

  const stampLabelMap: Record<ItemStatus, string> = {
    pending: 'Pending',
    ready: 'Ready to ship',
    incoming: 'Incoming',
    missing: 'Missing',
  };

  const stampClassMap: Record<ItemStatus, string> = {
    pending: 'text-stamp-pending border-stamp-pending',
    ready: 'text-stamp-ready border-stamp-ready',
    incoming: 'text-stamp-incoming border-stamp-incoming',
    missing: 'text-stamp-missing border-stamp-missing',
  };

  return (
    <div
      className="ticket"
      data-order-id={orderId}
      data-item-id={item.id}
    >
      <div className="pl-3.5 pr-2 pt-2.5 pb-3">
        {/* Click zone on header & name to cycle status */}
        <div
          onClick={() => onCycleStatus(orderId, item.id)}
          className="cursor-pointer select-none"
          title="Click to cycle status"
        >
          {/* Eyebrow: order ID + SKU */}
          <div className="font-mono text-[10px] tracking-wider uppercase text-ink-soft flex justify-between items-center">
            <span>{orderId}</span>
            <span>{item.sku}</span>
          </div>

          {/* Product Name */}
          <div className="font-bold text-[14.5px] leading-snug my-1 text-ink-dark">
            {item.name}
          </div>

          {/* Brand, Size, Qty */}
          <div className="font-mono text-[11.5px] text-ink-soft flex items-center flex-wrap gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ backgroundColor: item.brandColor }}
            />
            <span className="font-semibold">{item.brand}</span>
            <span>&middot;</span>
            <span>sz {item.size}</span>
            {item.quantity > 1 && (
              <span className="bg-ink-dark/10 px-1 rounded text-ink-dark font-bold">
                &times;{item.quantity}
              </span>
            )}
          </div>

          {/* Stock inventory quantity indicator & Ready suggestion */}
          {item.inventoryQuantity !== null && (
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px]">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  item.inventoryQuantity >= item.quantity
                    ? 'bg-emerald-800/15 text-emerald-900 border border-emerald-800/20'
                    : item.inventoryQuantity > 0
                    ? 'bg-amber-800/15 text-amber-900 border border-amber-800/20'
                    : 'bg-rose-800/15 text-rose-900 border border-rose-800/20'
                }`}
              >
                Stock: {item.inventoryQuantity}
              </span>
              {item.suggestReady && item.status === 'pending' && (
                <span className="text-emerald-800 font-semibold italic text-[10px]">
                  &bull; Suggest Ready
                </span>
              )}
            </div>
          )}
        </div>

        {/* Note field */}
        <input
          type="text"
          placeholder="note (e.g. arriving w/ next shipment)"
          value={item.note}
          onChange={(e) => onSetNote(orderId, item.id, e.target.value)}
          className="mt-2 w-full text-[11px] font-mono bg-transparent border border-dashed border-paper-rule rounded px-2 py-1 text-ink-dark placeholder:text-[#8b8266] focus:outline-none focus:border-ink-dark"
        />

        {/* Stamp buttons */}
        <div className="flex gap-1.5 mt-2.5">
          <button
            type="button"
            onClick={() => onSetStatus(orderId, item.id, 'ready')}
            className="flex-1 font-mono text-[10.5px] font-bold tracking-wider py-1.5 rounded-[3px] bg-cream border border-paper-rule hover:border-ink-dark text-stamp-ready transition cursor-pointer"
          >
            READY
          </button>
          <button
            type="button"
            onClick={() => onSetStatus(orderId, item.id, 'incoming')}
            className="flex-1 font-mono text-[10.5px] font-bold tracking-wider py-1.5 rounded-[3px] bg-cream border border-paper-rule hover:border-ink-dark text-stamp-incoming transition cursor-pointer"
          >
            INCOMING
          </button>
          <button
            type="button"
            onClick={() => onSetStatus(orderId, item.id, 'missing')}
            className="flex-1 font-mono text-[10.5px] font-bold tracking-wider py-1.5 rounded-[3px] bg-cream border border-paper-rule hover:border-ink-dark text-stamp-missing transition cursor-pointer"
          >
            MISSING
          </button>
        </div>
      </div>

      {/* Stamped overlay when status is stamped */}
      {isStamped && (
        <>
          <div
            onClick={() => onCycleStatus(orderId, item.id)}
            className="absolute inset-0 flex items-center justify-center bg-[#ece3cd]/85 cursor-pointer z-10 transition-opacity"
            title="Click to cycle status"
          >
            <div
              className={`font-mono font-bold text-[18px] tracking-wider border-[3px] px-3.5 py-1.5 rounded -rotate-[9deg] uppercase bg-[#ece3cd]/60 select-none shadow-sm ${
                stampClassMap[item.status]
              }`}
            >
              {stampLabelMap[item.status]}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetStatus(orderId, item.id, 'pending');
            }}
            className="absolute bottom-2 right-2 text-[10px] font-mono text-ink-soft hover:text-ink-dark underline bg-transparent border-none p-1 cursor-pointer z-20"
          >
            undo
          </button>
        </>
      )}
    </div>
  );
}
