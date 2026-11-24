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
  UserCheck,
} from 'lucide-react';
import { SafeUser } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update live clock WITA (UTC+8)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format WITA: Jam:Menit:Detik
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans">
      {/* Sidebar Command Bar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between fixed inset-y-0 left-0 z-30">
        <div>
          {/* Logo & Brand */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold">
                <Truck className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-wider text-white text-base leading-none">
                  MINEGATE
                </span>
                <span className="text-[10px] text-slate-400 tracking-tight font-medium mt-0.5">
                  Mining Gate OS
                </span>
              </div>
            </div>
          </div>

          {/* Sektor Badge */}
          <div className="px-4 py-3">
            <div className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono text-[11px] font-semibold tracking-wide text-slate-400">
                HUB SEKTOR PIT UTARA
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-1 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
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
                          ? 'bg-amber-700 text-amber-100'
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
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-medium text-[11px]">Koneksi Data:</span>
              <span className="font-mono font-bold text-emerald-400 text-[10px]">SYNC AKTIF</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Google Sheets Gateway
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 px-6 bg-slate-950/90 backdrop-blur border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
          {/* Left: Clock & Gate Post */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-200 font-semibold">{currentTime || 'WITA'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gate 1, 2 &amp; 3 Terpantau</span>
            </div>
          </div>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-white leading-none">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono uppercase font-semibold text-amber-400 mt-0.5">
                    {currentUser.role}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {currentUser.name.charAt(0)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <UserCheck className="w-4 h-4 text-slate-400" />
                <span>Memuat sesi...</span>
              </div>
            )}

            <div className="h-5 w-px bg-slate-800" />

            <button
              onClick={handleLogout}
              title="Keluar (Logout)"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-slate-900">{children}</main>
      </div>
    </div>
  );
}
