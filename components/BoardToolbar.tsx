'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface BoardToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMarkAllRemainingReady: () => void;
}

export default function BoardToolbar({
  searchQuery,
  onSearchChange,
  onMarkAllRemainingReady,
}: BoardToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          placeholder="Search customer or order #…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-ink-night-2 border border-ink-rule rounded px-3 py-2 pl-9 text-xs text-cream placeholder-stone-500 focus:outline-none focus:border-stamp-pending transition"
        />
        <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
      </div>

      <button
        type="button"
        onClick={onMarkAllRemainingReady}
        className="bg-transparent hover:bg-stone-900 border border-ink-rule hover:border-stone-500 text-stone-300 font-semibold text-xs px-3.5 py-2 rounded transition cursor-pointer self-start sm:self-auto"
      >
        Mark all remaining Ready
      </button>
    </div>
  );
}
