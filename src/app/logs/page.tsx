'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  Download,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { GateLog, Vehicle, Driver } from '@/types';

export default function LogsPage() {
  const [logs, setLogs] = useState<GateLog[]>([]);
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});
  const [drivers, setDrivers] = useState<Record<string, Driver>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Server-side Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [gateFilter, setGateFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // Master data
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/api/vehicles').then((r) => r.json()),
      fetch('/api/drivers').then((r) => r.json()),
    ])
      .then(([resVehicles, resDrivers]) => {
        if (!mounted) return;
        if (resVehicles.success && Array.isArray(resVehicles.data)) {
          const vMap: Record<string, Vehicle> = {};
          resVehicles.data.forEach((v: Vehicle) => {
            vMap[v.vehicle_id] = v;
          });
          setVehicles(vMap);
        }
        if (resDrivers.success && Array.isArray(resDrivers.data)) {
          const dMap: Record<string, Driver> = {};
          resDrivers.data.forEach((d: Driver) => {
            dMap[d.driver_id] = d;
          });
          setDrivers(dMap);
        }
      })
      .catch((err) => console.error('Error fetching master data:', err));

    return () => {
      mounted = false;
    };
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      if (gateFilter !== 'ALL') {
        params.set('gate', gateFilter);
      }
      if (searchTerm.trim()) {
        params.set('q', searchTerm.trim());
      }

      const resLogs = await fetch(`/api/logs?${params.toString()}`).then((r) => r.json());

      if (resLogs.success && resLogs.data) {
        setLogs(resLogs.data.items || []);
        if (resLogs.data.pagination) {
          setTotalCount(resLogs.data.pagination.total);
          setTotalPages(resLogs.data.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, gateFilter, searchTerm]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle Export CSV
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await fetch('/api/reports/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minegate_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const totalInside = logs.filter((l) => l.status === 'INSIDE').length;
  const totalOut = logs.filter((l) => l.status === 'OUT').length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <span>Riwayat Log Operasional Gate</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                {totalCount} Total Data
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Data operasional keluar-masuk kendaraan tambang dari Gate 1 (Utama), Gate 2 (Pit), dan Gate 3 (Workshop).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
              <span>Muat Ulang</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Mengunduh...' : 'Ekspor Excel (CSV)'}</span>
            </button>
          </div>
        </div>

        {/* Metrik Mini Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Semua Log</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{totalCount}</div>
            </div>
            <FileSpreadsheet className="w-5 h-5 text-slate-400" />
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Unit di Dalam Area</div>
              <div className="text-2xl font-black text-amber-600 font-mono mt-0.5">{totalInside}</div>
            </div>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Selesai Bertugas</div>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">{totalOut}</div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Status Koneksi</div>
              <div className="text-xs font-bold text-emerald-600 font-mono mt-1">Sheets Online</div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode unit, plat, nama sopir, tujuan, atau ID log..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={gateFilter}
              onChange={(e) => {
                setGateFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Gate</option>
              <option value="GATE_1_MAIN">Gate 1 (Utama)</option>
              <option value="GATE_2_PIT">Gate 2 (Pit)</option>
              <option value="GATE_3_WORKSHOP">Gate 3 (Workshop)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="INSIDE">INSIDE (Di Dalam)</option>
              <option value="OUT">OUT (Selesai)</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID Log</th>
                  <th className="py-3 px-4">Unit &amp; Plat</th>
                  <th className="py-3 px-4">Pengemudi</th>
                  <th className="py-3 px-4">Gate</th>
                  <th className="py-3 px-4">Keperluan &amp; Tujuan</th>
                  <th className="py-3 px-4">Waktu Masuk</th>
                  <th className="py-3 px-4">Waktu Keluar</th>
                  <th className="py-3 px-4 text-right">Odometer</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                        <span>Memuat data dari Google Sheets...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Tidak ada data log yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const vehicle = vehicles[log.vehicle_id];
                    const driver = drivers[log.driver_id];
                    const isInside = log.status === 'INSIDE';

                    return (
                      <tr
                        key={log.log_id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isInside ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-500 whitespace-nowrap">
                          {log.log_id}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-white bg-slate-900 px-2 py-0.5 rounded text-[11px] shadow-sm">
                              {vehicle?.plate_number || '-'}
                            </span>
                            <span className="font-bold text-slate-800">
                              {vehicle?.unit_code || log.vehicle_id}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{driver?.name || log.driver_id}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {driver?.company || vehicle?.owner_company || '-'}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                            {log.gate.replace('GATE_', 'G').replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 text-xs">{log.purpose}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {log.destination}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                          {log.time_in ? log.time_in.replace('T', ' ').slice(5, 19) : '-'}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                          {log.time_out ? (
                            log.time_out.replace('T', ' ').slice(5, 19)
                          ) : (
                            <span className="text-amber-700 font-semibold italic text-xs">Belum keluar</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-[11px] whitespace-nowrap">
                          <div className="text-slate-800 font-bold">{log.odometer_in.toLocaleString()} km</div>
                          {log.odometer_out ? (
                            <div className="text-emerald-700 font-semibold text-[10px]">
                              ➔ {Number(log.odometer_out).toLocaleString()} km
                            </div>
                          ) : null}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isInside ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300">
                              INSIDE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700">
                              OUT
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[200px] truncate" title={log.notes}>
                          {log.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Menampilkan <span className="font-bold text-slate-900">{totalCount > 0 ? (page - 1) * pageSize + 1 : 0}</span> -{' '}
              <span className="font-bold text-slate-900">{Math.min(page * pageSize, totalCount)}</span> dari{' '}
              <span className="font-bold text-slate-900">{totalCount}</span> log
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition text-slate-700 font-medium"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 font-mono font-bold text-slate-800">
                Hal {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition text-slate-700 font-medium"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
