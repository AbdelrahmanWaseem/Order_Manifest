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
    if (statuses.some((s) => s === 'pending')) return { key: 'incomplete', label: 'Needs review', border: 'border-l-stamp-pending', badge: 'bg-stamp-pending' };
    if (statuses.every((s) => s === 'ready')) return { key: 'ready', label: 'Ship now', border: 'border-l-stamp-ready', badge: 'bg-stamp-ready' };
    if (statuses.includes('missing')) return { key: 'missing', label: 'Missing items', border: 'border-l-stamp-missing', badge: 'bg-stamp-missing' };
    return { key: 'incoming', label: 'Waiting on stock', border: 'border-l-stamp-incoming', badge: 'bg-stamp-incoming' };
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
    pending: 'bg-stamp-pending',
    ready: 'bg-stamp-ready',
    incoming: 'bg-stamp-incoming',
    missing: 'bg-stamp-missing',
  };

  return (
    <div className="report-doc mt-8 bg-cream text-ink-dark rounded-2xl p-6 sm:p-8 shadow-2xl border border-ink-rule/80">
      {/* Report Head */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-2 border-ink-dark pb-4 mb-6 gap-3">
        <div>
          <div className="font-mono text-xs font-black tracking-widest uppercase text-ink-soft mb-1">
            Essentials EG — Ops
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-dark">Shipment Report</h2>
        </div>
        <div className="font-mono text-xs text-ink-soft sm:text-right">
          <div className="font-medium">{new Date(report.createdAt).toLocaleString()}</div>
          <div className="font-bold text-ink-dark mt-0.5 text-sm">
            {report.orderCount} order(s) &middot; {report.itemCount} item(s)
          </div>
        </div>
      </div>

      {/* Conflicts section if any */}
      {report.conflicts && report.conflicts.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border-2 border-stamp-missing rounded-md text-xs text-ink-dark">
          <div className="font-bold text-stamp-missing mb-1 text-[13px]">
            ⚠ Stock conflicts — same item marked Ready on more than one order
          </div>
          {report.conflicts.map((c) => (
            <div key={c.key} className="mt-1 leading-relaxed">
              <span className="font-semibold">{c.brand}</span> — {c.name} (sz {c.size}):{' '}
              {c.orders.map((o) => `${o.orderId} (${o.customer})`).join(', ')}
            </div>
          ))}
        </div>
      )}

      {/* Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        <div className="bg-stamp-ready text-white p-3.5 rounded-md shadow-sm">
          <div className="font-mono text-2xl font-bold leading-none">{report.counts.ready}</div>
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-90 mt-1">
            Ready to ship
          </div>
        </div>
        <div className="bg-stamp-incoming text-white p-3.5 rounded-md shadow-sm">
          <div className="font-mono text-2xl font-bold leading-none">{report.counts.incoming}</div>
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-90 mt-1">
            Incoming
          </div>
        </div>
        <div className="bg-stamp-missing text-white p-3.5 rounded-md shadow-sm">
          <div className="font-mono text-2xl font-bold leading-none">{report.counts.missing}</div>
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-90 mt-1">
            Missing
          </div>
        </div>
        <div className="bg-stamp-pending text-white p-3.5 rounded-md shadow-sm">
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
                    className={`font-mono text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full text-white min-w-[65px] text-center ${
                      pillClassMap[item.status]
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="font-semibold text-ink-dark">{item.name}</span>
                  <span className="font-mono text-[11px] text-ink-soft">
                    {item.brand} &middot; sz {item.size} &middot; {item.sku}
                    {item.quantity > 1 && ` (x${item.quantity})`}
                  </span>
                  {item.note && (
                    <span className="text-stamp-incoming italic text-xs">
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
                className="order-card border border-paper-rule border-l-[5px] border-l-stamp-ready rounded bg-paper"
              >
                <summary className="cursor-pointer p-3 flex items-center justify-between gap-2 select-none">
                  <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                    <span className="font-bold text-sm text-ink-dark">{order.id}</span>
                    <span className="text-ink-soft">&middot; {order.customer}</span>
                    {order.fulfillmentStatus && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-paper-2 text-ink-soft border border-paper-rule font-medium">
                        {order.fulfillmentStatus.toUpperCase() === 'FULFILLED' ? 'Fulfilled' : order.fulfillmentStatus.toUpperCase().includes('PARTIAL') ? 'Partial' : 'Unfulfilled'}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white bg-stamp-ready">
                    {state.label}
                  </span>
                </summary>
                <div className="p-3 pt-0 border-t border-paper-rule/60">{cardContent}</div>
              </details>
            );
          }

          return (
            <div
              key={order.id}
              className={`order-card border border-paper-rule border-l-[5px] ${state.border} rounded p-3 bg-paper`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-paper-rule/60 pb-2">
                <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                  <span className="font-bold text-sm text-ink-dark">{order.id}</span>
                  <span className="text-ink-soft">&middot; {order.customer}</span>
                  {order.fulfillmentStatus && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-paper-2 text-ink-soft border border-paper-rule font-medium">
                      {order.fulfillmentStatus.toUpperCase() === 'FULFILLED' ? 'Fulfilled' : order.fulfillmentStatus.toUpperCase().includes('PARTIAL') ? 'Partial' : 'Unfulfilled'}
                    </span>
                  )}
                </div>
                <span
                  className={`font-mono text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white ${state.badge}`}
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
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-ink-dark font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">
              <th className="py-2 px-2">Brand</th>
              <th className="py-2 px-2">Items</th>
              <th className="py-2 px-2">Ready</th>
              <th className="py-2 px-2">Incoming</th>
              <th className="py-2 px-2">Missing</th>
              <th className="py-2 px-2">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-rule">
            {Object.entries(report.brandBreakdown || {}).map(([brand, b]) => (
              <tr key={brand}>
                <td className="py-2 px-2 font-medium flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                  <span>{brand}</span>
                </td>
                <td className="py-2 px-2 font-mono font-semibold">{b.total}</td>
                <td className="py-2 px-2 font-mono text-stamp-ready font-semibold">{b.ready}</td>
                <td className="py-2 px-2 font-mono text-stamp-incoming">{b.incoming}</td>
                <td className="py-2 px-2 font-mono text-stamp-missing">{b.missing}</td>
                <td className="py-2 px-2 font-mono text-stamp-pending">{b.pending}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-paper-rule no-print">
        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to delete this report?')) {
              onDeleteReport(report.id);
            }
          }}
          className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 mr-auto shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete report</span>
        </button>

        <button
          type="button"
          onClick={handleCopyReadyOrders}
          className="bg-paper-2 hover:bg-paper-rule/60 border border-ink-dark/40 text-ink-dark font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-stamp-ready stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied to clipboard!' : 'Copy ready order #s'}</span>
        </button>

        <button
          type="button"
          onClick={() => onEditBatch(report)}
          className="bg-paper-2 hover:bg-paper-rule/60 border border-ink-dark/40 text-ink-dark font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Edit this batch</span>
        </button>

        <button
          type="button"
          onClick={handleExportCSV}
          className="bg-paper-2 hover:bg-paper-rule/60 border border-ink-dark/40 text-ink-dark font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="bg-ink-dark hover:bg-black text-cream font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / save as PDF</span>
        </button>
      </div>
    </div>
  );
}
