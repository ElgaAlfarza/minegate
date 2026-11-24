'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  Truck,
  Search,
  Filter,
  RefreshCw,
  Plus,
  CheckCircle2,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Vehicle } from '@/types';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/vehicles');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setVehicles(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const filtered = vehicles.filter((v) => {
    if (typeFilter !== 'ALL' && v.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matches =
        v.unit_code.toLowerCase().includes(q) ||
        v.plate_number.toLowerCase().includes(q) ||
        v.brand_model.toLowerCase().includes(q) ||
        v.owner_company.toLowerCase().includes(q);
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
              <Truck className="w-6 h-6 text-amber-500" />
              <span>Master Data Armada Kendaraan Tambang</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {vehicles.length} Unit
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Daftar registrasi seluruh kendaraan operasional, batas K3 status maintenance, dan angka odometer terakhir.
            </p>
          </div>

          <button
            onClick={fetchVehicles}
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
              placeholder="Cari kode unit, nomor plat EA, merk model, atau perusahaan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Jenis Unit</option>
              <option value="DUMP_TRUCK">Dump Truck</option>
              <option value="WATER_TRUCK">Water Truck</option>
              <option value="FUEL_TRUCK">Fuel Truck</option>
              <option value="BUS">Bus Karyawan</option>
              <option value="LIGHT_VEHICLE">Light Vehicle</option>
              <option value="EXCAVATOR_SUPPORT">Excavator Support</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">ACTIVE (Siap Operasi)</option>
              <option value="MAINTENANCE">MAINTENANCE (Perbaikan)</option>
              <option value="INACTIVE">INACTIVE (Nonaktif)</option>
            </select>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID Unit</th>
                  <th className="py-3 px-4">Kode &amp; Plat</th>
                  <th className="py-3 px-4">Jenis Unit</th>
                  <th className="py-3 px-4">Merk &amp; Tipe Model</th>
                  <th className="py-3 px-4">Perusahaan Pemilik</th>
                  <th className="py-3 px-4 text-right">Odometer Terakhir</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Memuat daftar armada...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada kendaraan yang sesuai filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => (
                    <tr key={v.vehicle_id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 font-semibold">
                        {v.vehicle_id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                            {v.unit_code}
                          </span>
                          <span className="font-mono text-[10px] bg-amber-400/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/20 font-bold">
                            {v.plate_number}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                          {v.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-medium">
                        {v.brand_model}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {v.owner_company}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {v.last_odometer.toLocaleString()} km
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {v.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                        {v.status === 'MAINTENANCE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Wrench className="w-3 h-3" />
                            MAINTENANCE
                          </span>
                        )}
                        {v.status === 'INACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-400">
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
