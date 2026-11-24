'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, HardHat, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, badge }) => {
  const [timeStr, setTimeStr] = useState<string>('09:30:00 WITA');
  const [dateStr, setDateStr] = useState<string>('Selasa, 24 Nov 2026');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format WITA (UTC+8)
      const optionsTime: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Makassar',
      };
      const optionsDate: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Makassar',
      };
      setTimeStr(`${now.toLocaleTimeString('id-ID', optionsTime)} WITA`);
      setDateStr(now.toLocaleDateString('id-ID', optionsDate));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
      {/* Title & Info */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
            {badge && (
              <span className="text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Real-time Clock & Operational Info */}
      <div className="flex items-center gap-3">
        {/* K3 Alert Bar */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-300">
          <HardHat className="w-3.5 h-3.5 text-amber-400" />
          <span>Metode: <strong className="text-white font-medium">Pencatatan Manual Gate</strong></span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <div className="flex flex-col text-right">
            <span className="font-mono font-bold text-white tracking-wide">{timeStr}</span>
            <span className="text-[10px] text-slate-400">{dateStr}</span>
          </div>
        </div>

        {/* Gate Officer Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Shift 1 (06:00 - 18:00)</span>
        </div>
      </div>
    </header>
  );
};
