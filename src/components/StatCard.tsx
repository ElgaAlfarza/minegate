'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  highlight = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'bg-rose-950/20 border-rose-800/40 text-rose-400',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          iconBg: 'bg-rose-500/20 text-rose-400',
          pulse: true,
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/20 border-amber-800/40 text-amber-400',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          iconBg: 'bg-amber-500/20 text-amber-400',
          pulse: false,
        };
      case 'success':
        return {
          bg: 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          iconBg: 'bg-emerald-500/20 text-emerald-400',
          pulse: false,
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-800 text-slate-300',
          badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
          iconBg: 'bg-slate-800 text-amber-400',
          pulse: false,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`relative p-5 rounded-xl border transition-all ${styles.bg} ${
        highlight ? 'ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {value}
            </span>
          </div>
          {subtext && <p className="text-xs text-slate-400 pt-1">{subtext}</p>}
        </div>

        <div className={`p-3 rounded-xl border border-white/5 ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {styles.pulse && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
        </span>
      )}
    </div>
  );
};
