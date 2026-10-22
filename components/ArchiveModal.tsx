'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar } from 'lucide-react';
import { ReportSnapshot } from '@/types/manifest';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: ReportSnapshot) => void;
}

interface ReportSummary {
  id: string;
  createdAt: string;
  orderCount: number;
  itemCount: number;
}

export default function ArchiveModal({
  isOpen,
  onClose,
  onSelectReport,
}: ArchiveModalProps) {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch archived reports');
      }
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message || 'Error loading saved reports');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/reports/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to open report');
      }
      onSelectReport(data.report.snapshot as ReportSnapshot);
      onClose();
    } catch (err: any) {
      alert(`Could not open report: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  if (!isOpen) return null;

  // Group reports by Month, then Day
  const groupedReports: Record<string, Record<string, ReportSummary[]>> = {};

  reports.forEach((r) => {
    const d = new Date(r.createdAt);
    const monthKey = d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    const dayKey = d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    groupedReports[monthKey] = groupedReports[monthKey] || {};
    groupedReports[monthKey][dayKey] = groupedReports[monthKey][dayKey] || [];
    groupedReports[monthKey][dayKey].push(r);
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-ink-night-2 border border-ink-rule rounded-lg w-full max-w-lg max-h-[82vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink-rule">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stamp-pending" />
            <h3 className="font-bold text-sm text-cream">Saved reports archive</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="p-10 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-stamp-pending" />
              <span>Loading saved reports…</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-red-300">
              {error}
            </div>
          ) : reports.length === 0 ? (
            <div className="p-10 text-center text-xs text-stone-500">
              No saved reports yet — generate one and it will show up here.
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedReports).map(([month, days]) => (
                <div key={month}>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-stamp-pending mb-2">
                    {month}
                  </div>
                  <div className="space-y-3">
                    {Object.entries(days).map(([day, list]) => (
                      <div key={day}>
                        <div className="text-xs text-stone-300 font-semibold mb-1.5 pl-0.5">
                          {day}
                        </div>
                        <div className="space-y-1.5">
                          {list.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => handleOpenReport(r.id)}
                              disabled={loadingId === r.id}
                              className="w-full bg-ink-night hover:bg-stone-900 border border-ink-rule hover:border-stone-500 rounded p-2.5 flex items-center justify-between text-xs text-left transition cursor-pointer disabled:opacity-50"
                            >
                              <span className="font-medium text-stone-200">
                                {r.orderCount} order(s) &middot; {r.itemCount} item(s)
                              </span>
                              <span className="font-mono text-[11px] text-stone-400 flex items-center gap-1.5">
                                {loadingId === r.id && <Loader2 className="w-3 h-3 animate-spin text-stamp-pending" />}
                                <span>{new Date(r.createdAt).toLocaleTimeString()}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
