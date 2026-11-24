'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  Truck,
  Search,
  RefreshCw,
  CheckCircle2,
  Wrench,
  XCircle,
  Filter,
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
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-amber-600" />
              <span>Master Data Armada Kendaraan Tambang</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                {vehicles.length} Unit
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Daftar registrasi seluruh kendaraan operasional, batas K3 status maintenance, dan angka odometer terakhir.
            </p>
          </div>

          <button
            onClick={fetchVehicles}
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
              placeholder="Cari kode unit, nomor plat EA, merk model, atau perusahaan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500"
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
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">ACTIVE (Siap Operasi)</option>
              <option value="MAINTENANCE">MAINTENANCE (Perbaikan)</option>
              <option value="INACTIVE">INACTIVE (Nonaktif)</option>
            </select>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Memuat daftar armada...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada data armada kendaraan yang cocok.
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => (
                    <tr key={v.vehicle_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-500">{v.vehicle_id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-white bg-slate-900 px-2 py-0.5 rounded text-[11px] shadow-sm">
                            {v.plate_number}
                          </span>
                          <span className="font-bold text-slate-800">{v.unit_code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {v.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{v.brand_model}</td>
                      <td className="py-3 px-4 text-slate-500">{v.owner_company}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 text-[11px]">
                        {v.last_odometer.toLocaleString()} km
                      </td>
                      <td className="py-3 px-4 text-center">
                        {v.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                          </span>
                        ) : v.status === 'MAINTENANCE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-100 text-rose-800 border border-rose-300">
                            <Wrench className="w-3 h-3" />
                            MAINTENANCE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700">
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
