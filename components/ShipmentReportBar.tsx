'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

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
    <div className="sticky bottom-0 mt-8 bg-ink-night-2 border border-ink-rule rounded-md p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl z-30 no-print">
      <div>
        <div className="font-bold text-sm text-cream tracking-tight">Shipment report</div>
        <div className="text-xs text-stone-300 font-medium mt-0.5">{statusMessage}</div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onOpenArchive}
          className="bg-transparent hover:bg-stone-900 border border-ink-rule hover:border-stone-400 text-stone-200 font-bold text-xs px-3.5 py-2 rounded-[4px] transition cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <span>📁 Saved reports</span>
          <span className="font-mono text-stamp-pending font-extrabold">({savedReportsCount})</span>
        </button>

        <button
          type="button"
          onClick={onGenerateReport}
          disabled={savingReport}
          className="bg-stamp-pending hover:bg-[#b57a24] text-ink-dark font-extrabold text-xs px-4.5 py-2 rounded-[4px] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-md tracking-wide"
        >
          {savingReport ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Report…</span>
            </>
          ) : (
            'Generate report'
          )}
        </button>
      </div>
    </div>
  );
}
