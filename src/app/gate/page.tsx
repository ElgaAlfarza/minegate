'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import {
  DoorOpen,
  LogOut,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Truck,
  PlusCircle,
  X,
  Gauge,
  ShieldAlert,
} from 'lucide-react';
import { ActiveInsideVehicle, Vehicle, Driver, GateStation, LogPurpose } from '@/types';

export default function GatePage() {
  const [insideVehicles, setInsideVehicles] = useState<ActiveInsideVehicle[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Check-In Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedGate, setSelectedGate] = useState<GateStation>('GATE_1_MAIN');
  const [selectedPurpose, setSelectedPurpose] = useState<LogPurpose>('HAULING');
  const [destination, setDestination] = useState('Pit Utara Front A');
  const [odometerIn, setOdometerIn] = useState<number | ''>('');
  const [checkinNotes, setCheckinNotes] = useState('');
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  // Check-Out Modal State
  const [checkoutTarget, setCheckoutTarget] = useState<ActiveInsideVehicle | null>(null);
  const [odometerOut, setOdometerOut] = useState<number | ''>('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState(false);
  const [checkoutModalError, setCheckoutModalError] = useState<string | null>(null);

  // Toast Helper
  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [resInside, resVehicles, resDrivers] = await Promise.all([
        fetch('/api/gate/inside').then((r) => r.json()),
        fetch('/api/vehicles').then((r) => r.json()),
        fetch('/api/drivers').then((r) => r.json()),
      ]);

      if (resInside.success && Array.isArray(resInside.data)) {
        setInsideVehicles(resInside.data);
      }
      if (resVehicles.success && Array.isArray(resVehicles.data)) {
        setVehicles(resVehicles.data.filter((v: Vehicle) => v.status === 'ACTIVE'));
      }
      if (resDrivers.success && Array.isArray(resDrivers.data)) {
        setDrivers(resDrivers.data.filter((d: Driver) => d.status === 'ACTIVE'));
      }
    } catch (err) {
      console.error('Failed to load gate data:', err);
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // When vehicle selected in check-in form, auto-fill default odometer
  useEffect(() => {
    if (selectedVehicleId) {
      const v = vehicles.find((item) => item.vehicle_id === selectedVehicleId);
      if (v) {
        setOdometerIn(v.last_odometer);
      }
    } else {
      setOdometerIn('');
    }
  }, [selectedVehicleId, vehicles]);

  // Handle Check-In Submit
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedVehicleId || !selectedDriverId || odometerIn === '') {
      const msg = 'Harap lengkapi semua field yang wajib diisi (Kendaraan, Pengemudi, Odometer).';
      setFeedback({ type: 'error', message: msg });
      addToast('error', 'Validasi Formulir', msg);
      return;
    }

    const selectedVehicle = vehicles.find((v) => v.vehicle_id === selectedVehicleId);
    const selectedDriver = drivers.find((d) => d.driver_id === selectedDriverId);

    setIsSubmittingCheckIn(true);
    try {
      const res = await fetch('/api/gate/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: selectedVehicleId,
          driver_id: selectedDriverId,
          gate: selectedGate,
          purpose: selectedPurpose,
          destination,
          odometer_in: Number(odometerIn),
          notes: checkinNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Gagal memproses check-in');
      }

      const successMsg = `Check-in berhasil! Unit ${selectedVehicle?.unit_code || selectedVehicleId} (${selectedVehicle?.plate_number || ''}) resmi masuk gate. ID Log: ${json.data.log_id}.`;
      setFeedback({
        type: 'success',
        message: successMsg,
      });
      addToast('success', 'Check-In Berhasil', successMsg);

      // Reset form
      setSelectedVehicleId('');
      setSelectedDriverId('');
      setCheckinNotes('');
      // Background reload data tanpa flicker
      loadData(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setFeedback({
        type: 'error',
        message: errMsg,
      });
      addToast('error', 'Check-In Ditolak', errMsg);
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  // Open Checkout Modal
  const openCheckOutModal = (vehicle: ActiveInsideVehicle) => {
    setCheckoutTarget(vehicle);
    setOdometerOut(vehicle.odometer_in + 15);
    setCheckoutNotes('');
    setCheckoutModalError(null);
  };

  // Handle Check-Out Submit
  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTarget || odometerOut === '') return;

    const vCode = checkoutTarget.vehicle?.unit_code || checkoutTarget.vehicle_id;
    const vPlate = checkoutTarget.vehicle?.plate_number || '';
    const targetVehicleId = checkoutTarget.vehicle_id;

    setIsSubmittingCheckOut(true);
    setCheckoutModalError(null);
    setFeedback(null);

    try {
      const res = await fetch('/api/gate/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: targetVehicleId,
          odometer_out: Number(odometerOut),
          notes: checkoutNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Gagal memproses check-out');
      }

      const successMsg = `Check-out berhasil! Kendaraan ${vCode} (${vPlate}) resmi keluar gate. Odometer akhir: ${Number(odometerOut).toLocaleString()} km.`;
      
      // Optimistic update: langsung hapus dari daftar unit di dalam secara instan
      setInsideVehicles((prev) => prev.filter((v) => v.vehicle_id !== targetVehicleId));
      setCheckoutTarget(null);

      setFeedback({
        type: 'success',
        message: successMsg,
      });
      addToast('success', 'Check-Out Berhasil', successMsg);

      // Sinkronkan data aktual di latar belakang tanpa spinner layar penuh
      loadData(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setCheckoutModalError(errMsg);
      setFeedback({
        type: 'error',
        message: errMsg,
      });
      addToast('error', 'Check-Out Ditolak', errMsg);
    } finally {
      setIsSubmittingCheckOut(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <DoorOpen className="w-6 h-6 text-amber-500" />
              <span>Gate Operasional — Pos Check-In &amp; Check-Out</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Pencatatan keluar-masuk armada pit, verifikasi kepatuhan K3, dan kontrol overstay 12 jam.
            </p>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan Pos Gate</span>
          </button>
        </div>

        {/* Notification Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Two Column Layout: Form Check-in (Left) & Live Inside Units (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Form Check-In Manual Petugas (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-amber-500" />
                <span>Formulir Check-In Masuk Gate</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PENCATATAN MANUAL
              </span>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-3.5 text-xs">
              {/* Pilih Kendaraan */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Pilih Kendaraan <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Pilih Armada Kendaraan --</option>
                  {vehicles.map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.unit_code} - {v.plate_number} ({v.type.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilih Pengemudi */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Pilih Pengemudi <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Pilih Sopir Terdaftar --</option>
                  {drivers.map((d) => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.name} ({d.license_type}) - {d.company}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pos Gate & Keperluan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pos Gate Masuk</label>
                  <select
                    value={selectedGate}
                    onChange={(e) => setSelectedGate(e.target.value as GateStation)}
                    className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="GATE_1_MAIN">Gate 1 (Utama)</option>
                    <option value="GATE_2_PIT">Gate 2 (Pit)</option>
                    <option value="GATE_3_WORKSHOP">Gate 3 (Workshop)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Keperluan Operasi</label>
                  <select
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value as LogPurpose)}
                    className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="HAULING">Hauling Batubara</option>
                    <option value="OPERATIONAL">Operasional Pit</option>
                    <option value="MAINTENANCE">Perbaikan / Workshop</option>
                    <option value="LOGISTICS">Logistik / BBM</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Tujuan & Odometer Masuk */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tujuan Lokasi <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Contoh: Pit Utara Front A"
                    className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Odometer Masuk (km) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={odometerIn}
                    onChange={(e) => setOdometerIn(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Angka Odometer"
                    className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
                    required
                    min={0}
                  />
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catatan Khusus</label>
                <input
                  type="text"
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  placeholder="Muatan, kelengkapan APD, inspeksi K3..."
                  className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingCheckIn}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs shadow-md shadow-amber-600/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <DoorOpen className="w-4 h-4" />
                  <span>{isSubmittingCheckIn ? 'Menyimpan ke Sheets...' : 'Otorisasi Check-In Masuk'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Kolom Kanan: Daftar Unit Aktif di Dalam Pit (7 cols) */}
          <div className="lg:col-span-7 p-5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-lg space-y-4 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span>Unit di Dalam Area Tambang ({insideVehicles.length} Unit)</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Klik tombol Check-Out pada unit yang hendak keluar gerbang.
                  </p>
                </div>

                {/* Mini Visual Gauge Bar */}
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span>Kapasitas Pit:</span>
                  <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        insideVehicles.length > 20
                          ? 'bg-rose-500'
                          : insideVehicles.length > 10
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min((insideVehicles.length / 30) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="font-bold text-white">{insideVehicles.length}/30</span>
                </div>
              </div>

              {/* Table of Inside Vehicles */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Unit / Plat</th>
                      <th className="py-2.5 px-3">Pengemudi</th>
                      <th className="py-2.5 px-3">Tujuan</th>
                      <th className="py-2.5 px-3 text-right">Durasi</th>
                      <th className="py-2.5 px-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {insideVehicles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          Tidak ada kendaraan di dalam area tambang saat ini.
                        </td>
                      </tr>
                    ) : (
                      insideVehicles.map((item) => (
                        <tr
                          key={item.log_id}
                          className={`hover:bg-slate-900/50 transition-colors ${
                            item.is_overstay ? 'bg-rose-950/20' : ''
                          }`}
                        >
                          {/* Unit & Plate */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-bold text-white font-mono text-[11px]">
                              {item.vehicle?.unit_code || item.vehicle_id}
                            </div>
                            <div className="text-[10px] text-amber-400 font-mono font-bold">
                              {item.vehicle?.plate_number}
                            </div>
                          </td>

                          {/* Driver */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-200">{item.driver?.name}</div>
                            <div className="text-[10px] text-slate-400">{item.driver?.company}</div>
                          </td>

                          {/* Destination & Purpose */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-200 text-[11px] truncate max-w-[130px]">
                              {item.destination}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.purpose}</div>
                          </td>

                          {/* Duration & Overstay Flag */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div
                              className={`font-mono font-bold text-[11px] ${
                                item.is_overstay ? 'text-rose-400 animate-pulse' : 'text-slate-300'
                              }`}
                            >
                              {item.duration_formatted}
                            </div>
                            {item.is_overstay && (
                              <span className="inline-block text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 rounded">
                                OVERSTAY
                              </span>
                            )}
                          </td>

                          {/* Checkout Button */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => openCheckOutModal(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-sm transition active:scale-95 flex items-center gap-1 mx-auto"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Check-Out</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Check-Out */}
        {checkoutTarget && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white text-base">Check-Out Keluar Gate</h3>
                </div>
                <button
                  onClick={() => setCheckoutTarget(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit Kendaraan:</span>
                  <span className="font-bold text-white font-mono">
                    {checkoutTarget.vehicle?.unit_code} ({checkoutTarget.vehicle?.plate_number})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pengemudi:</span>
                  <span className="text-slate-200">{checkoutTarget.driver?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Odometer Saat Masuk:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {checkoutTarget.odometer_in.toLocaleString()} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Durasi Berada di Pit:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {checkoutTarget.duration_formatted}
                  </span>
                </div>
              </div>

              <form onSubmit={handleCheckOut} className="space-y-3 text-xs">
                {/* Inline Error Alert dalam modal */}
                {checkoutModalError && (
                  <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2 shadow-inner">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold block text-rose-300">Validasi Check-Out Ditolak:</span>
                      <span>{checkoutModalError}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Angka Odometer Keluar (km) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={odometerOut}
                    onChange={(e) => {
                      setOdometerOut(e.target.value === '' ? '' : Number(e.target.value));
                      if (checkoutModalError) setCheckoutModalError(null);
                    }}
                    min={checkoutTarget.odometer_in}
                    className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-blue-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Minimal harus sama atau lebih besar dari {checkoutTarget.odometer_in.toLocaleString()} km
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Catatan Keluar</label>
                  <input
                    type="text"
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    placeholder="Kondisi muatan, kelengkapan..."
                    className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutTarget(null);
                      setCheckoutModalError(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingCheckOut}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 transition active:scale-95 flex items-center gap-1.5"
                  >
                    {isSubmittingCheckOut && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSubmittingCheckOut ? 'Menyimpan...' : 'Konfirmasi Check-Out'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Floating Notification Toast */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </AppShell>
  );
}
