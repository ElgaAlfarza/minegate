'use client';

import React from 'react';
import { VehicleType } from '@/types';

interface HourlyData {
  hour: string;
  in: number;
  out: number;
}

interface HourlyTrafficChartProps {
  data: HourlyData[];
}

export const HourlyTrafficChart: React.FC<HourlyTrafficChartProps> = ({ data }) => {
  const maxVal = Math.max(...data.flatMap((d) => [d.in, d.out, 3]));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Trafik Gate per Jam Hari Ini</h3>
          <p className="text-xs text-slate-400">Pencatatan manual pos gerbang shift 1</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-slate-300">Masuk (In)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-slate-300">Keluar (Out)</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="h-48 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
        {data.map((item, index) => {
          const inHeight = (item.in / maxVal) * 100;
          const outHeight = (item.out / maxVal) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] px-2 py-1 rounded border border-slate-700 pointer-events-none z-10 whitespace-nowrap shadow-lg">
                {item.hour}: Masuk {item.in} | Keluar {item.out}
              </div>

              {/* Bars */}
              <div className="w-full flex items-end justify-center gap-1 h-36">
                <div
                  style={{ height: `${Math.max(inHeight, item.in > 0 ? 8 : 0)}%` }}
                  className="w-1/2 max-w-[14px] bg-emerald-500 rounded-t transition-all group-hover:brightness-110 relative"
                >
                  {item.in > 0 && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-400 font-bold">
                      {item.in}
                    </span>
                  )}
                </div>
                <div
                  style={{ height: `${Math.max(outHeight, item.out > 0 ? 8 : 0)}%` }}
                  className="w-1/2 max-w-[14px] bg-amber-500 rounded-t transition-all group-hover:brightness-110 relative"
                >
                  {item.out > 0 && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-amber-400 font-bold">
                      {item.out}
                    </span>
                  )}
                </div>
              </div>

              {/* Label */}
              <span className="text-[10px] font-mono text-slate-500 mt-2 truncate">{item.hour}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface UnitCompositionProps {
  distribution: Record<VehicleType, number>;
}

export const UnitCompositionChart: React.FC<UnitCompositionProps> = ({ distribution }) => {
  const typeLabels: Record<VehicleType, { label: string; color: string; hex: string }> = {
    DUMP_TRUCK: { label: 'Hauling Dump Truck', color: 'bg-amber-500', hex: '#f59e0b' },
    EXCAVATOR_SUPPORT: { label: 'Excavator & Loader', color: 'bg-blue-500', hex: '#3b82f6' },
    FUEL_TRUCK: { label: 'Fuel & Lube Truck', color: 'bg-rose-500', hex: '#f43f5e' },
    WATER_TRUCK: { label: 'Water Sprayer Truck', color: 'bg-cyan-500', hex: '#06b6d4' },
    LIGHT_VEHICLE: { label: 'Support LV (Hilux/Triton)', color: 'bg-emerald-500', hex: '#10b981' },
    BUS: { label: 'Manhaul & Bus Kru', color: 'bg-purple-500', hex: '#a855f7' },
  };

  const total = Object.values(distribution).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white tracking-wide">Komposisi Unit Tambang Terdaftar</h3>
        <p className="text-xs text-slate-400">Total {total} armada terdaftar di pos gerbang</p>
      </div>

      {/* Progress Bar Stack */}
      <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex mb-6">
        {Object.entries(distribution).map(([typeKey, count]) => {
          const type = typeKey as VehicleType;
          const info = typeLabels[type] || { label: type, color: 'bg-slate-600', hex: '#64748b' };
          const percent = total > 0 ? (count / total) * 100 : 0;
          if (count === 0) return null;

          return (
            <div
              key={type}
              style={{ width: `${percent}%` }}
              className={`${info.color} h-full transition-all relative group cursor-pointer`}
              title={`${info.label}: ${count} unit (${percent.toFixed(0)}%)`}
            />
          );
        })}
      </div>

      {/* Breakdown List */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {Object.entries(distribution).map(([typeKey, count]) => {
          const type = typeKey as VehicleType;
          const info = typeLabels[type] || { label: type, color: 'bg-slate-600', hex: '#64748b' };
          const percent = total > 0 ? ((count / total) * 100).toFixed(0) : '0';

          return (
            <div key={type} className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center gap-2 truncate">
                <span className={`w-2.5 h-2.5 rounded-full ${info.color} shrink-0`} />
                <span className="text-slate-300 font-medium truncate">{info.label}</span>
              </div>
              <div className="flex items-center gap-1 font-mono font-bold text-white shrink-0 ml-2">
                <span>{count}</span>
                <span className="text-[10px] text-slate-500 font-normal">({percent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface DailyTrendProps {
  data: Array<{ date: string; in: number; out: number }>;
}

export const DailyTrendChart: React.FC<DailyTrendProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Tren Lalu Lintas 7 Hari Terakhir</h3>
          <p className="text-xs text-slate-400">Total volume kendaraan keluar-masuk</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {data.map((day, i) => {
          const totalDay = day.in + day.out;
          const maxDay = 35;
          const pct = Math.min(100, (totalDay / maxDay) * 100);

          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">{day.date}</span>
                <span className="font-mono text-slate-200">
                  <strong className="text-emerald-400">{day.in}</strong> In /{' '}
                  <strong className="text-amber-400">{day.out}</strong> Out
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(day.in / maxDay) * 100}%` }}
                  className="bg-emerald-500 h-full"
                />
                <div
                  style={{ width: `${(day.out / maxDay) * 100}%` }}
                  className="bg-amber-500 h-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
