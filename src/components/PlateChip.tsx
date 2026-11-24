'use client';

import React from 'react';
import { Truck } from 'lucide-react';

interface PlateChipProps {
  unitCode: string;
  plateNumber?: string;
  type?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PlateChip: React.FC<PlateChipProps> = ({
  unitCode,
  plateNumber,
  type,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div className="inline-flex items-center gap-1.5 font-mono select-none">
      {/* Unit Code Mining Badge */}
      <span
        className={`font-black rounded tracking-wider flex items-center gap-1 shadow-sm ${
          isSm
            ? 'px-1.5 py-0.5 text-[11px] bg-amber-500 text-slate-950'
            : isLg
            ? 'px-3 py-1.5 text-base bg-amber-500 text-slate-950 font-black'
            : 'px-2 py-1 text-xs bg-amber-500 text-slate-950 font-extrabold'
        }`}
      >
        <span className="opacity-70 text-[9px] font-sans font-bold">#</span>
        {unitCode}
      </span>

      {/* Official Indonesian Mining Plate */}
      {plateNumber && (
        <span
          className={`font-bold rounded border tracking-wider ${
            isSm
              ? 'px-1.5 py-0.5 text-[10px] bg-slate-900 text-slate-200 border-slate-700'
              : isLg
              ? 'px-2.5 py-1 text-sm bg-slate-950 text-white border-slate-700'
              : 'px-2 py-0.5 text-xs bg-slate-900 text-slate-200 border-slate-750'
          }`}
        >
          {plateNumber}
        </span>
      )}
    </div>
  );
};
