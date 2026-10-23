'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Trash2 } from 'lucide-react';
import { ReportSnapshot } from '@/types/manifest';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: ReportSnapshot) => void;
  onDeleteReport?: (id: string) => void;
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
  onDeleteReport,
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved report from archive?')) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        if (onDeleteReport) onDeleteReport(id);
      }
    } catch (err) {
      alert('Failed to delete report');
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
        className="bg-ink-night-2/95 border border-ink-rule rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden backdrop-blur-md"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-ink-rule/80 bg-ink-night/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-cream tracking-tight">Saved Reports Archive</h3>
              <p className="text-[11px] text-stone-400 font-medium">Browse, restore, or export previous manifest batches</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-ink-night transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="p-10 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Loading saved reports…</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-red-300">
              {error}
            </div>
          ) : reports.length === 0 ? (
            <div className="p-10 text-center text-xs text-stone-400 font-medium">
              No saved reports yet — generate one and it will show up here.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedReports).map(([month, days]) => (
                <div key={month}>
                  <div className="font-mono text-xs font-black uppercase tracking-wider text-amber-400 mb-2.5">
                    {month}
                  </div>
                  <div className="space-y-3.5">
                    {Object.entries(days).map(([day, list]) => (
                      <div key={day}>
                        <div className="text-xs text-stone-300 font-bold mb-2 pl-0.5">
                          {day}
                        </div>
                        <div className="space-y-2">
                          {list.map((r) => (
                            <div
                              key={r.id}
                              onClick={() => handleOpenReport(r.id)}
                              className="w-full bg-ink-night hover:bg-ink-night-3 border border-ink-rule hover:border-purple-500/50 rounded-xl p-3 flex items-center justify-between text-xs text-left transition-all duration-150 cursor-pointer shadow-sm group active:scale-[0.99]"
                            >
                              <span className="font-bold text-cream group-hover:text-purple-300 transition-colors">
                                {r.orderCount} order{r.orderCount > 1 ? 's' : ''} &middot; {r.itemCount} item{r.itemCount > 1 ? 's' : ''}
                              </span>
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs text-stone-400 flex items-center gap-1.5 font-semibold">
                                  {loadingId === r.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                                  <span>{new Date(r.createdAt).toLocaleTimeString()}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDelete(r.id, e)}
                                  className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                  title="Delete saved report"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
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
