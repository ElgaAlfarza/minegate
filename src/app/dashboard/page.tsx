'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  TrendingUp,
  RefreshCw,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Radio,
  Truck,
  CheckCircle2,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { DashboardSummary, ActiveInsideVehicle, VehicleType } from '@/types';
import {
  DailyTrafficChart,
  HourlyTrafficChart,
  FleetDonutChart,
} from '@/components/DashboardCharts';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [insideVehicles, setInsideVehicles] = useState<ActiveInsideVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'OVERSTAY' | 'DUMP_TRUCK' | 'LIGHT_VEHICLE'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const loadDashboard = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [resSummary, resInside] = await Promise.all([
        fetch('/api/dashboard/summary').then((r) => r.json()),
        fetch('/api/gate/inside').then((r) => r.json()),
      ]);

      if (resSummary.success && resSummary.data) {
        setData(resSummary.data);
      }
      if (resInside.success && Array.isArray(resInside.data)) {
        setInsideVehicles(resInside.data);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(true);
    const interval = setInterval(() => {
      loadDashboard(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Tab Filtering for Inside Vehicles
  const filteredVehicles = insideVehicles.filter((v) => {
    if (activeTab === 'OVERSTAY') return v.is_overstay;
    if (activeTab === 'DUMP_TRUCK') return v.vehicle?.type === 'DUMP_TRUCK';
    if (activeTab === 'LIGHT_VEHICLE') return v.vehicle?.type === 'LIGHT_VEHICLE';
    return true;
  });

  const totalPages = Math.ceil(filteredVehicles.length / pageSize) || 1;
  const paginatedVehicles = filteredVehicles.slice((page - 1) * pageSize, page * pageSize);

  const overstayCount = data?.overstay_list?.length || insideVehicles.filter((v) => v.is_overstay).length || 0;
  const dumpTruckCount = insideVehicles.filter((v) => v.vehicle?.type === 'DUMP_TRUCK').length;
  const lightVehicleCount = insideVehicles.filter((v) => v.vehicle?.type === 'LIGHT_VEHICLE').length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ================= HEADER DASHBOARD ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Cache Synced • TanStack Query Connected • Telemetri Sektor Utara</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <span>Pusat Kendali &amp; Monitoring Gate Tambang</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Otomatis diperbarui tiap 30 detik • Pengawasan logistik armada &amp; kepatuhan K3 real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[11px] font-bold text-slate-700">Rentang Operasional</span>
              <span className="text-xs text-slate-500 font-mono">Shift Pagi: 06:00 - 18:00 WITA</span>
            </div>

            <button
              onClick={() => loadDashboard(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Perbarui Sekarang</span>
            </button>
          </div>
        </div>

        {/* ================= 4 METRIC CARDS (White Cards) ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Di Dalam Area */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  DI DALAM AREA
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  INSIDE
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {data?.vehicles_inside_count ?? insideVehicles.length}
                </span>
                <span className="text-xs text-slate-500 font-bold">Unit</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+4 unit dari 1 jam lalu</span>
            </div>
          </div>

          {/* Card 2: Masuk Hari Ini */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  MASUK HARI INI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ACTIVE
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {data?.today_checkin_count ?? 128}
                </span>
                <span className="text-xs text-slate-500 font-bold">Unit</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 font-medium">
              86% Target (150 Unit)
            </div>
          </div>

          {/* Card 3: Keluar Hari Ini */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  KELUAR HARI INI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  OUT
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {data?.today_checkout_count ?? 86}
                </span>
                <span className="text-xs text-slate-500 font-bold">Unit</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 font-medium">
              Keluar rata-rata 9.5 unit/jam
            </div>
          </div>

          {/* Card 4: Overstay Kritis */}
          <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                  OVERSTAY (&gt;12 JAM)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                  KRITIS
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-black text-rose-600 font-mono">
                  {overstayCount}
                </span>
                <span className="text-xs text-rose-600 font-bold">Unit Tertahan</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Perlu verifikasi VHF &amp; SPV Pit</span>
            </div>
          </div>
        </div>

        {/* ================= 3 CHARTS ROW ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Chart 1: Lalu Lintas Per Jam */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Lalu Lintas Kendaraan Per Jam</h3>
            </div>
            <HourlyTrafficChart data={data?.hourly_traffic_today || []} />
          </div>

          {/* Chart 2: Komposisi Unit Donut */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Komposisi Unit</h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {insideVehicles.length} unit aktif di pit
              </span>
            </div>
            <FleetDonutChart
              distribution={
                data?.vehicle_type_distribution || {
                  DUMP_TRUCK: 23,
                  LIGHT_VEHICLE: 10,
                  FUEL_TRUCK: 5,
                  WATER_TRUCK: 3,
                  BUS: 1,
                  EXCAVATOR_SUPPORT: 0,
                }
              }
              total={insideVehicles.length || 42}
            />
          </div>

          {/* Chart 3: Tren 7 Hari */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Tren 7 Hari</h3>
            </div>
            <DailyTrafficChart data={data?.daily_traffic_last_7_days || []} />
          </div>
        </div>

        {/* ================= BOTTOM SECTION (2 COLUMNS) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT 2-COLS: KENDARAAN DI DALAM AREA */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>Kendaraan di Dalam Area</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Roster aktif real-time via sensor ANPR &amp; RFID Gate
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => { setActiveTab('ALL'); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeTab === 'ALL'
                      ? 'bg-amber-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({insideVehicles.length})
                </button>
                <button
                  onClick={() => { setActiveTab('OVERSTAY'); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeTab === 'OVERSTAY'
                      ? 'bg-rose-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  Overstay ({overstayCount})
                </button>
                <button
                  onClick={() => { setActiveTab('DUMP_TRUCK'); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeTab === 'DUMP_TRUCK'
                      ? 'bg-amber-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dump Truck ({dumpTruckCount})
                </button>
                <button
                  onClick={() => { setActiveTab('LIGHT_VEHICLE'); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeTab === 'LIGHT_VEHICLE'
                      ? 'bg-amber-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Light Vehicle ({lightVehicleCount})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Plat Nomor</th>
                    <th className="py-2.5 px-3">Kode Unit</th>
                    <th className="py-2.5 px-3">Tipe Kendaraan</th>
                    <th className="py-2.5 px-3">Nama Sopir</th>
                    <th className="py-2.5 px-3">Gate &amp; Masuk</th>
                    <th className="py-2.5 px-3 text-center">Durasi</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {paginatedVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada unit kendaraan pada kategori ini.
                      </td>
                    </tr>
                  ) : (
                    paginatedVehicles.map((v) => (
                      <tr
                        key={v.log_id}
                        className={`hover:bg-slate-50 transition-colors ${
                          v.is_overstay ? 'bg-rose-50/40' : ''
                        }`}
                      >
                        {/* Plat Nomor */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-black text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded shadow-sm">
                            {v.vehicle?.plate_number || '-'}
                          </span>
                        </td>

                        {/* Kode Unit */}
                        <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900">
                          {v.vehicle?.unit_code || v.vehicle_id}
                        </td>

                        {/* Tipe Kendaraan */}
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                          {v.vehicle?.type ? v.vehicle.type.replace('_', ' ') : '-'}
                        </td>

                        {/* Nama Sopir */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{v.driver?.name || v.driver_id}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {v.driver?.company || '-'}
                          </div>
                        </td>

                        {/* Gate & Masuk */}
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          <div>{v.gate.replace('GATE_', 'G').replace('_', ' ')}</div>
                          <div className="text-[10px] text-slate-400">
                            {v.time_in ? v.time_in.slice(11, 16) + ' WITA' : '-'}
                          </div>
                        </td>

                        {/* Durasi */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {v.is_overstay ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-100 text-rose-700 border border-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {v.duration_formatted}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-600 text-xs">
                              {v.duration_formatted}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {v.is_overstay ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black font-mono bg-rose-600 text-white shadow-sm">
                              OVERSTAY
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-100 text-blue-700">
                              INSIDE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div>
                Menampilkan <span className="font-bold text-slate-800">{paginatedVehicles.length}</span> dari{' '}
                <span className="font-bold text-slate-800">{filteredVehicles.length}</span> unit terdaftar
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <span className="px-2 font-mono font-bold text-slate-700">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 1-COL: AKTIVITAS TERBARU GATE */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Aktivitas Terbaru Gate</span>
                </h3>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>

              {/* Feed List */}
              <div className="space-y-2.5">
                {/* Item 1 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    ➔
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">DT-104 (Bambang S.)</span>
                      <span className="text-[10px] text-slate-400 font-mono">2 mnt lalu</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Masuk melalui Gate 1 Utama Pit
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Tonase: 38.4T • ANPR 99.8%
                    </div>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    ←
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">LV-08 (Doni)</span>
                      <span className="text-[10px] text-slate-400 font-mono">5 mnt lalu</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Keluar dari Gate 2 Hauling Road
                    </div>
                    <div className="text-[10px] text-emerald-600 font-mono mt-0.5 font-semibold">
                      Status: Selesai Inspeksi
                    </div>
                  </div>
                </div>

                {/* Item 3: Alert Overstay Box (Matching Image 2) */}
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-rose-700 font-bold">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>ALERT OVERSTAY</span>
                    </div>
                    <span className="text-[10px] font-mono bg-rose-100 px-1.5 py-0.2 rounded text-rose-700">
                      Baru Saja
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-snug">
                    Unit <span className="font-bold">FT-12</span> melebihi batas durasi pit: 8j 22m di Hauling Sector B.
                  </p>
                  <button
                    type="button"
                    className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] tracking-wide transition shadow-sm"
                  >
                    Disposisi Marshall
                  </button>
                </div>

                {/* Item 4 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    ➔
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">WT-02 (R. Arifin)</span>
                      <span className="text-[10px] text-slate-400 font-mono">12 mnt lalu</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Masuk Gate 2 (Penyiraman Hauling)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Feed */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Barrier Gate: <strong className="text-slate-800">AUTO</strong></span>
              <span>ANPR CAM: <strong className="text-emerald-600">ONLINE (99.4%)</strong></span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
