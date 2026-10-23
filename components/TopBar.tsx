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

  const chips: Array<{ key: ItemStatus; label: string; color: string }> = [
    { key: 'pending', label: 'Pending', color: '#c98a2b' },
    { key: 'ready', label: 'Ready', color: '#2f6b4f' },
    { key: 'incoming', label: 'Incoming', color: '#3a5f8a' },
    { key: 'missing', label: 'Missing', color: '#a4392f' },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-ink-rule pb-4 mb-6 gap-4">
      <div>
        <div className="font-mono text-xs font-bold tracking-[0.16em] uppercase text-stamp-pending mb-1">
          Essentials EG — Ops
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-cream">
            Order Manifest
          </h1>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-ink-night-2 border border-ink-rule text-stone-300">
            Shopify Live
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {chips.map(({ key, label, color }) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleFilter(key)}
                className={`font-mono text-xs font-semibold px-3 py-1.5 rounded-[4px] border flex items-center gap-2 transition cursor-pointer shadow-sm ${
                  isActive
                    ? 'bg-ink-night border-cream text-cream ring-1 ring-cream/40'
                    : 'bg-ink-night-2 border-ink-rule hover:border-stone-400 text-stone-200'
                }`}
                title={`Filter board by ${label}`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
                  style={{ backgroundColor: color }}
                />
                <span>{label}</span>
                <b className="text-sm font-extrabold text-cream">{counts[key]}</b>
              </button>
            );
          })}
        </div>

        {onOpenManualOrder && (
          <button
            type="button"
            onClick={onOpenManualOrder}
            className="font-mono text-xs font-bold px-3 py-1.5 rounded-[3px] bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer ml-1"
            title="Create a manual internal order"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Manual Order</span>
          </button>
        )}

        <div className="h-6 w-px bg-ink-rule mx-1 hidden sm:block" />

        <button
          type="button"
          onClick={toggleTheme}
          className="font-mono text-xs px-2.5 py-1.5 rounded-[3px] border border-ink-rule bg-ink-night-2 hover:border-stone-500 text-cream flex items-center gap-1.5 transition cursor-pointer shadow-sm ml-auto sm:ml-0"
          title={`Switch to ${mounted && theme === 'light' ? 'Dark' : 'Light'} mode`}
        >
          {mounted && theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[11.5px] font-medium">Dark mode</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11.5px] font-medium">Light mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
