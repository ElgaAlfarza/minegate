import Link from "next/link";
import { AlertTriangle, ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid & hazard ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 text-center backdrop-blur-md">
        {/* Amber Hazard Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-6 shadow-inner">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-500 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Area Terlarang / Di Luar Jangkauan</span>
        </div>

        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
          404 <span className="text-slate-500 font-light">|</span> Sektor Tidak Ditemukan
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Koordinat halaman atau rute pos pengawasan yang Anda tuju tidak terdaftar dalam peta operasional MINEGATE PIT Utara.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/gate"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors shadow-lg shadow-amber-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Gate
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors border border-slate-700"
          >
            Halaman Login
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
          MINEGATE SECURITY DISPATCH • SYSTEM PROTOCOL 404
        </div>
      </div>
    </main>
  );
}
