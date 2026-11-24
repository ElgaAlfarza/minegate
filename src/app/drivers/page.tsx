'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Driver } from '@/types';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/drivers');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDrivers(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const filtered = drivers.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matches =
        d.name.toLowerCase().includes(q) ||
        d.driver_id.toLowerCase().includes(q) ||
        d.license_type.toLowerCase().includes(q) ||
        d.company.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-600" />
              <span>Daftar Pengemudi &amp; Operator Tambang</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                {drivers.length} Sopir
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Data master sopir, nomor lisensi SIMPER pertambangan, dan kontak perusahaan kontraktor.
            </p>
          </div>

          <button
            onClick={fetchDrivers}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama sopir, SIMPER, perusahaan, atau ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">ACTIVE (SIMPER Valid)</option>
              <option value="SUSPENDED">SUSPENDED (Ditangguhkan)</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID Driver</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">SIMPER / Lisensi Tambang</th>
                  <th className="py-3 px-4">Perusahaan / Kontraktor</th>
                  <th className="py-3 px-4">Nomor Telepon Radio</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Memuat daftar sopir...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada pengemudi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.driver_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-500">{d.driver_id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {d.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900">{d.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {d.license_type || 'SIMPER B2'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{d.company}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {d.phone || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {d.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3" />
                            SUSPENDED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
