import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gateService } from '@/lib/services/gateService';
import { vehicleRepo } from '@/lib/repositories/vehicleRepo';
import { driverRepo } from '@/lib/repositories/driverRepo';
import { logRepo } from '@/lib/repositories/logRepo';
import { AppError } from '@/lib/errors';
import { Vehicle, Driver, GateLog } from '@/types';

// Mock Sheets Lock agar langsung mengeksekusi fungsi callback
vi.mock('@/lib/sheets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/sheets')>();
  return {
    ...actual,
    withSheetsLock: vi.fn(async (cb) => cb()),
  };
});

describe('gateService - Aturan Bisnis Check-in & Check-out Kendaraan Tambang', () => {
  const mockActiveVehicle: Vehicle = {
    vehicle_id: 'VH-001',
    unit_code: 'DT-101',
    plate_number: 'EA 8101 BA',
    type: 'DUMP_TRUCK',
    brand_model: 'Scania R580',
    owner_company: 'PT Nusa Hauling Mandiri',
    status: 'ACTIVE',
    last_odometer: 40000,
    created_at: '2026-11-20T08:00:00+08:00',
  };

  const mockActiveDriver: Driver = {
    driver_id: 'DR-001',
    name: 'Bambang Sudiro',
    license_type: 'SIM B2 UMUM',
    company: 'PT Nusa Hauling Mandiri',
    phone: '081234567801',
    status: 'ACTIVE',
    created_at: '2026-11-20T08:00:00+08:00',
  };

  const mockInsideLog: GateLog = {
    log_id: 'LOG-20261124-001',
    vehicle_id: 'VH-001',
    driver_id: 'DR-001',
    gate: 'GATE_1_MAIN',
    purpose: 'HAULING',
    destination: 'Pit Front A',
    time_in: '2026-11-24T06:00:00+08:00',
    odometer_in: 40000,
    status: 'INSIDE',
    officer_id: 'USR-002',
    notes: 'Hauling batubara',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // ATURAN 1: Kendaraan dengan log berstatus INSIDE tidak boleh check-in lagi (409)
  // =========================================================================
  it('Aturan 1: Menolak check-in jika kendaraan masih berstatus INSIDE (409 Conflict)', async () => {
    vi.spyOn(vehicleRepo, 'getById').mockResolvedValue(mockActiveVehicle);
    vi.spyOn(driverRepo, 'getById').mockResolvedValue(mockActiveDriver);
    vi.spyOn(logRepo, 'getActiveByVehicleId').mockResolvedValue(mockInsideLog);

    await expect(
      gateService.checkIn({
        vehicle_id: 'VH-001',
        driver_id: 'DR-001',
        gate: 'GATE_1_MAIN',
        purpose: 'HAULING',
        destination: 'ROM Stockpile',
        odometer_in: 40100,
        officer_id: 'USR-002',
      })
    ).rejects.toThrowError(AppError);

    try {
      await gateService.checkIn({
        vehicle_id: 'VH-001',
        driver_id: 'DR-001',
        gate: 'GATE_1_MAIN',
        purpose: 'HAULING',
        destination: 'ROM Stockpile',
        odometer_in: 40100,
        officer_id: 'USR-002',
      });
    } catch (err) {
      const error = err as AppError;
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toContain('berstatus INSIDE');
    }
  });

  // =========================================================================
  // ATURAN 2: Check-out hanya untuk kendaraan yang berstatus INSIDE (409 jika tidak ada)
  // =========================================================================
  it('Aturan 2: Menolak check-out jika kendaraan tidak berstatus INSIDE (409 Conflict)', async () => {
    vi.spyOn(vehicleRepo, 'getById').mockResolvedValue(mockActiveVehicle);
    vi.spyOn(logRepo, 'getActiveByVehicleId').mockResolvedValue(null);

    await expect(
      gateService.checkOut({
        vehicle_id: 'VH-001',
        odometer_out: 40200,
        officer_id: 'USR-002',
      })
    ).rejects.toThrowError(AppError);

    try {
      await gateService.checkOut({
        vehicle_id: 'VH-001',
        odometer_out: 40200,
        officer_id: 'USR-002',
      });
    } catch (err) {
      const error = err as AppError;
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toContain('tidak memiliki riwayat aktif berstatus INSIDE');
    }
  });

  // =========================================================================
  // ATURAN 3: Kendaraan berstatus MAINTENANCE atau INACTIVE ditolak saat check-in (422)
  // =========================================================================
  it('Aturan 3: Menolak check-in jika kendaraan berstatus MAINTENANCE (422 Unprocessable)', async () => {
    vi.spyOn(vehicleRepo, 'getById').mockResolvedValue({
      ...mockActiveVehicle,
      status: 'MAINTENANCE',
    });

    try {
      await gateService.checkIn({
        vehicle_id: 'VH-001',
        driver_id: 'DR-001',
        gate: 'GATE_1_MAIN',
        purpose: 'HAULING',
        destination: 'Pit Front A',
        odometer_in: 40050,
        officer_id: 'USR-002',
      });
    } catch (err) {
      const error = err as AppError;
      expect(error.statusCode).toBe(422);
      expect(error.message).toContain('MAINTENANCE');
    }
  });

  it('Aturan 3: Menolak check-in jika kendaraan berstatus INACTIVE (422 Unprocessable)', async () => {
    vi.spyOn(vehicleRepo, 'getById').mockResolvedValue({
      ...mockActiveVehicle,
      status: 'INACTIVE',
    });

    try {
      await gateService.checkIn({
        vehicle_id: 'VH-001',
        driver_id: 'DR-001',
        gate: 'GATE_1_MAIN',
        purpose: 'HAULING',
        destination: 'Pit Front A',
        odometer_in: 40050,
        officer_id: 'USR-002',
      });
    } catch (err) {
      const error = err as AppError;
      expect(error.statusCode).toBe(422);
      expect(error.message).toContain('INACTIVE');
    }
  });

  // =========================================================================
  // ATURAN 4: Sopir INACTIVE ditolak (422). Satu sopir tidak boleh aktif di dua kendaraan INSIDE sekaligus (409)
  // =========================================================================
  it('Aturan 4: Menolak check-in jika pengemudi berstatus INACTIVE (422 Unprocessable)', async () => {
    vi.spyOn(vehicleRepo, 'getById').mockResolvedValue(mockActiveVehicle);
    vi.spyOn(driverRepo, 'getById').mockResolvedValue({
      ...mockActiveDriver,
      status: 'INACTIVE',
    });

    try {
      await gateService.checkIn({
        vehicle_id: 'VH-001',
        driver_id: 'DR-001',
        gate: 'GATE_1_MAIN',
        purpose: 'HAULING',
        destination: 'Pit Front A',
        odometer_in: 40050,
        officer_id: 'USR-002',
      });
    } catch (err) {
      const error = err as AppError;
      expect(error.statusCode).toBe(422);
      expect(error.message).toContain('INACTIVE');
    }
  });

  it('Aturan 4: Menolak check-in jika pengemudi sudah aktif di kendaraan lain berstatus INSIDE (409 Conflict)', async () => {
    vi.spyOn(vehicleRepo, 'getById').mockResolvedValue(mockActiveVehicle);
    vi.spyOn(driverRepo, 'getById').mockResolvedValue(mockActiveDriver);
    vi.spyOn(logRepo, 'getActiveByVehicleId').mockResolvedValue(null);
    vi.spyOn(logRepo, 'getActiveByDriverId').mockResolvedValue({
      ...mockInsideLog,
      vehicle_id: 'VH-002',
      log_id: 'LOG-20261124-002',
    });

    try {
      await gateService.checkIn({
        vehicle_id: 'VH-001',
        driver_id: 'DR-001',
        gate: 'GATE_1_MAIN',
        purpose: 'HAULING',
        destination: 'Pit Front A',
        odometer_in: 40050,
        officer_id: 'USR-002',
      });
    } catch (err) {
      const error = err as AppError;
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toContain('masih aktif bertugas di dalam kendaraan lain');
    }
  });

  // =========================================================================
  // ATURAN 5: odometer_in >= last_odometer dan odometer_out >= odometer_in
  // =========================================================================
  it('Aturan 5: Menolak check-in jika odometer_in lebih kecil dari last_odometer (422 Unprocessable)', async () => {
    vi.spyOn(vehicleRepo, 'getById').mockResolvedValue({
      ...mockActiveVehicle,
      last_odometer: 40000,
    });
    vi.spyOn(driverRepo, 'getById').mockResolvedValue(mockActiveDriver);
    vi.spyOn(logRepo, 'getActiveByVehicleId').mockResolvedValue(null);
    vi.spyOn(logRepo, 'getActiveByDriverId').mockResolvedValue(null);

    try {
      await gateService.checkIn({
        vehicle_id: 'VH-001',
        driver_id: 'DR-001',
        gate: 'GATE_1_MAIN',
        purpose: 'HAULING',
        destination: 'Pit Front A',
        odometer_in: 39999, // Lebih kecil dari 40000
        officer_id: 'USR-002',
      });
    } catch (err) {
      const error = err as AppError;
      expect(error.statusCode).toBe(422);
      expect(error.message).toContain('tidak boleh lebih kecil dari odometer terakhir');
    }
  });

  it('Aturan 5: Menolak check-out jika odometer_out lebih kecil dari odometer_in (422 Unprocessable)', async () => {
    vi.spyOn(vehicleRepo, 'getById').mockResolvedValue(mockActiveVehicle);
    vi.spyOn(logRepo, 'getActiveByVehicleId').mockResolvedValue({
      ...mockInsideLog,
      odometer_in: 40050,
    });

    try {
      await gateService.checkOut({
        vehicle_id: 'VH-001',
        odometer_out: 40020, // Lebih kecil dari 40050
        officer_id: 'USR-002',
      });
    } catch (err) {
      const error = err as AppError;
      expect(error.statusCode).toBe(422);
      expect(error.message).toContain('tidak boleh lebih kecil dari odometer saat masuk');
    }
  });

  // =========================================================================
  // ATURAN 6: Saat check-out sukses: isi time_out, odometer_out, ubah status jadi OUT, dan perbarui last_odometer di tab vehicles
  // =========================================================================
  it('Aturan 6: Check-out sukses memperbarui status OUT, mengisi time_out, odometer_out, dan update last_odometer', async () => {
    vi.spyOn(vehicleRepo, 'getById').mockResolvedValue(mockActiveVehicle);
    vi.spyOn(logRepo, 'getActiveByVehicleId').mockResolvedValue({
      ...mockInsideLog,
      odometer_in: 40000,
    });

    const updateLogSpy = vi.spyOn(logRepo, 'update').mockImplementation(async (id, patch) => {
      return {
        ...mockInsideLog,
        ...patch,
        log_id: id,
      } as GateLog;
    });

    const updateOdoSpy = vi.spyOn(vehicleRepo, 'updateOdometer').mockResolvedValue(true);

    const result = await gateService.checkOut({
      vehicle_id: 'VH-001',
      odometer_out: 40150,
      officer_id: 'USR-002',
      notes: 'Muatan aman',
    });

    expect(result.status).toBe('OUT');
    expect(result.odometer_out).toBe(40150);
    expect(result.time_out).toBeDefined();
    expect(updateLogSpy).toHaveBeenCalledWith(
      'LOG-20261124-001',
      expect.objectContaining({
        status: 'OUT',
        odometer_out: 40150,
      })
    );
    expect(updateOdoSpy).toHaveBeenCalledWith('VH-001', 40150);
  });

  // =========================================================================
  // ATURAN 7: Overstay = status INSIDE dan durasi di dalam lebih dari OVERSTAY_HOURS (12 jam)
  // =========================================================================
  it('Aturan 7: Menghitung status Overstay secara dinamis (> 12 jam)', async () => {
    const now = new Date();
    // 14 jam yang lalu (Overstay)
    const timeInOverstay = new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString();
    // 2 jam yang lalu (Normal)
    const timeInNormal = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    const insideLogs: GateLog[] = [
      {
        ...mockInsideLog,
        log_id: 'LOG-OVERSTAY',
        vehicle_id: 'VH-001',
        time_in: timeInOverstay,
      },
      {
        ...mockInsideLog,
        log_id: 'LOG-NORMAL',
        vehicle_id: 'VH-002',
        time_in: timeInNormal,
      },
    ];

    vi.spyOn(logRepo, 'getAllActiveInside').mockResolvedValue(insideLogs);
    vi.spyOn(vehicleRepo, 'getAll').mockResolvedValue([
      mockActiveVehicle,
      { ...mockActiveVehicle, vehicle_id: 'VH-002', unit_code: 'DT-102' },
    ]);
    vi.spyOn(driverRepo, 'getAll').mockResolvedValue([mockActiveDriver]);

    const insideList = await gateService.getInsideVehicles(12);

    expect(insideList).toHaveLength(2);

    const overstayItem = insideList.find((i) => i.log_id === 'LOG-OVERSTAY');
    const normalItem = insideList.find((i) => i.log_id === 'LOG-NORMAL');

    expect(overstayItem?.is_overstay).toBe(true);
    expect(overstayItem?.duration_minutes).toBeGreaterThan(12 * 60);

    expect(normalItem?.is_overstay).toBe(false);
    expect(normalItem?.duration_minutes).toBeLessThan(12 * 60);
  });
});
