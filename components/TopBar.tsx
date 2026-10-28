'use client';

import React, { useState, useEffect } from 'react';
import { ItemStatus } from '@/types/manifest';
import { Sun, Moon, Plus } from 'lucide-react';

interface TopBarProps {
  counts: Record<ItemStatus, number>;
  activeFilter: ItemStatus | null;
  onToggleFilter: (status: ItemStatus) => void;
  onOpenManualOrder?: () => void;
}

export default function TopBar({
  counts,
  activeFilter,
  onToggleFilter,
  onOpenManualOrder,
}: TopBarProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || document.documentElement.classList.contains('light')) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const statusChips: Array<{
    key: ItemStatus;
    label: string;
    lightBg: string;
    lightText: string;
    darkBg: string;
    darkText: string;
    activeRing: string;
  }> = [
    {
      key: 'pending',
      label: 'Pending',
      lightBg: 'bg-[#FEF3C7]',
      lightText: 'text-[#92400E]',
      darkBg: 'dark:bg-[#451A03]',
      darkText: 'dark:text-[#FDE68A]',
      activeRing: 'ring-2 ring-amber-500 font-semibold',
    },
    {
      key: 'ready',
      label: 'Ready',
      lightBg: 'bg-[#DCFCE7]',
      lightText: 'text-[#166534]',
      darkBg: 'dark:bg-[#14532D]',
      darkText: 'dark:text-[#BBF7D0]',
      activeRing: 'ring-2 ring-emerald-500 font-semibold',
    },
    {
      key: 'incoming',
      label: 'Incoming',
      lightBg: 'bg-[#DBEAFE]',
      lightText: 'text-[#1E40AF]',
      darkBg: 'dark:bg-[#1E3A8A]',
      darkText: 'dark:text-[#BFDBFE]',
      activeRing: 'ring-2 ring-blue-500 font-semibold',
    },
    {
      key: 'missing',
      label: 'Missing',
      lightBg: 'bg-[#FEE2E2]',
      lightText: 'text-[#991B1B]',
      darkBg: 'dark:bg-[#7F1D1D]',
      darkText: 'dark:text-[#FECACA]',
      activeRing: 'ring-2 ring-red-500 font-semibold',
    },
  ];

  return (
    <header className="border-b border-border pb-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div>
          <h1 className="text-2xl font-semibold text-text tracking-tight leading-tight">
            Order Manifest
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-muted font-medium">Essentials EG Ops</span>
            <span className="text-text-muted text-xs">&middot;</span>
            <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Shopify Live</span>
            </div>
          </div>
        </div>

        {/* Right: Actions, Filters & Circled Theme Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg p-1">
            {statusChips.map(({ key, label, lightBg, lightText, darkBg, darkText, activeRing }) => {
              const isActive = activeFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleFilter(key)}
                  className={`text-xs px-2.5 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${lightBg} ${lightText} ${darkBg} ${darkText} ${
                    isActive ? activeRing : 'opacity-85 hover:opacity-100'
                  }`}
                  title={`Filter board by ${label}`}
                >
                  <span className="font-medium">{label}</span>
                  <span className="font-semibold tabular-nums">
                    {counts[key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Create Manual Order Button */}
          {onOpenManualOrder && (
            <button
              type="button"
              onClick={onOpenManualOrder}
              className="h-10 px-4 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
              title="Create a manual internal order"
            >
              <Plus className="w-4 h-4 stroke-[2.25]" />
              <span>Manual Order</span>
            </button>
          )}

          {/* Circled Theme Toggle Button on Top Right */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border border-border bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-text flex items-center justify-center transition cursor-pointer shrink-0"
            title={`Switch to ${mounted && theme === 'light' ? 'Dark' : 'Light'} mode`}
            aria-label="Toggle theme"
          >
            {mounted && theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
