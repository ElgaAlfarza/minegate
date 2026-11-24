import { Vehicle } from '@/types';
import { getRows, appendRow, updateRowById } from '../sheets';
import { getCurrentTimestampWITA } from '../time';

export const vehicleRepo = {
  async getAll(bypassCache = false): Promise<Vehicle[]> {
    return getRows<Vehicle>('vehicles', bypassCache);
  },

  async getById(id: string, bypassCache = false): Promise<Vehicle | null> {
    const list = await this.getAll(bypassCache);
    return list.find((v) => v.vehicle_id === id) || null;
  },

  async getByPlate(plate: string, bypassCache = false): Promise<Vehicle | null> {
    const normalized = plate.trim().replace(/\s+/g, ' ').toUpperCase();
    const list = await this.getAll(bypassCache);
    return list.find((v) => v.plate_number.replace(/\s+/g, ' ').toUpperCase() === normalized) || null;
  },

  async getByUnitCode(code: string, bypassCache = false): Promise<Vehicle | null> {
    const normalized = code.trim().toUpperCase();
    const list = await this.getAll(bypassCache);
    return list.find((v) => v.unit_code.toUpperCase() === normalized) || null;
  },

  async create(data: Omit<Vehicle, 'vehicle_id' | 'created_at'>): Promise<Vehicle> {
    const all = await this.getAll(true);
    // Format ID: VH-001, VH-002, dst
    let maxNum = 0;
    for (const v of all) {
      const match = v.vehicle_id.match(/^VH-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextId = `VH-${String(maxNum + 1).padStart(3, '0')}`;

    const newVehicle: Vehicle = {
      ...data,
      vehicle_id: nextId,
      created_at: getCurrentTimestampWITA(),
    };

    await appendRow<Vehicle>('vehicles', newVehicle);
    return newVehicle;
  },

  async update(id: string, patch: Partial<Vehicle>): Promise<Vehicle | null> {
    const existing = await this.getById(id);
    const ok = await updateRowById<Vehicle>('vehicles', 'vehicle_id', id, patch);
    if (!ok) return null;
    return existing ? { ...existing, ...patch } : this.getById(id, true);
  },

  async softDelete(id: string): Promise<boolean> {
    return updateRowById<Vehicle>('vehicles', 'vehicle_id', id, { status: 'INACTIVE' });
  },

  async updateOdometer(id: string, newOdometer: number): Promise<boolean> {
    return updateRowById<Vehicle>('vehicles', 'vehicle_id', id, { last_odometer: newOdometer });
  },
};
