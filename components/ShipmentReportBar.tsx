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
  importedOrdersCount?: number;
  missingItemsCount?: number;
}

export default function ShipmentReportBar({
  statusMessage,
  savedReportsCount,
  onOpenArchive,
  onGenerateReport,
  savingReport,
  totalItems = 0,
  stampedItems = 0,
  importedOrdersCount = 0,
  missingItemsCount = 0,
}: ShipmentReportBarProps) {
  const isAllStamped = totalItems > 0 && stampedItems >= totalItems;
  const progressPercent = totalItems > 0 ? Math.min(100, Math.round((stampedItems / totalItems) * 100)) : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFFFF] dark:bg-[#1E293B] border-t border-[#E3E6EB] dark:border-[#334155] py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] no-print">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Orders imported & Missing items */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-text tabular-nums">{importedOrdersCount}</span>
            <span className="text-xs text-text-muted leading-tight">orders<br/>imported</span>
          </div>
          <span className="h-6 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className={`text-lg font-bold tabular-nums ${missingItemsCount > 0 ? 'text-red-500' : 'text-text'}`}>
              {missingItemsCount}
            </span>
            <span className="text-xs text-text-muted leading-tight">missing<br/>items</span>
          </div>
        </div>

        {/* Right: Saved Reports (2) secondary button + Generate Report primary button */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={onOpenArchive}
            className="min-h-[44px] h-11 px-4 bg-surface dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 text-text border border-border rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <FolderArchive className="w-4 h-4 text-text-muted" />
            <span>Saved Reports ({savedReportsCount})</span>
          </button>

          <button
            type="button"
            onClick={onGenerateReport}
            disabled={!isAllStamped || savingReport}
            className={`min-h-[44px] h-11 px-[20px] rounded-lg text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-sm ${
              isAllStamped && !savingReport
                ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white'
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
