'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  DoorOpen,
  Truck,
  Users,
  ClipboardList,
  ShieldAlert,
  LogOut,
  Clock,
  Radio,
  Bell,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { SafeUser } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('14:28:05 WITA');
  const [activeShift, setActiveShift] = useState<'SHIFT_1' | 'SHIFT_2'>('SHIFT_1');

  // Update live clock WITA (UTC+8)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      setCurrentTime(`${timeStr} WITA`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch current user from /api/auth/me
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          setCurrentUser(json.data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPERVISOR', 'ADMIN'],
    },
    {
      title: 'Gate Operasional',
      href: '/gate',
      icon: DoorOpen,
      roles: ['OFFICER', 'SUPERVISOR', 'ADMIN'],
      badge: 'LIVE',
    },
    {
      title: 'Kendaraan Tambang',
      href: '/vehicles',
      icon: Truck,
      roles: ['OFFICER', 'SUPERVISOR', 'ADMIN'],
    },
    {
      title: 'Data Sopir',
      href: '/drivers',
      icon: Users,
      roles: ['OFFICER', 'SUPERVISOR', 'ADMIN'],
    },
    {
      title: 'Riwayat Log',
      href: '/logs',
      icon: ClipboardList,
      roles: ['OFFICER', 'SUPERVISOR', 'ADMIN'],
    },
    {
      title: 'Pengguna Sistem',
      href: '/users',
      icon: ShieldAlert,
      roles: ['ADMIN'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!currentUser) return true;
    return item.roles.includes(currentUser.role);
  });

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex font-sans">
      {/* Sidebar Command Bar (Dark Industrial Navy) */}
      <aside className="w-64 bg-[#0B132B] border-r border-slate-800 flex flex-col justify-between fixed inset-y-0 left-0 z-30 shadow-xl">
        <div>
          {/* Logo & Brand Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 bg-[#0B132B]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold shadow-sm">
                <Truck className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-wider text-white text-base leading-none flex items-center gap-1">
                  MINEGATE
                  <span className="text-[10px] text-amber-400 font-mono">«</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
                  Mining Logistics OS
                </span>
              </div>
            </div>
          </div>

          {/* Sektor Hub Badge */}
          <div className="px-4 py-3">
            <div className="px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono text-[11px] font-bold tracking-wider text-slate-300">
                HUB SEKTOR UTARA
              </span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-1 space-y-1.5">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-amber-700 text-white'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#080E21]">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="font-mono text-slate-400 uppercase font-semibold">SISTEM BARRIER</span>
            <span className="text-emerald-400 font-mono font-bold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              TERHUBUNG
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            MINEGATE • Google Sheets Cloud Gateway
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Navbar (Clean White Enterprise) */}
        <header className="h-16 px-6 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          {/* Left: Clock, Gate Status & Shifts */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-slate-800 font-bold">{currentTime}</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Gate Utama Aktif</span>
            </div>

            {/* Shift Pill Buttons */}
            <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveShift('SHIFT_1')}
                className={`px-3 py-1 rounded-md transition-all text-xs ${
                  activeShift === 'SHIFT_1'
                    ? 'bg-white text-slate-800 font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Shift 1 (Siang)
              </button>
              <button
                type="button"
                onClick={() => setActiveShift('SHIFT_2')}
                className={`px-3 py-1 rounded-md transition-all text-xs ${
                  activeShift === 'SHIFT_2'
                    ? 'bg-white text-slate-800 font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Shift 2
              </button>
            </div>
          </div>

          {/* Right: Actions, Notifications, User Profile & Logout */}
          <div className="flex items-center gap-3.5">
            {/* Quick Icons */}
            <button
              type="button"
              title="Toggle Theme"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <Moon className="w-4 h-4" />
            </button>

            <button
              type="button"
              title="Notifikasi"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
            </button>

            <div className="h-6 w-px bg-slate-200" />

            {/* User Profile */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-none">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-amber-700 font-semibold mt-0.5">
                    {currentUser.role === 'SUPERVISOR'
                      ? 'SPV Keamanan'
                      : currentUser.role === 'ADMIN'
                      ? 'Admin Dispatcher'
                      : 'Petugas Gate'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Memuat...</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Keluar (Logout)"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-[#F4F6F9]">{children}</main>
      </div>
    </div>
  );
}
