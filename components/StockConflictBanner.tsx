'use client';

import React from 'react';
import { StockConflict } from '@/types/manifest';
import { AlertTriangle } from 'lucide-react';

interface StockConflictBannerProps {
  conflicts: StockConflict[];
}

export default function StockConflictBanner({ conflicts }: StockConflictBannerProps) {
  // Disabled per user request: no conflict or stock warning messages
  return null;
}
