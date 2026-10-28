'use client';

import React, { useState, useEffect } from 'react';
import { ReportSnapshot } from '@/types/manifest';
import { Calendar, Trash2, X, Loader2, FileText } from 'lucide-react';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: ReportSnapshot) => void;
  onDeleteReport: (reportId: string) => void;
}

export default function ArchiveModal({
  isOpen,
  onClose,
  onSelectReport,
  onDeleteReport,
}: ArchiveModalProps) {
  const [reports, setReports] = useState<ReportSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch archived reports');
      }
      setReports(data.reports || []);
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this saved report?')) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        onDeleteReport(id);
      } else {
        alert('Failed to delete report');
      }
    } catch {
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
      onSelectReport(data.report);
      onClose();
    } catch (err: any) {
      alert(`Could not open report: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  if (!isOpen) return null;

  // Group by Month and then by Day
  const groupedReports: Record<string, Record<string, ReportSnapshot[]>> = {};

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
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col shadow-lg overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-bg border border-border flex items-center justify-center text-accent">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-text">Saved Reports Archive</h3>
              <p className="text-xs text-text-muted mt-0.5">Browse and restore previous manifest batches</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-bg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center text-sm text-text-muted flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span>Loading saved reports…</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-muted">
              No saved reports yet. Generate a report and it will appear here.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedReports).map(([month, days]) => (
                <div key={month}>
                  <div className="text-xs font-semibold text-text-muted mb-2">
                    {month}
                  </div>
                  <div className="space-y-3">
                    {Object.entries(days).map(([day, list]) => (
                      <div key={day}>
                        <div className="text-xs text-text font-medium mb-1.5 pl-0.5">
                          {day}
                        </div>
                        <div className="space-y-1.5">
                          {list.map((r) => (
                            <div
                              key={r.id}
                              onClick={() => handleOpenReport(r.id)}
                              className="w-full bg-bg hover:bg-slate-100 dark:hover:bg-slate-800 border border-border rounded-lg p-3 flex items-center justify-between text-xs text-left transition cursor-pointer group shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <FileText className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                                <span className="font-semibold text-text tabular-nums">
                                  {r.orderCount} order{r.orderCount > 1 ? 's' : ''} &middot; {r.itemCount} item{r.itemCount > 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-text-muted tabular-nums font-medium flex items-center gap-1.5">
                                  {loadingId === r.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />}
                                  <span>{new Date(r.createdAt).toLocaleTimeString()}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDelete(r.id, e)}
                                  className="p-1 text-text-muted hover:text-red-600 dark:hover:text-red-400 rounded transition cursor-pointer"
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
