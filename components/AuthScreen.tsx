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
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="text-xs font-semibold text-accent mb-2">
            Essentials EG &middot; Ops
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Order Manifest</h1>
          <p className="text-sm text-text-muted mt-2">
            Internal operations tool. Please enter the team access password to continue.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-[#FEE2E2] dark:bg-[#7F1D1D] border border-[#FECACA] dark:border-[#991B1B] rounded-lg flex items-center gap-3 text-[#991B1B] dark:text-[#FECACA] text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-2">
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
                className="w-full bg-bg border border-border rounded-lg px-3.5 py-2.5 text-sm text-text focus:outline-none focus:border-accent transition"
              />
              <Lock className="w-4 h-4 text-text-muted absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold text-sm py-2.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-[#E5E7EB] disabled:text-[#6B7280]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating…</span>
              </>
            ) : (
              'Unlock Terminal'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <span className="text-xs text-text-muted">
            Protected internal system &middot; Essentials EG
          </span>
        </div>
      </div>
    </div>
  );
}
