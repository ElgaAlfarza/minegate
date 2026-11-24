'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Radio,
  CheckCircle2,
  AlertCircle,
  Video,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const userToSubmit = customUser || username;
    const passToSubmit = customPass || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userToSubmit, password: passToSubmit }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Gagal melakukan login.');
      }

      const role = json.data?.user?.role;
      const target = role === 'OFFICER' ? '/gate' : '/dashboard';
      router.push(target);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoClick = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setErrorMessage('');
    handleLogin(undefined, demoUser, demoPass);
  };

  return (
    <main className="min-h-screen bg-[#070B19] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-800/20 relative z-10">
        {/* ================= LEFT SIDE: Industrial Branding (Dark) ================= */}
        <div className="lg:w-[45%] bg-[#0B132B] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <Truck className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-wider text-white leading-none">
                  MINEGATE
                </h1>
                <p className="text-[10px] text-amber-400 font-mono tracking-widest uppercase mt-0.5 font-bold">
                  TELEMETRY &amp; LOGISTICS OS
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>POS GERBANG UTAMA #01 — KONSESI TIMUR</span>
            </div>

            {/* Industrial ANPR Camera Box Preview */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 relative overflow-hidden shadow-inner space-y-3 mt-4">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Video className="w-3.5 h-3.5" />
                  CAM-01 • ANPR ACTIVE
                </span>
                <span>FPS: 60 | LATENCY: 12ms</span>
              </div>

              {/* Haul Truck Graphical Reticle */}
              <div className="h-32 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-x-4 top-4 border-b border-dashed border-amber-500/30" />
                <div className="absolute inset-x-4 bottom-4 border-t border-dashed border-amber-500/30" />
                <Truck className="w-14 h-14 text-amber-500/60 animate-pulse" />
                <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 mt-1">
                  DETEKSI ANPR: OCR SCANNING
                </span>
              </div>
            </div>

            {/* Headline Text */}
            <div className="space-y-1.5 pt-2">
              <h2 className="text-lg font-bold text-slate-100 leading-snug">
                Portal Kontrol Gerbang &amp; Manajemen Logistik Armada Tambang Terpadu
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Otorisasi instan pengemudi, inspeksi muatan tonase batubara &amp; mineral, serta pelacakan real-time kepatuhan K3 haul road.
              </p>
            </div>
          </div>

          {/* Bottom Security Credentials Strip */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">SLA GERBANG</div>
                <div className="text-sm font-extrabold text-amber-400 font-mono">99.8%</div>
                <div className="text-[9px] text-slate-400">Automated Pass</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">STANDAR K3</div>
                <div className="text-sm font-extrabold text-white font-mono">SMKP II.A</div>
                <div className="text-[9px] text-slate-400">Audit Ditjen Minerba</div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>🔒 256-Bit Hardware Encrypted</span>
              <span>Site Code: ID-KTIM-09</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: Login Form (Clean White) ================= */}
        <div className="lg:w-[55%] bg-white p-8 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Top Node Status Pill */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[10px] font-bold tracking-wide uppercase border border-blue-200">
                  NODE SINKRON
                </span>
                <span className="text-xs text-slate-500 font-medium">Shift Pagi • 06:00 - 18:00 WITA</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>

            {/* Title Section */}
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Masuk ke Sistem Operasional
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gunakan kredensial ID Operator atau Supervisor Anda untuk membuka akses gate barrier.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold block">Autentikasi Gagal:</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={(e) => handleLogin(e)} className="space-y-4 text-left">
              {/* Username Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  ID Petugas / Email Operasional <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                  <input
                    type="text"
                    placeholder="CONTOH: OP-204 atau SPV-012"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi Akses <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-amber-700 font-semibold hover:underline cursor-pointer">
                    Lupa Kunci?
                  </span>
                </div>
                <div className="relative">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4 text-slate-600" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi terdaftar"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-11 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Session & IT Help */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Ingat sesi di perangkat gerbang ini (12 jam)</span>
                </label>
                <span className="text-slate-500 hover:text-slate-800 text-[11px] font-medium cursor-pointer">
                  Bantuan Petugas IT
                </span>
              </div>

              {/* Big Amber Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#B45309] hover:bg-[#92400E] text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-700/20 transition active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                <span>{isLoading ? 'Memverifikasi Kredensial...' : 'Masuk ke Portal Operasional'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Credentials Strip (Image 3 Match) */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700 uppercase tracking-wide">
                  AKUN DEMO UJI LAPANGAN (KLIK UNTUK ISI)
                </span>
                <span className="font-mono text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  PRE-AUTH ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* SPV Card */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoClick('supervisor1', 'Minegate#2026')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 text-left transition group shadow-sm"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] font-bold text-slate-900 group-hover:text-amber-800">
                    <span>SPV-012</span>
                    <span className="text-amber-600 font-sans text-xs">⚡</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800 mt-0.5">Agus Setiawan</div>
                  <div className="text-[10px] text-slate-500">Supervisor (Analytics)</div>
                </button>

                {/* Operator Card */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoClick('officer1', 'Minegate#2026')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 text-left transition group shadow-sm"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] font-bold text-slate-900 group-hover:text-amber-800">
                    <span>OP-204</span>
                    <span className="text-amber-600 font-sans text-xs">⚡</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800 mt-0.5">Budi Santoso</div>
                  <div className="text-[10px] text-slate-500">Petugas (Gate 1 &amp; ANPR)</div>
                </button>

                {/* Admin Card */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoClick('admin', 'Minegate#2026')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 text-left transition group shadow-sm"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] font-bold text-slate-900 group-hover:text-amber-800">
                    <span>ADM-001</span>
                    <span className="text-amber-600 font-sans text-xs">⚡</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800 mt-0.5">Rian Pratama</div>
                  <div className="text-[10px] text-slate-500">Admin (Config &amp; User)</div>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-mono gap-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              v2.4.1-LTS • TanStack Query Connected
            </span>
            <span>PT Freeport &amp; Borneo Mining Logistics Demo</span>
          </div>
        </div>
      </div>
    </main>
  );
}
