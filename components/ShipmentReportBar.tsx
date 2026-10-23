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
    <div className="sticky bottom-4 mt-8 bg-ink-night-2/95 border border-ink-rule rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] z-30 backdrop-blur-md no-print">
      <div>
        <div className="font-extrabold text-sm sm:text-base text-cream tracking-tight flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Shipment Manifest Report</span>
        </div>
        <div className="text-xs text-stone-300 font-medium mt-1">{statusMessage}</div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onOpenArchive}
          className="bg-ink-night hover:bg-stone-800 border border-ink-rule hover:border-stone-400 text-stone-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
        >
          <FolderArchive className="w-4 h-4 text-amber-400" />
          <span>Saved Reports</span>
          <span className="font-mono text-stamp-pending font-black bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            {savedReportsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={onGenerateReport}
          disabled={savingReport}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-dark font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-[0_4px_16px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.45)] active:scale-95"
        >
          {savingReport ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Report…</span>
            </>
          ) : (
            <>
              <span>Generate Report</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
