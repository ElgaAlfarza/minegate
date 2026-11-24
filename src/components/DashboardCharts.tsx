'use client';

import React, { useState } from 'react';
import { VehicleType } from '@/types';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, BarChart3, PieChart, Clock } from 'lucide-react';

// ==============================================================================
// 1. DIAGRAM TREN 7 HARI TERAKHIR (SVG Area & Bar Combo)
// ==============================================================================
interface DailyTrafficItem {
  date: string;
  in: number;
  out: number;
}

export function DailyTrafficChart({ data }: { data: DailyTrafficItem[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs font-mono">
        Tidak ada data trafik 7 hari terakhir
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.in, d.out)), 5);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 40;
  const stepX = (chartWidth - paddingX * 2) / (data.length - 1 || 1);

  // Format label hari dalam Bahasa Indonesia
  const formatDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' }).format(d);
    } catch {
      return dateStr.slice(5);
    }
  };

  return (
    <div className="space-y-3">
      {/* Legend & Summary */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-slate-300 font-medium">Check-In (Masuk)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500" />
            <span className="text-slate-300 font-medium">Check-Out (Keluar)</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Total 7 Hari: <span className="text-white font-bold">{data.reduce((a, b) => a + b.in + b.out, 0)}</span> ritase
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
          className="w-full h-48 overflow-visible"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartHeight - ratio * chartHeight + 10;
            const val = Math.round(ratio * maxVal);
            return (
              <g key={ratio}>
                <line
                  x1={paddingX - 10}
                  y1={y}
                  x2={chartWidth - 10}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 16}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Grouped Bars per Date */}
          {data.map((item, idx) => {
            const xCenter = paddingX + idx * stepX;
            const barW = 12;
            const inH = (item.in / maxVal) * chartHeight;
            const outH = (item.out / maxVal) * chartHeight;
            const inY = chartHeight - inH + 10;
            const outY = chartHeight - outH + 10;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={item.date}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Background highlight on hover */}
                {isHovered && (
                  <rect
                    x={xCenter - barW - 6}
                    y={10}
                    width={barW * 2 + 12}
                    height={chartHeight}
                    fill="#334155"
                    opacity="0.3"
                    rx="4"
                  />
                )}

                {/* Bar Check-In (Green) */}
                <rect
                  x={xCenter - barW - 1}
                  y={inY}
                  width={barW}
                  height={Math.max(inH, 2)}
                  fill="url(#emeraldGrad)"
                  rx="3"
                  stroke="#10b981"
                  strokeWidth={isHovered ? '1.5' : '0.5'}
                />

                {/* Bar Check-Out (Blue) */}
                <rect
                  x={xCenter + 1}
                  y={outY}
                  width={barW}
                  height={Math.max(outH, 2)}
                  fill="url(#blueGrad)"
                  rx="3"
                  stroke="#3b82f6"
                  strokeWidth={isHovered ? '1.5' : '0.5'}
                />

                {/* X-Axis Date Label */}
                <text
                  x={xCenter}
                  y={chartHeight + 28}
                  textAnchor="middle"
                  fill={isHovered ? '#f8fafc' : '#94a3b8'}
                  fontSize="9.5"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {formatDayName(item.date)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-3 right-3 bg-slate-950/95 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1 backdrop-blur-md pointer-events-none">
            <div className="font-bold text-white border-b border-slate-800 pb-1 font-mono">
              {data[hoveredIdx].date}
            </div>
            <div className="flex items-center justify-between gap-4 text-emerald-400">
              <span>Masuk (In):</span>
              <span className="font-bold font-mono">{data[hoveredIdx].in} unit</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-blue-400">
              <span>Keluar (Out):</span>
              <span className="font-bold font-mono">{data[hoveredIdx].out} unit</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==============================================================================
// 2. DIAGRAM RITASE PER JAM HARI INI (24 Jam Shift Histogram)
// ==============================================================================
interface HourlyTrafficItem {
  hour: string;
  in: number;
  out: number;
}

export function HourlyTrafficChart({ data }: { data: HourlyTrafficItem[] }) {
  const [hoveredHour, setHoveredHour] = useState<HourlyTrafficItem | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs font-mono">
        Tidak ada data trafik per jam
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.in + d.out), 4);
  const currentHour = new Date().getHours();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-300">In</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="text-slate-300">Out</span>
          </div>
          <div className="flex items-center gap-1.5 ml-2 text-[11px] text-amber-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Jam {String(currentHour).padStart(2, '0')}:00 WITA (Aktif)</span>
          </div>
        </div>

        {hoveredHour && (
          <div className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
            {hoveredHour.hour} ➔ In: <strong className="text-emerald-400">{hoveredHour.in}</strong> | Out: <strong className="text-blue-400">{hoveredHour.out}</strong>
          </div>
        )}
      </div>

      {/* 24-Hour Bar Matrix */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <div className="grid grid-cols-12 md:grid-cols-24 gap-1 items-end h-40 pt-4">
          {data.map((item, idx) => {
            const hNum = parseInt(item.hour.split(':')[0], 10);
            const isCurrent = hNum === currentHour;
            const total = item.in + item.out;
            const inHeightPct = maxVal > 0 ? (item.in / maxVal) * 100 : 0;
            const outHeightPct = maxVal > 0 ? (item.out / maxVal) * 100 : 0;

            return (
              <div
                key={item.hour}
                onMouseEnter={() => setHoveredHour(item)}
                onMouseLeave={() => setHoveredHour(null)}
                className={`relative flex flex-col justify-end items-center h-full group cursor-pointer p-0.5 rounded transition-all ${
                  isCurrent ? 'bg-amber-500/10 ring-1 ring-amber-500/40' : 'hover:bg-slate-800/60'
                }`}
              >
                {/* Stacked Vertical Bars */}
                <div className="w-full flex flex-col justify-end items-center gap-0.5 h-full">
                  {/* Out bar */}
                  {item.out > 0 && (
                    <div
                      className="w-full max-w-[12px] bg-blue-500 rounded-t-sm transition-all group-hover:brightness-125"
                      style={{ height: `${Math.max(outHeightPct, 4)}%` }}
                    />
                  )}
                  {/* In bar */}
                  {item.in > 0 && (
                    <div
                      className={`w-full max-w-[12px] bg-emerald-500 transition-all group-hover:brightness-125 ${
                        item.out === 0 ? 'rounded-t-sm' : ''
                      }`}
                      style={{ height: `${Math.max(inHeightPct, 4)}%` }}
                    />
                  )}
                  {total === 0 && (
                    <div className="w-full max-w-[6px] h-1 bg-slate-800 rounded-full" />
                  )}
                </div>

                {/* Hour label below (tampil per 2 atau 3 jam agar rapi) */}
                <span
                  className={`text-[9px] font-mono mt-1.5 ${
                    isCurrent
                      ? 'text-amber-400 font-bold'
                      : idx % 3 === 0
                      ? 'text-slate-400'
                      : 'text-slate-400 hidden sm:block'
                  }`}
                >
                  {item.hour.slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Shift Legend Underneath */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span>Shift 3 (Malam): 23:00 - 07:00</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Shift 1 (Pagi): 07:00 - 15:00</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>Shift 2 (Sore): 15:00 - 23:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 3. DIAGRAM DONUT KOMPOSISI ARMADA TAMBANG (Fleet Donut Chart)
// ==============================================================================
const VEHICLE_COLORS: Record<VehicleType, { color: string; label: string; bg: string }> = {
  DUMP_TRUCK: { color: '#f59e0b', label: 'Dump Truck', bg: 'bg-amber-500' },
  WATER_TRUCK: { color: '#06b6d4', label: 'Water Truck', bg: 'bg-cyan-500' },
  FUEL_TRUCK: { color: '#ea580c', label: 'Fuel Truck', bg: 'bg-orange-500' },
  BUS: { color: '#6366f1', label: 'Bus Karyawan', bg: 'bg-indigo-500' },
  LIGHT_VEHICLE: { color: '#10b981', label: 'Light Vehicle (LV)', bg: 'bg-emerald-500' },
  EXCAVATOR_SUPPORT: { color: '#a855f7', label: 'Support Excavator', bg: 'bg-purple-500' },
};

export function FleetDonutChart({
  distribution,
  totalInside,
}: {
  distribution: Record<VehicleType, number>;
  totalInside: number;
}) {
  const [activeSegment, setActiveSegment] = useState<VehicleType | null>(null);

  const entries = Object.entries(distribution) as [VehicleType, number][];
  const total = totalInside || entries.reduce((sum, [, count]) => sum + count, 0);

  // Perhitungan SVG circle stroke-dasharray & stroke-dashoffset
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="space-y-4">
      {/* Donut Visual Center */}
      <div className="relative flex items-center justify-center py-2">
        <svg width="170" height="170" viewBox="0 0 170 170" className="transform -rotate-90">
          {/* Base empty ring */}
          <circle
            cx="85"
            cy="85"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth="18"
          />

          {total > 0 &&
            entries.map(([type, count]) => {
              if (count === 0) return null;
              const ratio = count / total;
              const strokeLength = ratio * circumference;
              const strokeOffset = accumulatedOffset;
              accumulatedOffset += strokeLength;

              const config = VEHICLE_COLORS[type] || { color: '#94a3b8', label: type };
              const isHovered = activeSegment === type;

              return (
                <circle
                  key={type}
                  cx="85"
                  cy="85"
                  r={radius}
                  fill="transparent"
                  stroke={config.color}
                  strokeWidth={isHovered ? 24 : 18}
                  strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                  strokeDashoffset={-strokeOffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setActiveSegment(type)}
                  onMouseLeave={() => setActiveSegment(null)}
                />
              );
            })}
        </svg>

        {/* Center Text inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-extrabold text-white font-mono leading-none">
            {activeSegment ? distribution[activeSegment] : total}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-1">
            {activeSegment ? VEHICLE_COLORS[activeSegment].label.slice(0, 14) : 'Unit di Dalam'}
          </span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        {entries.map(([type, count]) => {
          const config = VEHICLE_COLORS[type];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isSelected = activeSegment === type;

          return (
            <div
              key={type}
              onMouseEnter={() => setActiveSegment(type)}
              onMouseLeave={() => setActiveSegment(null)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-slate-600 shadow-md'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-slate-300 font-medium text-[11px] truncate">
                  {config.label}
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono pl-4">
                <span className="text-white font-bold text-xs">{count} unit</span>
                <span className="text-slate-400 text-[10px]">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
