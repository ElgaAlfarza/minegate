import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  requireRole,
} from '@/lib/auth';
import { plateNumberSchema, checkInSchema, checkOutSchema } from '@/lib/validations';
import { AppError } from '@/lib/errors';

describe('Auth & Security', () => {
  it('Dapat melakukan hash dan verifikasi password bcrypt', async () => {
    const raw = 'Minegate#2026';
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    const valid = await comparePassword(raw, hash);
    const invalid = await comparePassword('WrongPassword', hash);

    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });

  it('Dapat membuat dan memverifikasi token JWT berdurasi 8 jam', async () => {
    const payload = {
      userId: 'USR-001',
      username: 'admin',
      role: 'ADMIN' as const,
      name: 'Administrator Gate',
    };

    const token = await signToken(payload);
    expect(typeof token).toBe('string');

    const decoded = await verifyToken(token);
    expect(decoded).not.null;
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.role).toBe(payload.role);
  });

  it('Role Guard: Meloloskan role yang diizinkan dan menolak role tanpa izin', () => {
    const adminUser = {
      userId: 'USR-001',
      username: 'admin',
      role: 'ADMIN' as const,
      name: 'Admin',
    };
    const officerUser = {
      userId: 'USR-002',
      username: 'officer1',
      role: 'OFFICER' as const,
      name: 'Officer',
    };

    // Admin akses fitur ADMIN
    expect(() => requireRole(['ADMIN'], adminUser)).not.toThrow();

    // Officer akses fitur khusus ADMIN
    expect(() => requireRole(['ADMIN'], officerUser)).toThrowError(AppError);

    // Unauthenticated
    expect(() => requireRole(['ADMIN', 'OFFICER'], null)).toThrowError(AppError);
  });
});

describe('Validasi Input & Normalisasi Plat Nomor', () => {
  it('Normalisasi nomor plat: huruf besar dan tanpa spasi ganda', () => {
    const raw = '  ea   8101   ba  ';
    const normalized = plateNumberSchema.parse(raw);
    expect(normalized).toBe('EA 8101 BA');
  });

  it('Validasi skema Check-in', () => {
    const validData = {
      vehicle_id: 'VH-001',
      driver_id: 'DR-001',
      gate: 'GATE_1_MAIN',
      purpose: 'HAULING',
      destination: 'Pit Front A',
      odometer_in: 40000,
    };
    expect(() => checkInSchema.parse(validData)).not.toThrow();

    // Odometer negatif ditolak
    const invalidData = {
      ...validData,
      odometer_in: -10,
    };
    expect(() => checkInSchema.parse(invalidData)).toThrow();
  });

  it('Validasi skema Check-out', () => {
    const validData = {
      vehicle_id: 'VH-001',
      odometer_out: 40150,
    };
    expect(() => checkOutSchema.parse(validData)).not.toThrow();

    // Odometer negatif ditolak
    const invalidData = {
      vehicle_id: 'VH-001',
      odometer_out: -5,
    };
    expect(() => checkOutSchema.parse(invalidData)).toThrow();
  });
});
