'use client';

import React, { useState } from 'react';
import { VehicleType } from '@/types';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, BarChart3, PieChart } from 'lucide-react';

// ==============================================================================
// 1. DIAGRAM LALU LINTAS PER JAM (Hourly Bar Chart)
// ==============================================================================
interface HourlyTrafficItem {
  hour: string;
  in: number;
  out: number;
}

export function HourlyTrafficChart({ data }: { data: HourlyTrafficItem[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Filter jam operasional umum (06:00 s.d 18:00)
  const displayData = data && data.length > 0 ? data : [];
  const maxVal = Math.max(...displayData.map((d) => Math.max(d.in, d.out)), 4);

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center justify-between text-xs pb-1">
        <div className="text-[11px] text-slate-500 font-medium">Rentang 06:00 - 18:00 WITA [Shift Berjalan]</div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span className="text-slate-600 font-medium text-[11px]">Masuk (In)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-slate-600 font-medium text-[11px]">Keluar (Out)</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="h-44 w-full flex items-end gap-2 pt-4 px-2 border-b border-slate-200">
        {displayData.map((item, idx) => {
          const inHeightPct = Math.min(100, Math.max(8, (item.in / maxVal) * 100));
          const outHeightPct = Math.min(100, Math.max(8, (item.out / maxVal) * 100));
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={item.hour}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center gap-1 group cursor-pointer relative h-full justify-end"
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg shadow-xl font-mono whitespace-nowrap pointer-events-none">
                  <div className="font-bold text-amber-400">Pukul {item.hour}</div>
                  <div>Masuk: {item.in} | Keluar: {item.out}</div>
                </div>
              )}

              {/* Bars Pair */}
              <div className="w-full flex items-end justify-center gap-1 h-32">
                <div
                  style={{ height: `${inHeightPct}%` }}
                  className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-300 ${
                    isHovered ? 'bg-amber-500 shadow-md' : 'bg-amber-600'
                  }`}
                />
                <div
                  style={{ height: `${outHeightPct}%` }}
                  className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-300 ${
                    isHovered ? 'bg-blue-500 shadow-md' : 'bg-blue-600'
                  }`}
                />
              </div>

              {/* X-Axis Label */}
              <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-900 mt-1">
                {item.hour.slice(0, 2)}:00
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==============================================================================
// 2. DIAGRAM DONUT KOMPOSISI UNIT
// ==============================================================================
interface FleetDonutProps {
  distribution: Record<VehicleType, number>;
  total: number;
}

const TYPE_METADATA: Record<VehicleType, { label: string; color: string }> = {
  DUMP_TRUCK: { label: 'Dump Truck', color: '#D97706' }, // Amber
  FUEL_TRUCK: { label: 'Fuel Truck', color: '#2563EB' }, // Blue
  WATER_TRUCK: { label: 'Water Tank', color: '#0D9488' }, // Teal
  BUS: { label: 'Bus Karyawan', color: '#7C3AED' }, // Purple
  LIGHT_VEHICLE: { label: 'LV / Hilux', color: '#EA580C' }, // Orange
  EXCAVATOR_SUPPORT: { label: 'Excavator Support', color: '#059669' }, // Green
};

export function FleetDonutChart({ distribution, total }: FleetDonutProps) {
  const [hoveredType, setHoveredType] = useState<VehicleType | null>(null);

  const radius = 56;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Hitung segmen SVG Donut
  const entries = Object.entries(distribution) as [VehicleType, number][];
  const sortedEntries = entries.sort((a, b) => b[1] - a[1]);

  let currentOffset = 0;
  const segments = sortedEntries.map(([type, count]) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += (percentage / 100) * circumference;

    return {
      type,
      count,
      percentage: Math.round(percentage),
      strokeDasharray,
      strokeDashoffset,
      meta: TYPE_METADATA[type] || { label: type, color: '#64748B' },
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-1">
      {/* Donut SVG with Center Label */}
      <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
          />
          {segments.map((s) => (
            <circle
              key={s.type}
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke={s.meta.color}
              strokeWidth={strokeWidth}
              strokeDasharray={s.strokeDasharray}
              strokeDashoffset={s.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 cursor-pointer hover:opacity-80"
              onMouseEnter={() => setHoveredType(s.type)}
              onMouseLeave={() => setHoveredType(null)}
            />
          ))}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-2xl font-black text-slate-800 font-mono leading-none">
            {hoveredType ? distribution[hoveredType] : total}
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
            {hoveredType ? (TYPE_METADATA[hoveredType]?.label.slice(0, 8) || 'UNIT') : 'UNIT'}
          </span>
        </div>
      </div>

      {/* Legend List */}
      <div className="flex-1 w-full space-y-1.5 text-xs">
        {segments.map((s) => (
          <div
            key={s.type}
            onMouseEnter={() => setHoveredType(s.type)}
            onMouseLeave={() => setHoveredType(null)}
            className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer ${
              hoveredType === s.type ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.meta.color }} />
              <span className="text-slate-700 text-xs font-medium truncate max-w-[120px]">
                {s.meta.label}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-500">({s.percentage}%)</span>
              <span className="font-bold text-slate-900 w-5 text-right">{s.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==============================================================================
// 3. DIAGRAM TREN 7 HARI TERAKHIR (Smooth Area Chart)
// ==============================================================================
interface DailyTrafficItem {
  date: string;
  in: number;
  out: number;
}

export function DailyTrafficChart({ data }: { data: DailyTrafficItem[] }) {
  if (!data || data.length === 0) {
    return <div className="h-44 flex items-center justify-center text-slate-400 text-xs font-mono">Tidak ada data</div>;
  }

  const totals = data.map((d) => d.in + d.out);
  const maxVal = Math.max(...totals, 5);

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 320 + 20;
    const y = 120 - ((d.in + d.out) / maxVal) * 90;
    return { x, y, date: d.date, total: d.in + d.out };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} 130 L ${points[0].x} 130 Z`;

  const getDayLabel = (dateStr: string, idx: number) => {
    if (idx === data.length - 1) return 'Hari ini';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d);
    } catch {
      return dateStr.slice(5);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-[11px] text-slate-500 font-medium">Fluktuasi ritase mingguan</div>

      <div className="relative h-44 w-full">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 360 140">
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D97706" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="20" y1="30" x2="340" y2="30" stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1="20" y1="75" x2="340" y2="75" stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1="20" y1="120" x2="340" y2="120" stroke="#CBD5E1" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#trendGradient)" />

          {/* Stroke Line */}
          <path d={pathD} fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />

          {/* Data Dots */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#B45309" stroke="#FFFFFF" strokeWidth="2" />
              <text
                x={p.x}
                y="135"
                textAnchor="middle"
                fontSize="9"
                fill="#64748B"
                fontFamily="sans-serif"
                fontWeight="500"
              >
                {getDayLabel(p.date, i)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
