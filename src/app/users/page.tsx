'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import { ShieldCheck, UserCheck, RefreshCw, KeyRound } from 'lucide-react';
import { SafeUser } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsers(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              <span>Manajemen Akun Pengguna &amp; Hak Akses</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Daftar akun berwenang sistem MINEGATE dengan pembagian peran (Admin, Supervisor, Officer Gate).
            </p>
          </div>

          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Demo Credentials Alert Card */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Akun Demo Resmi Sistem</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Password default seluruh akun demo adalah: <span className="font-mono font-bold text-amber-400">Minegate#2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID Pengguna</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4 text-center">Hak Akses Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Terdaftar Sejak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Memuat daftar pengguna...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada data pengguna.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-400">
                        {u.user_id}
                      </td>
                      <td className="py-3 px-4 font-bold text-white text-xs">
                        {u.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-300 font-semibold">
                        @{u.username}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : u.role === 'SUPERVISOR'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {u.created_at ? u.created_at.slice(0, 10) : '-'}
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
