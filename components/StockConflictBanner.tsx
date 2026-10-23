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
    <div className="mb-6 bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5 sm:p-4 text-xs text-stone-300 shadow-sm">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1">
          <div className="font-bold text-cream">
            Possible Stock Allocation Conflicts
          </div>
          <p className="text-xs text-stone-400">
            These items are marked Ready across multiple orders or exceed available inventory in Shopify:
          </p>
          <div className="divide-y divide-ink-rule/60 pt-1">
            {conflicts.map((c) => {
              const orderClaims = c.orders.map((o) => `${o.orderId} (${o.customer})`).join(', ');
              const stockNotice =
                c.inventoryQuantity !== null
                  ? ` [Live stock: ${c.inventoryQuantity}, marked Ready: ${c.totalReadyQuantity}]`
                  : '';

              return (
                <div key={c.key} className="py-1 text-xs text-stone-300">
                  <span className="font-semibold text-cream">{c.brand}</span> — {c.name} (sz {c.size}):{' '}
                  claimed by <span className="underline text-stone-200">{orderClaims}</span>
                  <span className="font-mono text-xs text-amber-300 ml-1">{stockNotice}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
