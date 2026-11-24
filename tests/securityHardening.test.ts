import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginHandler, _resetLoginRateLimit } from '@/app/api/auth/login/route';
import { GET as usersGetHandler } from '@/app/api/users/route';
import { userRepo } from '@/lib/repositories/userRepo';
import * as authModule from '@/lib/auth';

vi.mock('@/lib/repositories/userRepo', () => ({
  userRepo: {
    getByUsername: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof authModule>();
  return {
    ...actual,
    getSession: vi.fn(),
  };
});

describe('Security Hardening Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetLoginRateLimit();
  });

  describe('Login Route Hardening (/api/auth/login)', () => {
    it('Menolak password bypass hardcoded "minegate123" dengan status 401', async () => {
      const realPasswordHash = await authModule.hashPassword('SuperSecret#2026');
      vi.mocked(userRepo.getByUsername).mockResolvedValueOnce({
        user_id: 'U-001',
        name: 'Admin User',
        username: 'admin',
        password_hash: realPasswordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      });

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'minegate123',
        }),
      });

      const res = await loginHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
      expect(json.error.message).toContain('salah');
    });

    it('Menolak password yang salah dengan status 401', async () => {
      const realPasswordHash = await authModule.hashPassword('SuperSecret#2026');
      vi.mocked(userRepo.getByUsername).mockResolvedValueOnce({
        user_id: 'U-001',
        name: 'Admin User',
        username: 'admin',
        password_hash: realPasswordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      });

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.101',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'WrongPassword123!',
        }),
      });

      const res = await loginHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('Rate limit bekerja: memblokir dengan 429 setelah 5 kali gagal', async () => {
      const realPasswordHash = await authModule.hashPassword('CorrectPassword#2026');
      // Mock user selalu ditemukan agar terhitung sebagai invalid password
      vi.mocked(userRepo.getByUsername).mockResolvedValue({
        user_id: 'U-001',
        name: 'Admin User',
        username: 'officer1',
        password_hash: realPasswordHash,
        role: 'OFFICER',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      });

      const clientIp = '10.0.0.50';

      // Lakukan 5 kali percobaan gagal
      for (let i = 1; i <= 5; i++) {
        const req = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': clientIp,
          },
          body: JSON.stringify({
            username: 'officer1',
            password: `WrongAttempt_${i}`,
          }),
        });

        const res = await loginHandler(req);
        expect(res.status).toBe(401);
      }

      // Percobaan ke-6 harus diblokir oleh rate limiter (HTTP 429)
      const blockedReq = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': clientIp,
        },
        body: JSON.stringify({
          username: 'officer1',
          password: 'CorrectPassword#2026', // Walaupun password benar, tetap diblokir
        }),
      });

      const blockedRes = await loginHandler(blockedReq);
      const blockedJson = await blockedRes.json();

      expect(blockedRes.status).toBe(429);
      expect(blockedJson.success).toBe(false);
      expect(blockedJson.error.code).toBe('TOO_MANY_REQUESTS');
      expect(blockedJson.error.message).toContain('diblokir sementara');
    });
  });

  describe('Route Authorization Hardening (/api/users)', () => {
    it('Menolak role OFFICER untuk mengakses /api/users dengan status 403', async () => {
      vi.mocked(authModule.getSession).mockResolvedValueOnce({
        userId: 'U-002',
        username: 'officer1',
        role: 'OFFICER',
        name: 'Petugas Lapangan',
      });

      const res = await usersGetHandler();
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('Menolak role SUPERVISOR untuk mengakses /api/users dengan status 403', async () => {
      vi.mocked(authModule.getSession).mockResolvedValueOnce({
        userId: 'U-003',
        username: 'supervisor1',
        role: 'SUPERVISOR',
        name: 'Supervisor Tambang',
      });

      const res = await usersGetHandler();
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('Mengizinkan role ADMIN untuk mengakses /api/users dengan status 200', async () => {
      vi.mocked(authModule.getSession).mockResolvedValueOnce({
        userId: 'U-001',
        username: 'admin',
        role: 'ADMIN',
        name: 'Administrator',
      });

      vi.mocked(userRepo.getAll).mockResolvedValueOnce([
        {
          user_id: 'U-001',
          name: 'Administrator',
          username: 'admin',
          password_hash: 'secret',
          role: 'ADMIN',
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        },
      ]);

      const res = await usersGetHandler();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data[0].username).toBe('admin');
      // Password hash tidak boleh bocor di respons
      expect(json.data[0].password_hash).toBeUndefined();
    });
  });
});
