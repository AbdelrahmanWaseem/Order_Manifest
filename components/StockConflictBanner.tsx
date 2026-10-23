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
    <div className="mb-7 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 text-xs text-amber-200 shadow-lg backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="font-extrabold text-sm text-cream tracking-tight">
            Possible Stock Allocation Conflicts
          </div>
          <p className="text-xs text-stone-300">
            These items are marked Ready across multiple orders or exceed available inventory in Shopify:
          </p>
          <div className="divide-y divide-amber-500/15 pt-1">
            {conflicts.map((c) => {
              const orderClaims = c.orders.map((o) => `${o.orderId} (${o.customer})`).join(', ');
              const stockNotice =
                c.inventoryQuantity !== null
                  ? ` [Live stock: ${c.inventoryQuantity}, marked Ready: ${c.totalReadyQuantity}]`
                  : '';

              return (
                <div key={c.key} className="py-1.5 text-xs text-amber-200 font-medium">
                  <span className="font-extrabold text-white">{c.brand}</span> — {c.name} (sz {c.size}):{' '}
                  claimed by <span className="underline font-bold text-cream">{orderClaims}</span>
                  <span className="font-mono text-xs text-amber-400 font-bold ml-1">{stockNotice}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
