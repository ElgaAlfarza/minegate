'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Wrench } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  isOverstay?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  isOverstay = false,
  className = '',
}) => {
  if (isOverstay || status === 'OVERSTAY') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        OVERSTAY ({'>'}8 Jam)
      </span>
    );
  }

  switch (status.toUpperCase()) {
    case 'INSIDE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          DI DALAM PIT
        </span>
      );

    case 'OUT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
          SELESAI (OUT)
        </span>
      );

    case 'ACTIVE':
    case 'AVAILABLE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          STANDBY / AKTIF
        </span>
      );

    case 'MAINTENANCE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 ${className}`}
        >
          <Wrench className="w-3.5 h-3.5" />
          WORKSHOP / PERBAIKAN
        </span>
      );

    case 'INACTIVE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 ${className}`}
        >
          TIDAK AKTIF
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 ${className}`}
        >
          {status}
        </span>
      );
  }
};
