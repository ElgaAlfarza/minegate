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
        d.phone.includes(q);
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
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              <span>Master Data Pengemudi &amp; Operator Tambang</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {drivers.length} Sopir
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Data lisensi pengemudi resmi, sertifikasi SIM, dan verifikasi status aktif operasional.
            </p>
          </div>

          <button
            onClick={fetchDrivers}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama sopir, ID pengemudi, perusahaan, atau nomor kontak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">ACTIVE (Aktif Bertugas)</option>
              <option value="INACTIVE">INACTIVE (Nonaktif)</option>
            </select>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID Sopir</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Jenis Lisensi SIM</th>
                  <th className="py-3 px-4">Perusahaan / Kontraktor</th>
                  <th className="py-3 px-4">Nomor Telepon</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Memuat data pengemudi...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada pengemudi yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.driver_id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-400">
                        {d.driver_id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-white text-xs">{d.name}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                          <ShieldCheck className="w-3 h-3 text-amber-400" />
                          {d.license_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {d.company}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{d.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {d.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-400">
                            <XCircle className="w-3 h-3" />
                            INACTIVE
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
