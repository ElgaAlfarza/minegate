'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Truck,
  RefreshCw,
  CheckCircle2,
  Activity,
  Layers,
  ChevronRight,
  BarChart3,
  TrendingUp,
  PieChart,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import { DashboardSummary } from '@/types';
import Link from 'next/link';
import {
  DailyTrafficChart,
  HourlyTrafficChart,
  FleetDonutChart,
} from '@/components/DashboardCharts';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeChartTab, setActiveChartTab] = useState<'daily' | 'hourly'>('daily');

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/summary');
      const json = await res.json();
      if (json.success && json.data) {
        setSummary(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 30000); // 30 detik auto refresh
    return () => clearInterval(interval);
  }, [fetchSummary]);

  // Rasio ritase keluar terhadap masuk hari ini
  const turnRatio =
    summary && summary.today_checkin_count > 0
      ? Math.round((summary.today_checkout_count / summary.today_checkin_count) * 100)
      : 100;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Operasional Gate
              </span>
              <span className="text-xs text-slate-400">• Diperbarui otomatis tiap 30 detik</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-500" />
              <span>Pusat Kendali &amp; Monitoring Gate Tambang</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualisasi grafik ritase armada, analisis jam sibuk hauling, dan kepatuhan K3 keselamatan pos gerbang.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSummary}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan Metrik</span>
            </button>

            <Link
              href="/gate"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition active:scale-95"
            >
              <span>Buka Gate Operasional</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Unit di Dalam Area */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                Di Dalam Area Tambang
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                INSIDE
              </span>
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-3xl font-extrabold text-white font-mono">
                {summary?.vehicles_inside_count ?? 0}
              </span>
              <span className="text-xs text-slate-400">Unit Aktif</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Terpantau di pit &amp; hauling</span>
            </div>
          </div>

          {/* Card 2: Masuk Hari Ini */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                Masuk Hari Ini
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CHECK-IN
              </span>
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-3xl font-extrabold text-white font-mono">
                {summary?.today_checkin_count ?? 0}
              </span>
              <span className="text-xs text-slate-400">Ritase Masuk</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1.5 font-medium">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Shift aktif WITA</span>
            </div>
          </div>

          {/* Card 3: Keluar Hari Ini */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                Keluar Hari Ini
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                CHECK-OUT
              </span>
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-3xl font-extrabold text-white font-mono">
                {summary?.today_checkout_count ?? 0}
              </span>
              <span className="text-xs text-slate-400">Ritase Selesai</span>
            </div>
            <div className="text-[11px] text-blue-400 mt-2 flex items-center gap-1.5 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Tervalidasi odometer</span>
            </div>
          </div>

          {/* Card 4: Overstay Alert */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between relative overflow-hidden shadow-lg transition-all ${
              (summary?.overstay_list.length ?? 0) > 0
                ? 'bg-rose-950/20 border-rose-500/40 shadow-rose-950/30'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                Peringatan Overstay
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  (summary?.overstay_list.length ?? 0) > 0
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                &gt; 12 JAM
              </span>
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span
                className={`text-3xl font-extrabold font-mono ${
                  (summary?.overstay_list.length ?? 0) > 0 ? 'text-rose-400' : 'text-white'
                }`}
              >
                {summary?.overstay_list.length ?? 0}
              </span>
              <span className="text-xs text-slate-400">Unit Terlambat</span>
            </div>
            <div
              className={`text-[11px] mt-2 flex items-center gap-1.5 ${
                (summary?.overstay_list.length ?? 0) > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {(summary?.overstay_list.length ?? 0) > 0
                  ? 'Perlu inspeksi pengawas pit!'
                  : 'Semua unit dalam batas aman'}
              </span>
            </div>
          </div>
        </div>

        {/* Overstay Alert Section */}
        {summary && summary.overstay_list.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
              <h2 className="text-sm font-bold text-rose-300 uppercase tracking-wide font-mono">
                Daftar Unit Overstay (Melebihi Batas Operasional 12 Jam)
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.overstay_list.map((item) => (
                <div
                  key={item.log_id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-rose-500/40 flex items-center justify-between text-xs shadow-md"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {item.vehicle?.unit_code || item.vehicle_id}
                      </span>
                      <span className="font-mono text-amber-400 font-bold text-[11px]">
                        {item.vehicle?.plate_number}
                      </span>
                    </div>
                    <div className="text-slate-300 font-medium">
                      Sopir: {item.driver?.name} ({item.destination})
                    </div>
                    <div className="text-[11px] text-slate-400 italic">
                      Catatan: {item.notes || 'Tidak ada catatan'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-rose-400 text-sm">
                      {item.duration_formatted}
                    </div>
                    <div className="text-[10px] text-rose-300/80 font-mono">OVERSTAY</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION UTAMA: GRAFIK & DIAGRAM INTERAKTIF */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel Kiri: Diagram Trafik Ritase (8 Cols) */}
          <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  <span>Analisis Trafik &amp; Ritase Gerbang Tambang</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Perbandingan volume keluar-masuk armada pit real-time.
                </p>
              </div>

              {/* Tab Switcher: 7 Hari vs 24 Jam */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  onClick={() => setActiveChartTab('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeChartTab === 'daily'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tren 7 Hari
                </button>
                <button
                  onClick={() => setActiveChartTab('hourly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeChartTab === 'hourly'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Distribusi 24 Jam
                </button>
              </div>
            </div>

            {/* Render Selected Chart */}
            {summary && (
              <div className="pt-1">
                {activeChartTab === 'daily' ? (
                  <DailyTrafficChart data={summary.daily_traffic_last_7_days} />
                ) : (
                  <HourlyTrafficChart data={summary.hourly_traffic_today} />
                )}
              </div>
            )}
          </div>

          {/* Panel Kanan: Diagram Donut Komposisi Armada (4 Cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-cyan-400" />
                <span>Komposisi Armada di Pit</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Proporsi unit aktif di area tambang saat ini.
              </p>
            </div>

            {summary && (
              <FleetDonutChart
                distribution={summary.vehicle_type_distribution}
                totalInside={summary.vehicles_inside_count}
              />
            )}

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>Status Kategori:</span>
              <span className="text-emerald-400 font-semibold">Tercakup 6 Jenis Unit</span>
            </div>
          </div>
        </div>

        {/* SECTION KEDUA: METRIK EFISIENSI & AKTIVITAS LOG */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel Kiri: Kartu Efisiensi & Kapasitas Gerbang (4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Efisiensi &amp; Perputaran Ritase</span>
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              {/* Rata-Rata Durasi */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Rata-Rata Durasi Hauling Hari Ini:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {summary?.average_duration_formatted || '0 menit'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Dihitung dari ritase yang telah menyelesaikan check-out
                </span>
              </div>

              {/* Rasio Penyelesaian Ritase */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Rasio Penyelesaian Ritase:</span>
                  <span className="font-mono font-bold text-amber-400">{turnRatio}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(turnRatio, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Masuk: {summary?.today_checkin_count ?? 0}</span>
                  <span>Keluar: {summary?.today_checkout_count ?? 0}</span>
                </div>
              </div>

              {/* Pos Gerbang Aktif */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[11px] font-semibold block">Pos Gerbang Aktif:</span>
                <div className="flex flex-col gap-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      GATE 1 — Utama (Main)
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">ONLINE</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      GATE 2 — Pit Utara
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">ONLINE</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      GATE 3 — Central Workshop
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">ONLINE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Kanan: 10 Aktivitas Gate Terakhir (8 cols) */}
          <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>10 Aktivitas Gate Terakhir</span>
              </h2>
              <Link
                href="/logs"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                Lihat Semua Log ➔
              </Link>
            </div>

            <div className="divide-y divide-slate-800/60">
              {summary && summary.recent_activities.length > 0 ? (
                summary.recent_activities.slice(0, 7).map((log) => {
                  const isOut = log.status === 'OUT';
                  return (
                    <div
                      key={log.log_id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isOut
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isOut ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white font-mono">
                              {log.vehicle_id}
                            </span>
                            <span className="text-slate-400 text-[11px]">• {log.purpose}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[280px]">
                            Tujuan: {log.destination}
                          </div>
                        </div>
                      </div>

                      <div className="text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full ${
                            isOut
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {log.status}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          {log.time_out || log.time_in ? (log.time_out || log.time_in).slice(11, 19) : ''} WITA
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Belum ada aktivitas tercatat.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
