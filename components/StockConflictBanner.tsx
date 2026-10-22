'use client';

import React from 'react';
import { StockConflict } from '@/types/manifest';
import { AlertTriangle } from 'lucide-react';

interface StockConflictBannerProps {
  conflicts: StockConflict[];
}

export default function StockConflictBanner({ conflicts }: StockConflictBannerProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="mb-5 bg-[#c98a2b]/15 border border-stamp-pending rounded p-3 text-xs text-[#f0d9ae] shadow-md">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-stamp-pending shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1">
          <div className="font-bold text-white">
            ⚠ Possible stock conflicts — these items are marked Ready across multiple orders or exceed Shopify stock:
          </div>
          {conflicts.map((c) => {
            const orderClaims = c.orders.map((o) => `${o.orderId} (${o.customer})`).join(', ');
            const stockNotice =
              c.inventoryQuantity !== null
                ? ` [Shopify stock: ${c.inventoryQuantity}, marked Ready: ${c.totalReadyQuantity}]`
                : '';

            return (
              <div key={c.key} className="text-[12.5px] leading-relaxed text-amber-100">
                <span className="font-semibold">{c.brand}</span> — {c.name} (sz {c.size}):{' '}
                claimed by <span className="underline decoration-dotted">{orderClaims}</span>
                <span className="font-mono text-xs text-orange-200">{stockNotice}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
