'use client';

import React, { useState, useEffect } from 'react';
import { ItemStatus } from '@/types/manifest';
import { Sun, Moon, Plus, Sparkles } from 'lucide-react';

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

  const chips: Array<{
    key: ItemStatus;
    label: string;
    color: string;
    activeBg: string;
    borderActive: string;
  }> = [
    {
      key: 'pending',
      label: 'Pending',
      color: '#f59e0b',
      activeBg: 'bg-amber-500/15 text-amber-300 dark:text-amber-200',
      borderActive: 'border-amber-500/60 ring-1 ring-amber-500/30',
    },
    {
      key: 'ready',
      label: 'Ready',
      color: '#10b981',
      activeBg: 'bg-emerald-500/15 text-emerald-400 dark:text-emerald-300',
      borderActive: 'border-emerald-500/60 ring-1 ring-emerald-500/30',
    },
    {
      key: 'incoming',
      label: 'Incoming',
      color: '#3b82f6',
      activeBg: 'bg-blue-500/15 text-blue-400 dark:text-blue-300',
      borderActive: 'border-blue-500/60 ring-1 ring-blue-500/30',
    },
    {
      key: 'missing',
      label: 'Missing',
      color: '#f43f5e',
      activeBg: 'bg-rose-500/15 text-rose-400 dark:text-rose-300',
      borderActive: 'border-rose-500/60 ring-1 ring-rose-500/30',
    },
  ];

  return (
    <header className="border-b border-ink-rule pb-5 mb-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-stamp-pending bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              Essentials EG Ops
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Shopify Live</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-cream flex items-center gap-2.5">
            <span>Order Manifest</span>
          </h1>
        </div>

        {/* Right: Actions, Filters & Circled Theme Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-ink-night-2/90 border border-ink-rule rounded-xl shadow-sm backdrop-blur-sm flex-wrap">
            {chips.map(({ key, label, color, activeBg, borderActive }) => {
              const isActive = activeFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleFilter(key)}
                  className={`font-mono text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? `${activeBg} ${borderActive} shadow-sm font-bold`
                      : 'border-transparent text-stone-300 hover:text-white hover:bg-ink-night-3/70'
                  }`}
                  title={`Filter board by ${label}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span>{label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.2 rounded font-extrabold ${
                      isActive ? 'bg-black/20' : 'bg-ink-rule/60 text-stone-200'
                    }`}
                  >
                    {counts[key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Create Manual Order Modern Button */}
          {onOpenManualOrder && (
            <button
              type="button"
              onClick={onOpenManualOrder}
              className="font-mono text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_4px_14px_rgba(139,92,246,0.35)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)] transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer ml-1"
              title="Create a manual internal order"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="tracking-wide">Manual Order</span>
            </button>
          )}

          {/* Circled Theme Toggle Button on Top Right */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border border-ink-rule bg-ink-night-2/90 hover:bg-ink-night-3 text-cream flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer shrink-0 ml-auto sm:ml-1"
            title={`Switch to ${mounted && theme === 'light' ? 'Dark' : 'Light'} mode`}
            aria-label="Toggle theme"
          >
            {mounted && theme === 'light' ? (
              <Moon className="w-4 h-4 text-indigo-500 fill-indigo-500/20 transition-transform hover:-rotate-12 duration-200" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20 transition-transform hover:rotate-45 duration-200" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
