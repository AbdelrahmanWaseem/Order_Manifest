'use client';

import React from 'react';
import { Loader2, FolderArchive, ArrowRight } from 'lucide-react';

interface ShipmentReportBarProps {
  statusMessage?: string;
  savedReportsCount: number;
  onOpenArchive: () => void;
  onGenerateReport: () => void;
  savingReport: boolean;
  totalItems?: number;
  stampedItems?: number;
}

export default function ShipmentReportBar({
  statusMessage,
  savedReportsCount,
  onOpenArchive,
  onGenerateReport,
  savingReport,
  totalItems = 0,
  stampedItems = 0,
}: ShipmentReportBarProps) {
  const isAllStamped = totalItems > 0 && stampedItems >= totalItems;
  const progressPercent = totalItems > 0 ? Math.min(100, Math.round((stampedItems / totalItems) * 100)) : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.04)] py-3 no-print">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Stamped count and progress bar */}
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text tabular-nums whitespace-nowrap">
              {stampedItems} / {totalItems} items stamped
            </span>
            <div className="flex-1 max-w-[200px] h-2 bg-bg border border-border rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 rounded-full ${
                  isAllStamped ? 'bg-emerald-500' : 'bg-accent'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-text-muted tabular-nums font-medium">
              {progressPercent}%
            </span>
          </div>

          <div className="text-xs text-text-muted mt-1">
            {totalItems === 0
              ? 'No active orders in manifest'
              : !isAllStamped
              ? `${totalItems - stampedItems} item(s) remaining — stamp all items before generating report`
              : 'All items stamped — ready to generate shipment report'}
          </div>
        </div>

        {/* Right: Saved Reports (Secondary) & Generate Report (Primary) */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={onOpenArchive}
            className="h-11 px-4 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-text border border-border rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <FolderArchive className="w-4 h-4 text-text-muted" />
            <span>Saved Reports</span>
            <span className="text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded bg-bg text-text-muted border border-border">
              {savedReportsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={onGenerateReport}
            disabled={!isAllStamped || savingReport}
            className={`min-h-[44px] px-5 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-sm ${
              isAllStamped && !savingReport
                ? 'bg-accent hover:bg-accent-hover text-white'
                : 'bg-[#E5E7EB] text-[#6B7280] dark:bg-[#334155] dark:text-[#9CA3AF] cursor-not-allowed'
            }`}
          >
            {savingReport ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Saving Report…</span>
              </>
            ) : (
              <>
                <span>Generate Report</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
