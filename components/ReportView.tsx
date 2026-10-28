'use client';

import React, { useState } from 'react';
import { ReportSnapshot } from '@/types/manifest';
import { Check, Copy, Edit, Download, Printer, Trash2 } from 'lucide-react';

interface ReportViewProps {
  report: ReportSnapshot;
  onEditBatch: (report: ReportSnapshot) => void;
  onDeleteReport: (reportId: string) => void;
}

export default function ReportView({ report, onEditBatch, onDeleteReport }: ReportViewProps) {
  const [copied, setCopied] = useState(false);

  // Helper to determine order overall status
  const getOrderState = (items: ReportSnapshot['orders'][0]['items']) => {
    const statuses = items.map((i) => i.status);
    if (statuses.some((s) => s === 'pending')) {
      return {
        key: 'incomplete',
        label: 'Needs review',
        border: 'border-l-amber-500',
        badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30',
      };
    }
    if (statuses.every((s) => s === 'ready')) {
      return {
        key: 'ready',
        label: 'Ship now',
        border: 'border-l-emerald-500',
        badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30',
      };
    }
    if (statuses.includes('missing')) {
      return {
        key: 'missing',
        label: 'Missing items',
        border: 'border-l-rose-500',
        badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30',
      };
    }
    return {
      key: 'incoming',
      label: 'Waiting on stock',
      border: 'border-l-blue-500',
      badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30',
    };
  };

  const handleCopyReadyOrders = () => {
    if (!report.readyOrderIds || report.readyOrderIds.length === 0) {
      alert('No fully-ready orders to copy.');
      return;
    }
    const text = report.readyOrderIds.join(', ');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleExportCSV = () => {
    const escape = (val: any) => {
      const s = String(val == null ? '' : val);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };

    const rows = [['Order', 'Fulfillment', 'Customer', 'Item', 'Brand', 'Size', 'SKU', 'Quantity', 'Status', 'Note']];
    report.orders.forEach((o) => {
      o.items.forEach((i) => {
        rows.push([
          o.id,
          o.fulfillmentStatus || 'UNFULFILLED',
          o.customer,
          i.name,
          i.brand,
          i.size,
          i.sku,
          String(i.quantity),
          i.status,
          i.note || '',
        ]);
      });
    });

    const csvContent = rows.map((r) => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipment-report-${report.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pillClassMap: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30',
    ready: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30',
    incoming: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30',
    missing: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30',
  };

  return (
    <div className="report-doc mt-8 bg-ink-night-2 text-cream rounded-2xl p-6 sm:p-8 shadow-xl border border-ink-rule">
      {/* Report Head */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-ink-rule pb-4 mb-6 gap-3">
        <div>
          <div className="font-mono text-xs font-black tracking-widest uppercase text-ink-soft mb-1">
            Essentials EG — Ops
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-cream">Shipment Report</h2>
        </div>
        <div className="font-mono text-xs text-ink-soft sm:text-right">
          <div className="font-medium">{new Date(report.createdAt).toLocaleString()}</div>
          <div className="font-bold text-cream mt-0.5 text-sm">
            {report.orderCount} order(s) &middot; {report.itemCount} item(s)
          </div>
        </div>
      </div>

      {/* Summary Grid - Eye comfortable frosted cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-300 p-3.5 rounded-xl shadow-sm">
          <div className="font-mono text-2xl font-bold leading-none">{report.counts.ready}</div>
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-90 mt-1">
            Ready to ship
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-300 p-3.5 rounded-xl shadow-sm">
          <div className="font-mono text-2xl font-bold leading-none">{report.counts.incoming}</div>
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-90 mt-1">
            Incoming
          </div>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-300 p-3.5 rounded-xl shadow-sm">
          <div className="font-mono text-2xl font-bold leading-none">{report.counts.missing}</div>
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-90 mt-1">
            Missing
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-300 p-3.5 rounded-xl shadow-sm">
          <div className="font-mono text-2xl font-bold leading-none">{report.counts.pending}</div>
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-90 mt-1">
            Pending
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="font-mono text-xs uppercase tracking-wider text-ink-soft mb-3 font-semibold">
        Orders
      </div>
      <div className="space-y-3 mb-8">
        {report.orders.map((order) => {
          const state = getOrderState(order.items);
          const isFullyReady = state.key === 'ready';

          const cardContent = (
            <div className="space-y-1.5 pt-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-xs flex-wrap py-0.5">
                  <span
                    className={`font-mono text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-md min-w-[65px] text-center ${
                      pillClassMap[item.status]
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="font-semibold text-cream">{item.name}</span>
                  <span className="font-mono text-[11px] text-ink-soft">
                    {item.brand} &middot; sz {item.size} &middot; {item.sku}
                    {item.quantity > 1 && ` (x${item.quantity})`}
                  </span>
                  {item.note && (
                    <span className="text-blue-400 italic text-xs">
                      &mdash; {item.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          );

          if (isFullyReady) {
            return (
              <details
                key={order.id}
                className="order-card border border-ink-rule border-l-[4px] border-l-emerald-500 rounded-xl bg-ink-night/50 transition-colors"
              >
                <summary className="cursor-pointer p-3 flex items-center justify-between gap-2 select-none">
                  <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                    <span className="font-bold text-sm text-cream">{order.id}</span>
                    <span className="text-ink-soft">&middot; {order.customer}</span>
                    {order.fulfillmentStatus && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-night-3 text-ink-soft border border-ink-rule font-medium">
                        {order.fulfillmentStatus.toUpperCase() === 'FULFILLED' ? 'Fulfilled' : order.fulfillmentStatus.toUpperCase().includes('PARTIAL') ? 'Partial' : 'Unfulfilled'}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30">
                    {state.label}
                  </span>
                </summary>
                <div className="p-3 pt-0 border-t border-ink-rule/60">{cardContent}</div>
              </details>
            );
          }

          return (
            <div
              key={order.id}
              className={`order-card border border-ink-rule border-l-[4px] ${state.border} rounded-xl p-3 bg-ink-night/50`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-ink-rule/60 pb-2">
                <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                  <span className="font-bold text-sm text-cream">{order.id}</span>
                  <span className="text-ink-soft">&middot; {order.customer}</span>
                  {order.fulfillmentStatus && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-night-3 text-ink-soft border border-ink-rule font-medium">
                      {order.fulfillmentStatus.toUpperCase() === 'FULFILLED' ? 'Fulfilled' : order.fulfillmentStatus.toUpperCase().includes('PARTIAL') ? 'Partial' : 'Unfulfilled'}
                    </span>
                  )}
                </div>
                <span
                  className={`font-mono text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${state.badge}`}
                >
                  {state.label}
                </span>
              </div>
              {cardContent}
            </div>
          );
        })}
      </div>

      {/* Brand Breakdown Table */}
      <div className="font-mono text-xs uppercase tracking-wider text-ink-soft mb-3 font-semibold">
        Brand breakdown
      </div>
      <div className="overflow-x-auto mb-8 border border-ink-rule rounded-xl bg-ink-night/30">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-ink-rule font-mono text-[10.5px] uppercase tracking-wider text-ink-soft bg-ink-night/50">
              <th className="py-2.5 px-3">Brand</th>
              <th className="py-2.5 px-3">Items</th>
              <th className="py-2.5 px-3">Ready</th>
              <th className="py-2.5 px-3">Incoming</th>
              <th className="py-2.5 px-3">Missing</th>
              <th className="py-2.5 px-3">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-rule/40">
            {Object.entries(report.brandBreakdown || {}).map(([brand, b]) => (
              <tr key={brand} className="hover:bg-ink-night-3/30 transition-colors">
                <td className="py-2.5 px-3 font-medium flex items-center gap-2 text-cream">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                    style={{ backgroundColor: b.color }}
                  />
                  <span>{brand}</span>
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-cream">{b.total}</td>
                <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{b.ready}</td>
                <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400 font-semibold">{b.incoming}</td>
                <td className="py-2.5 px-3 font-mono text-rose-600 dark:text-rose-400 font-semibold">{b.missing}</td>
                <td className="py-2.5 px-3 font-mono text-amber-600 dark:text-amber-400 font-semibold">{b.pending}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-ink-rule no-print">
        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to delete this report?')) {
              onDeleteReport(report.id);
            }
          }}
          className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 dark:text-rose-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 mr-auto shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete report</span>
        </button>

        <button
          type="button"
          onClick={handleCopyReadyOrders}
          className="bg-ink-night hover:bg-ink-night-3 border border-ink-rule text-cream font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
          <span>{copied ? 'Copied to clipboard!' : 'Copy ready order #s'}</span>
        </button>

        <button
          type="button"
          onClick={() => onEditBatch(report)}
          className="bg-ink-night hover:bg-ink-night-3 border border-ink-rule text-cream font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Edit className="w-3.5 h-3.5 text-stone-400" />
          <span>Edit this batch</span>
        </button>

        <button
          type="button"
          onClick={handleExportCSV}
          className="bg-ink-night hover:bg-ink-night-3 border border-ink-rule text-cream font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-stone-400" />
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-950/40 border border-emerald-500/40"
        >
          <Printer className="w-4 h-4 text-white" />
          <span className="text-white">Print / save as PDF</span>
        </button>
      </div>
    </div>
  );
}
