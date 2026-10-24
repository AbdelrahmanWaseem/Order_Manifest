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
          <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Shipment Manifest Report</span>
        </div>
        <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">{statusMessage}</div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onOpenArchive}
          className="bg-ink-night hover:bg-ink-night-3 border border-ink-rule hover:border-stone-400 text-cream font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <FolderArchive className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span>Saved Reports</span>
          <span className="font-mono text-xs font-extrabold bg-ink-night-3 text-cream px-2 py-0.5 rounded-md border border-ink-rule">
            {savedReportsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={onGenerateReport}
          disabled={savingReport}
          className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm px-4.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-40 shadow-sm"
        >
          {savingReport ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span className="text-white">Saving Report…</span>
            </>
          ) : (
            <span className="text-white">Generate Report</span>
          )}
        </button>
      </div>
    </div>
  );
}
