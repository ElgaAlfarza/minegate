'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  DoorOpen,
  Truck,
  Users,
  ClipboardList,
  ShieldCheck,
  LogOut,
  AlertTriangle,
  HardHat,
} from 'lucide-react';

interface SidebarProps {
  currentUser?: {
    name: string;
    role: string;
    gate?: string;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser }) => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: 'Dashboard Operasional',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      label: 'Pos Gerbang (Gate)',
      href: '/gate',
      icon: DoorOpen,
      highlight: true,
    },
    {
      label: 'Data Kendaraan',
      href: '/vehicles',
      icon: Truck,
    },
    {
      label: 'Data Sopir',
      href: '/drivers',
      icon: Users,
    },
    {
      label: 'Log Riwayat',
      href: '/logs',
      icon: ClipboardList,
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    document.cookie = 'minegate_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30 text-slate-950 font-black text-xl tracking-tighter">
            MG
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wider text-white uppercase flex items-center gap-1.5">
              MINEGATE
              <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Monitoring Pos Gerbang</p>
          </div>
        </div>

        {/* Pos Gate Status Tag */}
        <div className="mt-4 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>POS GATE 1 (MAIN)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">SHIFT 1</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Menu Operasional
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400 group-hover:text-amber-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-slate-950/30 text-slate-950'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Kepatuhan K3 & Standar
        </div>

        <div className="mx-2 p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <HardHat className="w-4 h-4" />
            <span>K3 Tambang Wajib</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Semua kendaraan wajib verifikasi SIMPER aktif, buggy whip, rotary lamp, dan sabuk pengaman.
          </p>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser?.name || 'Petugas Gate'}
              </div>
              <div className="text-[10px] text-amber-400 font-medium">
                {currentUser?.role || 'SUPERVISOR'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar Akun"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
