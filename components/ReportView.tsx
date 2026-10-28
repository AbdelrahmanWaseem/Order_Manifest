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
        badge: 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#451A03] dark:text-[#FDE68A]',
      };
    }
    if (statuses.every((s) => s === 'ready')) {
      return {
        key: 'ready',
        label: 'Ship now',
        border: 'border-l-emerald-500',
        badge: 'bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#BBF7D0]',
      };
    }
    if (statuses.includes('missing')) {
      return {
        key: 'missing',
        label: 'Missing items',
        border: 'border-l-red-500',
        badge: 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D] dark:text-[#FECACA]',
      };
    }
    return {
      key: 'incoming',
      label: 'Waiting on stock',
      border: 'border-l-blue-500',
      badge: 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A] dark:text-[#BFDBFE]',
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
    pending: 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#451A03] dark:text-[#FDE68A]',
    ready: 'bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#BBF7D0]',
    incoming: 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A] dark:text-[#BFDBFE]',
    missing: 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D] dark:text-[#FECACA]',
  };

  return (
    <div className="report-doc mt-8 bg-surface text-text rounded-lg p-6 sm:p-8 shadow-sm border border-border">
      {/* Report Head */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 mb-6 gap-3">
        <div>
          <div className="text-xs font-semibold text-text-muted mb-1">
            Essentials EG &middot; Operations
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-text">Shipment Report</h2>
        </div>
        <div className="text-xs text-text-muted sm:text-right">
          <div>{new Date(report.createdAt).toLocaleString()}</div>
          <div className="font-semibold text-text mt-0.5 text-sm tabular-nums">
            {report.orderCount} order(s) &middot; {report.itemCount} item(s)
          </div>
        </div>
      </div>

      {/* Summary Grid - Eye comfortable soft tints */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#BBF7D0] p-4 rounded-lg">
          <div className="text-2xl font-bold leading-none tabular-nums">{report.counts.ready}</div>
          <div className="text-xs font-medium opacity-90 mt-1.5">
            Ready to ship
          </div>
        </div>
        <div className="bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A] dark:text-[#BFDBFE] p-4 rounded-lg">
          <div className="text-2xl font-bold leading-none tabular-nums">{report.counts.incoming}</div>
          <div className="text-xs font-medium opacity-90 mt-1.5">
            Incoming
          </div>
        </div>
        <div className="bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D] dark:text-[#FECACA] p-4 rounded-lg">
          <div className="text-2xl font-bold leading-none tabular-nums">{report.counts.missing}</div>
          <div className="text-xs font-medium opacity-90 mt-1.5">
            Missing
          </div>
        </div>
        <div className="bg-[#FEF3C7] text-[#92400E] dark:bg-[#451A03] dark:text-[#FDE68A] p-4 rounded-lg">
          <div className="text-2xl font-bold leading-none tabular-nums">{report.counts.pending}</div>
          <div className="text-xs font-medium opacity-90 mt-1.5">
            Pending
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="text-xs font-semibold text-text-muted mb-3">
        Orders ({report.orders.length})
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
                    className={`text-[11px] font-medium px-2 py-0.5 rounded min-w-[65px] text-center ${
                      pillClassMap[item.status]
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="font-semibold text-text">{item.name}</span>
                  <span className="text-xs text-text-muted">
                    {item.brand} &middot; sz {item.size} &middot; {item.sku}
                    {item.quantity > 1 && ` (x${item.quantity})`}
                  </span>
                  {item.note && (
                    <span className="text-blue-600 dark:text-blue-400 italic text-xs">
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
                className="border border-border border-l-4 border-l-emerald-500 rounded-lg bg-surface transition-colors"
              >
                <summary className="cursor-pointer p-3 flex items-center justify-between gap-2 select-none">
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-semibold text-sm text-text tabular-nums">{order.id}</span>
                    <span className="text-text-muted" dir="auto">&middot; {order.customer}</span>
                    {order.fulfillmentStatus && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-bg text-text-muted border border-border font-medium">
                        {order.fulfillmentStatus.toUpperCase() === 'FULFILLED' ? 'Fulfilled' : order.fulfillmentStatus.toUpperCase().includes('PARTIAL') ? 'Partial' : 'Unfulfilled'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#BBF7D0]">
                    {state.label}
                  </span>
                </summary>
                <div className="p-3 pt-0 border-t border-border/60">{cardContent}</div>
              </details>
            );
          }

          return (
            <div
              key={order.id}
              className={`border border-border border-l-4 ${state.border} rounded-lg p-3 bg-surface`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="font-semibold text-sm text-text tabular-nums">{order.id}</span>
                  <span className="text-text-muted" dir="auto">&middot; {order.customer}</span>
                  {order.fulfillmentStatus && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-bg text-text-muted border border-border font-medium">
                      {order.fulfillmentStatus.toUpperCase() === 'FULFILLED' ? 'Fulfilled' : order.fulfillmentStatus.toUpperCase().includes('PARTIAL') ? 'Partial' : 'Unfulfilled'}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${state.badge}`}
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
      <div className="text-xs font-semibold text-text-muted mb-3">
        Brand Breakdown
      </div>
      <div className="overflow-x-auto mb-8 border border-border rounded-lg bg-surface">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-xs font-semibold text-text-muted bg-bg">
              <th className="py-2.5 px-3">Brand</th>
              <th className="py-2.5 px-3 text-right">Items</th>
              <th className="py-2.5 px-3 text-right">Ready</th>
              <th className="py-2.5 px-3 text-right">Incoming</th>
              <th className="py-2.5 px-3 text-right">Missing</th>
              <th className="py-2.5 px-3 text-right">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Object.entries(report.brandBreakdown || {}).map(([brand, b]) => (
              <tr key={brand} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-3 font-medium flex items-center gap-2 text-text">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
                    style={{ backgroundColor: b.color }}
                  />
                  <span>{brand}</span>
                </td>
                <td className="py-2.5 px-3 font-semibold text-text text-right tabular-nums">{b.total}</td>
                <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold text-right tabular-nums">{b.ready}</td>
                <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-semibold text-right tabular-nums">{b.incoming}</td>
                <td className="py-2.5 px-3 text-red-600 dark:text-red-400 font-semibold text-right tabular-nums">{b.missing}</td>
                <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-semibold text-right tabular-nums">{b.pending}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-border no-print">
        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to delete this report?')) {
              onDeleteReport(report.id);
            }
          }}
          className="h-10 px-4 bg-surface hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 border border-border hover:border-red-200 dark:hover:border-red-800 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 mr-auto shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete report</span>
        </button>

        <button
          type="button"
          onClick={handleCopyReadyOrders}
          className="h-10 px-4 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 border border-border text-text rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600 stroke-[2.25]" /> : <Copy className="w-4 h-4 text-text-muted" />}
          <span>{copied ? 'Copied to clipboard!' : 'Copy ready order #s'}</span>
        </button>

        <button
          type="button"
          onClick={() => onEditBatch(report)}
          className="h-10 px-4 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 border border-border text-text rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Edit className="w-4 h-4 text-text-muted" />
          <span>Edit this batch</span>
        </button>

        <button
          type="button"
          onClick={handleExportCSV}
          className="h-10 px-4 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 border border-border text-text rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Download className="w-4 h-4 text-text-muted" />
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="h-10 px-5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <Printer className="w-4 h-4 text-white" />
          <span className="text-white">Print / save as PDF</span>
        </button>
      </div>
    </div>
  );
}
