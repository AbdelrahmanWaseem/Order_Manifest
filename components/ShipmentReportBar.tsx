'use client';

import React from 'react';
import { Loader2, FileText, FolderArchive } from 'lucide-react';

interface ShipmentReportBarProps {
  statusMessage: string;
  savedReportsCount: number;
  onOpenArchive: () => void;
  onGenerateReport: () => void;
  savingReport: boolean;
}

export default function ShipmentReportBar({
  statusMessage,
  savedReportsCount,
  onOpenArchive,
  onGenerateReport,
  savingReport,
}: ShipmentReportBarProps) {
  return (
    <div className="sticky bottom-3 mt-8 bg-ink-night-2/95 border border-ink-rule rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg z-30 backdrop-blur-sm no-print">
      <div>
        <div className="font-bold text-sm text-cream tracking-tight flex items-center gap-2">
          <FileText className="w-4 h-4 text-stone-400" />
          <span>Shipment Manifest Report</span>
        </div>
        <div className="text-xs text-stone-400 mt-0.5">{statusMessage}</div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onOpenArchive}
          className="bg-ink-night hover:bg-ink-night-3 border border-ink-rule hover:border-stone-400 text-stone-200 font-semibold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <FolderArchive className="w-3.5 h-3.5 text-stone-400" />
          <span>Saved Reports</span>
          <span className="font-mono text-stone-400 font-bold bg-ink-night-3 px-1.5 py-0.2 rounded border border-ink-rule">
            {savedReportsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={onGenerateReport}
          disabled={savingReport}
          className="bg-stone-200 hover:bg-white text-stone-900 font-bold text-xs sm:text-sm px-4.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-40 shadow-sm"
        >
          {savingReport ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Report…</span>
            </>
          ) : (
            <span>Generate Report</span>
          )}
        </button>
      </div>
    </div>
  );
}
