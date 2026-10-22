'use client';

import React, { useState } from 'react';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ink-night">
      <div className="w-full max-w-md bg-ink-night-2 border border-ink-rule rounded-lg p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="font-mono text-xs tracking-widest uppercase text-stamp-pending mb-2">
            Essentials EG — Ops
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-cream">Order Manifest</h1>
          <p className="text-xs text-stone-400 mt-2">
            Internal operations terminal. Please enter the team access password to continue.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-stamp-missing rounded flex items-center gap-3 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-stamp-missing" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-stone-400 mb-2">
              Team Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password…"
                autoFocus
                required
                className="w-full bg-ink-night border border-ink-rule rounded px-3.5 py-2.5 text-sm font-mono text-cream focus:outline-none focus:border-stamp-pending transition"
              />
              <Lock className="w-4 h-4 text-stone-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stamp-pending hover:bg-[#b57a24] text-ink-dark font-semibold text-sm py-2.5 rounded transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating…</span>
              </>
            ) : (
              'Unlock Terminal'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-ink-rule/50 text-center">
          <span className="text-[11px] font-mono text-stone-500">
            Protected internal system &middot; Essentials EG
          </span>
        </div>
      </div>
    </div>
  );
}
