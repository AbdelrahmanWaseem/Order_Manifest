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

  const chips: Array<{
    key: ItemStatus;
    label: string;
    dotColor: string;
    activeStyles: string;
  }> = [
    {
      key: 'pending',
      label: 'Pending',
      dotColor: '#f59e0b',
      activeStyles: 'bg-amber-500/10 text-amber-300 border-amber-500/40 shadow-sm font-bold',
    },
    {
      key: 'ready',
      label: 'Ready',
      dotColor: '#10b981',
      activeStyles: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 shadow-sm font-bold',
    },
    {
      key: 'incoming',
      label: 'Incoming',
      dotColor: '#60a5fa',
      activeStyles: 'bg-blue-500/10 text-blue-300 border-blue-500/40 shadow-sm font-bold',
    },
    {
      key: 'missing',
      label: 'Missing',
      dotColor: '#f87171',
      activeStyles: 'bg-rose-500/10 text-rose-300 border-rose-500/40 shadow-sm font-bold',
    },
  ];

  return (
    <header className="border-b border-ink-rule pb-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Left: Brand & Title */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[11px] font-bold tracking-widest uppercase text-stone-400">
              Essentials EG Ops
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400 bg-ink-night-2 px-2 py-0.5 rounded border border-ink-rule font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/90"></span>
              <span>Shopify Live</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-cream">
            Order Manifest
          </h1>
        </div>

        {/* Right: Actions, Filters & Circled Theme Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter Pills */}
          <div className="flex gap-1 p-1 bg-ink-night-2 border border-ink-rule rounded-xl shadow-sm flex-wrap">
            {chips.map(({ key, label, dotColor, activeStyles }) => {
              const isActive = activeFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleFilter(key)}
                  className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? activeStyles
                      : 'border-transparent text-stone-400 hover:text-cream hover:bg-ink-night-3/60'
                  }`}
                  title={`Filter board by ${label}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span>{label}</span>
                  <span className="text-xs px-1.5 py-0.2 rounded font-mono font-bold bg-ink-night border border-ink-rule/60 text-stone-300">
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
              className="font-mono text-xs font-bold px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer ml-1"
              title="Create a manual internal order"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Manual Order</span>
            </button>
          )}

          {/* Circled Theme Toggle Button on Top Right */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full border border-ink-rule bg-ink-night-2 hover:bg-ink-night-3 text-stone-300 hover:text-white flex items-center justify-center shadow-sm transition-all duration-150 active:scale-95 cursor-pointer shrink-0 ml-auto sm:ml-1"
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
