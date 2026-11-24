'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  DoorOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  Search,
  Truck,
  User,
  Gauge,
  MapPin,
  FileText,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Camera,
  Video,
  Lock,
  Layers,
  Fuel,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Vehicle, Driver, ActiveInsideVehicle } from '@/types';
import { ToastContainer, ToastMessage } from '@/components/Toast';

export default function GatePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [insideVehicles, setInsideVehicles] = useState<ActiveInsideVehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMode, setActiveMode] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [selectedGate, setSelectedGate] = useState<'GATE_1_MAIN' | 'GATE_2_PIT' | 'GATE_3_WORKSHOP'>('GATE_1_MAIN');

  // Check-In Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [vehicleSearch, setVehicleSearch] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('HAULING');
  const [destination, setDestination] = useState<string>('Pit Hauling Alfa');
  const [specificLocation, setSpecificLocation] = useState<string>('ROM Hauling Mile 12');
  const [odometerIn, setOdometerIn] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('Muatan Batubara 45 Ton, Surat Jalan terlampir No. SJ-88910');

  // Check-Out Modal State
  const [checkoutTarget, setCheckoutTarget] = useState<ActiveInsideVehicle | null>(null);
  const [odometerOut, setOdometerOut] = useState<number | ''>('');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [checkoutModalError, setCheckoutModalError] = useState<string | null>(null);

  // Status & Notifications
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState<boolean>(false);
  const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Data
  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [resVehicles, resDrivers, resInside] = await Promise.all([
        fetch('/api/vehicles').then((r) => r.json()),
        fetch('/api/drivers').then((r) => r.json()),
        fetch('/api/gate/inside').then((r) => r.json()),
      ]);

      if (resVehicles.success && Array.isArray(resVehicles.data)) {
        setVehicles(resVehicles.data);
      }
      if (resDrivers.success && Array.isArray(resDrivers.data)) {
        setDrivers(resDrivers.data);
      }
      if (resInside.success && Array.isArray(resInside.data)) {
        setInsideVehicles(resInside.data);
      }
    } catch (err) {
      console.error('Error loading gate data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Selected vehicle & driver details
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.vehicle_id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  const selectedDriver = useMemo(() => {
    return drivers.find((d) => d.driver_id === selectedDriverId) || null;
  }, [drivers, selectedDriverId]);

  // Auto-set initial driver if empty
  useEffect(() => {
    if (!selectedDriverId && drivers.length > 0) {
      setSelectedDriverId(drivers[0].driver_id);
    }
  }, [drivers, selectedDriverId]);

  // When vehicle selected, update suggested odometer
  useEffect(() => {
    if (selectedVehicle) {
      setOdometerIn(Number(selectedVehicle.last_odometer));
    }
  }, [selectedVehicle]);

  // Filter vehicles for search
  const filteredVehiclesSearch = useMemo(() => {
    if (!vehicleSearch.trim()) return [];
    const q = vehicleSearch.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.plate_number.toLowerCase().includes(q) ||
        v.unit_code.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [vehicles, vehicleSearch]);

  // Quick Select Vehicle from Pills (Matching Image 1)
  const selectQuickVehicle = (unitCode: string) => {
    const found = vehicles.find((v) => v.unit_code.toLowerCase() === unitCode.toLowerCase());
    if (found) {
      setSelectedVehicleId(found.vehicle_id);
      setVehicleSearch(found.plate_number);
    }
  };

  // Submit Check-In
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !selectedDriverId || odometerIn === '') {
      addToast('error', 'Validasi Gagal', 'Mohon lengkapi unit kendaraan, sopir, dan angka odometer masuk.');
      return;
    }

    if (selectedVehicle && selectedVehicle.status === 'MAINTENANCE') {
      addToast(
        'error',
        'Check-In Ditolak',
        `Kendaraan ${selectedVehicle.unit_code} (${selectedVehicle.plate_number}) berstatus MAINTENANCE. Sesuai aturan K3, unit perbaikan dilarang memasuki area operasional.`
      );
      return;
    }

    setIsSubmittingCheckIn(true);
    try {
      const res = await fetch('/api/gate/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: selectedVehicleId,
          driver_id: selectedDriverId,
          gate: selectedGate,
          purpose,
          destination: specificLocation ? `${destination} - ${specificLocation}` : destination,
          odometer_in: Number(odometerIn),
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Gagal memproses check-in');
      }

      const vCode = selectedVehicle?.unit_code || selectedVehicleId;
      const vPlate = selectedVehicle?.plate_number || '';
      addToast('success', 'Check-In Berhasil', `Kendaraan ${vCode} (${vPlate}) telah terverifikasi masuk.`);

      // Reset form
      setVehicleSearch('');
      setSelectedVehicleId('');
      loadData(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
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

  // Handle Checkout Submit
  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTarget || odometerOut === '') return;

    setIsSubmittingCheckOut(true);
    setCheckoutModalError(null);

    const targetVehicleId = checkoutTarget.vehicle_id;
    const vCode = checkoutTarget.vehicle?.unit_code || targetVehicleId;

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

      setInsideVehicles((prev) => prev.filter((v) => v.vehicle_id !== targetVehicleId));
      setCheckoutTarget(null);
      addToast('success', 'Check-Out Berhasil', `Kendaraan ${vCode} resmi keluar gate. Odometer ter-update.`);
      loadData(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setCheckoutModalError(errMsg);
      addToast('error', 'Check-Out Gagal', errMsg);
    } finally {
      setIsSubmittingCheckOut(false);
    }
  };

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="space-y-5">
        {/* ================= 1. STASIUN STATUS BAR (Image 1 Match) ================= */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-mono font-bold text-slate-700 tracking-wider">
              STASIUN OPERASIONAL TERMINAL POS-01
            </div>

            {/* Gate Selectors */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedGate('GATE_1_MAIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedGate === 'GATE_1_MAIN'
                    ? 'bg-[#B45309] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>Gate 1 (Utama Pit - Aktif)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedGate('GATE_2_PIT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedGate === 'GATE_2_PIT'
                    ? 'bg-[#B45309] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Gate 2 (Hauling West)
              </button>
              <button
                type="button"
                onClick={() => setSelectedGate('GATE_3_WORKSHOP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedGate === 'GATE_3_WORKSHOP'
                    ? 'bg-[#B45309] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Gate 3 (Workshop &amp; ROM)
              </button>
            </div>
          </div>

          {/* Right Status Indicators */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 text-blue-700 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              RFID Reader Online
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-700 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              Sensor Loop Aktif
            </span>
            <span className="inline-flex items-center gap-1.5 text-blue-700 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Kamera ANPR Siap
            </span>
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold border border-slate-300 flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              TEST PORTAL
            </button>
          </div>
        </div>

        {/* ================= 2. ALUR ACTION SWITCHER TABS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Check-In Tab */}
          <button
            type="button"
            onClick={() => setActiveMode('CHECK_IN')}
            className={`p-4 rounded-2xl border transition text-left flex items-center justify-between ${
              activeMode === 'CHECK_IN'
                ? 'bg-white border-[#B45309] shadow-md ring-2 ring-[#B45309]/20'
                : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                ➔
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  ALUR MASUK BARRIER
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  Check-In Kendaraan
                </div>
              </div>
            </div>
            <span className="w-3 h-3 rounded-full bg-amber-600" />
          </button>

          {/* Check-Out Tab */}
          <button
            type="button"
            onClick={() => setActiveMode('CHECK_OUT')}
            className={`p-4 rounded-2xl border transition text-left flex items-center justify-between ${
              activeMode === 'CHECK_OUT'
                ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-600/20'
                : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                ←
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  ALUR KELUAR PIT &amp; HAULING
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  Check-Out Kendaraan
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-600 text-white shadow-sm">
              {insideVehicles.length} Unit Di Dalam
            </span>
          </button>
        </div>

        {/* ================= 3. MODE: CHECK-IN ================= */}
        {activeMode === 'CHECK_IN' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: FORM REGISTRASI (7 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Form Registrasi Kedatangan Unit
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Format cepat • Minimal ketikan lapangan
                </span>
              </div>

              <form onSubmit={handleCheckIn} className="space-y-4">
                {/* 1. Pencarian Unit Kendaraan */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Pencarian Kendaraan Tambang (Plat / Kode Unit) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari unit (misal: DT-205, KT 8821 MG, CAT-777)..."
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      className="w-full pl-9 pr-20 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => selectQuickVehicle('DT-205')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono text-[10px] font-bold rounded-lg"
                    >
                      ANPR
                    </button>
                  </div>

                  {/* Dropdown filter matches */}
                  {filteredVehiclesSearch.length > 0 && (
                    <div className="p-1 rounded-xl bg-white border border-slate-200 shadow-lg space-y-1">
                      {filteredVehiclesSearch.map((v) => (
                        <div
                          key={v.vehicle_id}
                          onClick={() => {
                            setSelectedVehicleId(v.vehicle_id);
                            setVehicleSearch(v.plate_number);
                          }}
                          className="p-2 rounded-lg hover:bg-slate-100 flex items-center justify-between text-xs cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">
                              {v.plate_number}
                            </span>
                            <span className="font-bold text-slate-800">{v.unit_code}</span>
                            <span className="text-[11px] text-slate-500">({v.type})</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            v.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {v.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Select Pills (Image 1 Match) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => selectQuickVehicle('DT-205')}
                      className="p-1.5 pr-3 rounded-lg bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-center gap-2 text-left transition"
                    >
                      <span className="font-mono font-bold text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded">
                        KT 8821 MG
                      </span>
                      <span className="text-[11px] font-bold text-slate-800">DT-205</span>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1 rounded">
                        ACTIVE
                      </span>
                      <span className="text-[10px] text-slate-500">Dump Truck 50T</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectQuickVehicle('DT-118')}
                      className="p-1.5 pr-3 rounded-lg bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-center gap-2 text-left transition"
                    >
                      <span className="font-mono font-bold text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded">
                        KT 5519 BA
                      </span>
                      <span className="text-[11px] font-bold text-slate-800">DT-118</span>
                      <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1 rounded">
                        MAINTENANCE
                      </span>
                      <span className="text-[10px] text-slate-500">Service Rms</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectQuickVehicle('LV-044')}
                      className="p-1.5 pr-3 rounded-lg bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-center gap-2 text-left transition"
                    >
                      <span className="font-mono font-bold text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded">
                        B 9044 XQ
                      </span>
                      <span className="text-[11px] font-bold text-slate-800">LV-044</span>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1 rounded">
                        ACTIVE
                      </span>
                      <span className="text-[10px] text-slate-500">Supervisor Pit</span>
                    </button>
                  </div>
                </div>

                {/* 2. Data Sopir / Operator Tambang */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Data Sopir / Operator Tambang <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-blue-600 font-semibold">
                      Wajib SIMPER Aktif
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full pl-3 pr-24 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
                    >
                      {drivers.map((d) => (
                        <option key={d.driver_id} value={d.driver_id}>
                          {d.name} [SIMPER: {d.license_type || 'SMP-7712'} — {d.company}]
                        </option>
                      ))}
                    </select>

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-blue-600 text-white font-mono text-[9px] font-bold rounded">
                      SIMPER AKTIF
                    </span>
                  </div>
                </div>

                {/* 3. Pemilihan Gate Masuk Fisik */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Pemilihan Gate Masuk Fisik <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGate('GATE_1_MAIN')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedGate === 'GATE_1_MAIN'
                          ? 'bg-[#B45309] text-white border-[#B45309]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Gate 1 (Utama Pit)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGate('GATE_2_PIT')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedGate === 'GATE_2_PIT'
                          ? 'bg-[#B45309] text-white border-[#B45309]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Gate 2 (Hauling)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGate('GATE_3_WORKSHOP')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedGate === 'GATE_3_WORKSHOP'
                          ? 'bg-[#B45309] text-white border-[#B45309]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Gate 3 (Logistik)
                    </button>
                  </div>
                </div>

                {/* 4. Tujuan & Lokasi Kerja */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Tujuan Masuk <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium"
                    >
                      <option value="HAULING">Pit Hauling Alfa</option>
                      <option value="WORKSHOP">Workshop Central</option>
                      <option value="LOGISTICS">ROM Stockpile B</option>
                      <option value="SUPERVISION">Patroli Pengawasan K3</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Lokasi Spesifik Kerja
                    </label>
                    <input
                      type="text"
                      value={specificLocation}
                      onChange={(e) => setSpecificLocation(e.target.value)}
                      placeholder="ROM Hauling Mile 12"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium"
                    />
                  </div>
                </div>

                {/* 5. Odometer Masuk */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Odometer Saat Masuk (KM) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      Odo Terakhir: {selectedVehicle?.last_odometer?.toLocaleString() || '142.850'} km
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={odometerIn}
                      onChange={(e) => setOdometerIn(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="142850"
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                      KM
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    ⓘ Estimasi wajar kedatangan &gt;= odometer sebelumnya (Validasi telemetri GPS normal).
                  </p>
                </div>

                {/* 6. Catatan Muatan & Surat Jalan */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Catatan Muatan &amp; Surat Jalan
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Muatan Batubara 45 Ton, Surat Jalan terlampir No. SJ-88910"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>

                {/* Submit Button (Image 1 Match) */}
                <button
                  type="submit"
                  disabled={isSubmittingCheckIn}
                  className="w-full py-3.5 px-4 bg-[#B45309] hover:bg-[#92400E] text-white font-extrabold rounded-xl text-xs shadow-lg shadow-amber-800/20 transition active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <DoorOpen className="w-4 h-4" />
                  <span>{isSubmittingCheckIn ? 'MEMPROSES KEDATANGAN...' : 'CATAT KENDARAAN MASUK'}</span>
                  <span className="font-mono text-[10px] bg-amber-900/40 px-2 py-0.5 rounded text-amber-200">
                    ENTER
                  </span>
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: ANPR FEED SIMULATOR (5 Cols) (Image 1 Match) */}
            <div className="lg:col-span-4 space-y-4">
              {/* ANPR Live Feed Box */}
              <div className="bg-[#0B132B] rounded-2xl border border-slate-800 p-4 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-2.5">
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Video className="w-3.5 h-3.5" />
                    FEED CAM-01 ANPR GATE 1
                  </span>
                  <span>30 FPS • 1080P</span>
                </div>

                {/* Visual Camera Simulation Box */}
                <div className="h-44 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden p-4">
                  <div className="absolute top-2 left-2 text-[9px] font-mono bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">
                    DETEKSI 99.4%
                  </div>
                  <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-500">
                    OCR SCANNING
                  </div>

                  <Truck className="w-14 h-14 text-slate-700 mb-2" />

                  {/* Scanned Plate Box */}
                  <div className="bg-slate-900 border-2 border-dashed border-amber-500/60 rounded-lg px-4 py-1.5 text-center shadow-lg">
                    <span className="font-mono font-black text-sm text-white tracking-widest">
                      {selectedVehicle?.plate_number || 'KT 8821 MG'}
                    </span>
                  </div>
                </div>

                {/* Unit Specifications Card */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      SPESIFIKASI UNIT TERPILIH
                    </span>
                    <span className="px-2 py-0.5 bg-blue-600 text-white font-mono text-[9px] font-bold rounded">
                      STATUS READY
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono font-black text-sm text-white">
                        {selectedVehicle?.plate_number || 'KT 8821 MG'}
                      </div>
                      <div className="text-[11px] font-bold text-amber-400 mt-0.5">
                        {selectedVehicle?.unit_code || 'DT-205'}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-300">
                      Dump Truck 50T • PT Nusantara Fleet
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                    <div>
                      Berat Tera Terkalibrasi:
                      <div className="text-white font-bold font-mono">24.500 KG</div>
                    </div>
                    <div>
                      Izin Angkut Berlaku:
                      <div className="text-white font-bold font-mono">31 DES 2026</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aksi Lapangan Cepat */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-2">
                <div className="text-[11px] font-mono font-bold text-slate-700 uppercase">
                  AKSI LAPANGAN CEPAT
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => addToast('info', 'Inspeksi K3', 'Cek kelengkapan APAR, safety belt, dan SIMPER telah dicatat.')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cek Fisik Safety</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addToast('info', 'BBM Pit', 'Disposisi pengisian fuel truck telah diteruskan ke pos tangki.')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <Fuel className="w-3.5 h-3.5 text-amber-600" />
                    <span>Isi BBM Pit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= MODE: CHECK-OUT (Daftar Kendaraan di Dalam) ================= */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4 text-blue-600" />
                  <span>Daftar Kendaraan di Dalam Area Tambang ({insideVehicles.length} Unit)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik tombol &quot;Proses Check-Out&quot; pada unit yang ingin dicatat kepulangannya.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Plat Nomor</th>
                    <th className="py-2.5 px-3">Kode Unit</th>
                    <th className="py-2.5 px-3">Nama Sopir</th>
                    <th className="py-2.5 px-3">Waktu Masuk</th>
                    <th className="py-2.5 px-3">Odo Masuk</th>
                    <th className="py-2.5 px-3">Durasi</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {insideVehicles.map((v) => (
                    <tr key={v.log_id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[11px]">
                          {v.vehicle?.plate_number || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">{v.vehicle?.unit_code || v.vehicle_id}</td>
                      <td className="py-3 px-3">{v.driver?.name || v.driver_id}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {v.time_in ? v.time_in.slice(11, 16) + ' WITA' : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">{v.odometer_in.toLocaleString()} km</td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {v.duration_formatted}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => openCheckOutModal(v)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition"
                        >
                          Proses Check-Out
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 4. BOTTOM METRICS STRIP (Image 1 Match) ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">RITASE SHIFT SIANG</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">184</div>
              <div className="text-[10px] text-emerald-600 font-medium">+14 unit lebih tinggi dari Shift Kemarin</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              ⚡
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">DURASI RATA-RATA PIT</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">42.5 <span className="text-xs font-normal text-slate-500">Menit / Trip</span></div>
              <div className="text-[10px] text-slate-500">Target SLA Pertambangan &le; 50 Menit</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              ⏱
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">TINGKAT AKURASI ANPR</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">99.1% <span className="text-xs font-normal text-slate-500">Presisi</span></div>
              <div className="text-[10px] text-slate-500">Zero-fail rata sepanjang hari ini</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              🎯
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">INSPEKSI TERTAHAN</div>
              <div className="text-2xl font-black text-rose-600 font-mono mt-0.5">2 <span className="text-xs font-normal text-slate-500">Unit Ditolak</span></div>
              <div className="text-[10px] text-slate-500">1 Masa SIMPER Expired • 1 Maintenance</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              ⚠
            </div>
          </div>
        </div>

        {/* ================= 5. BOTTOM FOOTER STRIP ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 pt-1 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">SISTEM BARRIER:</span>
            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
              TERHUBUNG
            </span>
          </div>
          <div>MINEGATE — Demo portofolio, data fiktif operasional logistik tambang PT Nusantara</div>
          <div className="text-slate-400">TELEMETRI GATE V2.4.1</div>
        </div>
      </div>

      {/* ================= MODAL CHECK-OUT ================= */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>Check-Out Keluar Gate</span>
              </h3>
              <button
                type="button"
                onClick={() => setCheckoutTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error in Modal */}
            {checkoutModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {checkoutModalError}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Unit Kendaraan:</span>
                <span className="font-bold text-slate-900">
                  {checkoutTarget.vehicle?.unit_code} ({checkoutTarget.vehicle?.plate_number})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pengemudi:</span>
                <span className="font-semibold text-slate-800">{checkoutTarget.driver?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Odometer Saat Masuk:</span>
                <span className="font-mono font-bold text-amber-700">
                  {checkoutTarget.odometer_in.toLocaleString()} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Durasi Berada di Pit:</span>
                <span className="font-mono font-bold text-blue-700">
                  {checkoutTarget.duration_formatted}
                </span>
              </div>
            </div>

            <form onSubmit={handleCheckOut} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Angka Odometer Keluar (km) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={odometerOut}
                  onChange={(e) => setOdometerOut(e.target.value === '' ? '' : Number(e.target.value))}
                  min={checkoutTarget.odometer_in}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Minimal harus sama atau lebih besar dari {checkoutTarget.odometer_in.toLocaleString()} km
                </span>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Catatan Keluar</label>
                <input
                  type="text"
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Kondisi muatan, kelengkapan..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCheckOut}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50"
                >
                  {isSubmittingCheckOut ? 'Menyimpan...' : 'Simpan Keluar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
