import { ActiveInsideVehicle, GateLog, GateStation, LogPurpose } from '@/types';
import { vehicleRepo } from '../repositories/vehicleRepo';
import { driverRepo } from '../repositories/driverRepo';
import { logRepo } from '../repositories/logRepo';
import { withSheetsLock } from '../sheets';
import { AppError } from '../errors';
import {
  getCurrentTimestampWITA,
  getDiffMinutes,
  formatDurationMinutes,
  isOverstay,
  DEFAULT_OVERSTAY_HOURS,
} from '../time';

export interface CheckInInput {
  vehicle_id: string;
  driver_id: string;
  gate: GateStation;
  purpose: LogPurpose;
  destination: string;
  odometer_in: number;
  officer_id: string;
  notes?: string;
  time_in?: string;
}

export interface CheckOutInput {
  vehicle_id: string;
  odometer_out: number;
  officer_id: string;
  notes?: string;
  time_out?: string;
}

export const gateService = {
  /**
   * Aturan Bisnis Check-in Kendaraan
   */
  async checkIn(input: CheckInInput): Promise<GateLog> {
    return withSheetsLock(async () => {
      // 1. Validasi kendaraan (menggunakan cache in-memory 0 ms)
      const vehicle = await vehicleRepo.getById(input.vehicle_id);
      if (!vehicle) {
        throw AppError.notFound(`Kendaraan dengan ID ${input.vehicle_id} tidak ditemukan.`);
      }

      // Aturan 3: Kendaraan berstatus MAINTENANCE atau INACTIVE ditolak saat check-in (422)
      if (vehicle.status === 'MAINTENANCE') {
        throw AppError.unprocessable(
          `Kendaraan ${vehicle.unit_code} (${vehicle.plate_number}) sedang dalam status MAINTENANCE dan dilarang beroperasi.`
        );
      }
      if (vehicle.status === 'INACTIVE') {
        throw AppError.unprocessable(
          `Kendaraan ${vehicle.unit_code} (${vehicle.plate_number}) berstatus INACTIVE dan dilarang masuk.`
        );
      }

      // 2. Validasi pengemudi (menggunakan cache in-memory 0 ms)
      const driver = await driverRepo.getById(input.driver_id);
      if (!driver) {
        throw AppError.notFound(`Pengemudi dengan ID ${input.driver_id} tidak ditemukan.`);
      }

      // Aturan 4 (bagian 1): Sopir INACTIVE ditolak (422)
      if (driver.status === 'INACTIVE') {
        throw AppError.unprocessable(
          `Pengemudi ${driver.name} berstatus INACTIVE dan tidak diizinkan masuk gate.`
        );
      }

      // Aturan 1: Kendaraan dengan log berstatus INSIDE tidak boleh check-in lagi (409)
      const existingVehicleLog = await logRepo.getActiveByVehicleId(input.vehicle_id);
      if (existingVehicleLog) {
        throw AppError.conflict(
          `Kendaraan ${vehicle.unit_code} (${vehicle.plate_number}) saat ini sudah berstatus INSIDE (Log: ${existingVehicleLog.log_id}) dan belum melakukan check-out.`
        );
      }

      // Aturan 4 (bagian 2): Satu sopir tidak boleh aktif di dua kendaraan INSIDE sekaligus (409)
      const existingDriverLog = await logRepo.getActiveByDriverId(input.driver_id);
      if (existingDriverLog) {
        throw AppError.conflict(
          `Pengemudi ${driver.name} saat ini masih aktif bertugas di dalam kendaraan lain (Log: ${existingDriverLog.log_id}).`
        );
      }

      // Aturan 5 (bagian 1): odometer_in tidak boleh lebih kecil dari last_odometer kendaraan (422)
      if (Number(input.odometer_in) < Number(vehicle.last_odometer)) {
        throw AppError.unprocessable(
          `Odometer masuk (${input.odometer_in} km) tidak boleh lebih kecil dari odometer terakhir kendaraan (${vehicle.last_odometer} km).`
        );
      }

      // Buat log masuk baru
      const newLog = await logRepo.create({
        vehicle_id: input.vehicle_id,
        driver_id: input.driver_id,
        gate: input.gate,
        purpose: input.purpose,
        destination: input.destination,
        time_in: input.time_in || getCurrentTimestampWITA(),
        odometer_in: Number(input.odometer_in),
        status: 'INSIDE',
        officer_id: input.officer_id,
        notes: input.notes || '',
      });

      return newLog;
    });
  },

  /**
   * Aturan Bisnis Check-out Kendaraan
   */
  async checkOut(input: CheckOutInput): Promise<GateLog> {
    return withSheetsLock(async () => {
      // 1. Ambil data kendaraan
      const vehicle = await vehicleRepo.getById(input.vehicle_id);
      if (!vehicle) {
        throw AppError.notFound(`Kendaraan dengan ID ${input.vehicle_id} tidak ditemukan.`);
      }

      // 2. Ambil log aktif kendaraan yang berstatus INSIDE
      const activeLog = await logRepo.getActiveByVehicleId(input.vehicle_id);
      if (!activeLog) {
        throw AppError.conflict(
          `Kendaraan ${vehicle.unit_code} (${vehicle.plate_number}) tidak memiliki riwayat aktif berstatus INSIDE.`
        );
      }

      // Aturan 5 (bagian 2): odometer_out tidak boleh lebih kecil dari odometer_in (422)
      if (Number(input.odometer_out) < Number(activeLog.odometer_in)) {
        throw AppError.unprocessable(
          `Odometer keluar (${input.odometer_out} km) tidak boleh lebih kecil dari odometer saat masuk (${activeLog.odometer_in} km).`
        );
      }

      // Aturan 6: Saat check-out sukses: isi time_out, odometer_out, ubah status jadi OUT, dan perbarui last_odometer di tab vehicles
      const timeOut = input.time_out || getCurrentTimestampWITA();
      const updatedNotes = input.notes
        ? activeLog.notes
          ? `${activeLog.notes} | Out: ${input.notes}`
          : input.notes
        : activeLog.notes;

      // Jalankan pembaruan status log dan update master odometer kendaraan secara PARALEL
      const [updatedLog] = await Promise.all([
        logRepo.update(activeLog.log_id, {
          time_out: timeOut,
          odometer_out: Number(input.odometer_out),
          status: 'OUT',
          notes: updatedNotes,
        }),
        vehicleRepo.updateOdometer(vehicle.vehicle_id, Number(input.odometer_out)),
      ]);

      if (!updatedLog) {
        throw AppError.internal('Gagal memperbarui catatan log saat check-out.');
      }

      return updatedLog;
    });
  },

  /**
   * Mengambil semua kendaraan yang saat ini sedang berada di dalam area tambang
   * Aturan 7: Overstay = status INSIDE dan durasi di dalam lebih dari OVERSTAY_HOURS. Dihitung dinamis saat query, tidak disimpan.
   */
  async getInsideVehicles(overstayHours = DEFAULT_OVERSTAY_HOURS): Promise<ActiveInsideVehicle[]> {
    const insideLogs = await logRepo.getAllActiveInside(false);
    const [vehicles, drivers] = await Promise.all([
      vehicleRepo.getAll(false),
      driverRepo.getAll(false),
    ]);

    const vehicleMap = new Map(vehicles.map((v) => [v.vehicle_id, v]));
    const driverMap = new Map(drivers.map((d) => [d.driver_id, d]));

    return insideLogs.map((log) => {
      const minutes = getDiffMinutes(log.time_in);
      return {
        ...log,
        vehicle: vehicleMap.get(log.vehicle_id),
        driver: driverMap.get(log.driver_id),
        duration_minutes: minutes,
        duration_formatted: formatDurationMinutes(minutes),
        is_overstay: isOverstay(log.time_in, overstayHours),
      };
    });
  },
};
