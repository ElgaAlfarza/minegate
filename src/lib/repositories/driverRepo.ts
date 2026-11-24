import { Driver } from '@/types';
import { getRows, appendRow, updateRowById } from '../sheets';
import { getCurrentTimestampWITA } from '../time';

export const driverRepo = {
  async getAll(bypassCache = false): Promise<Driver[]> {
    return getRows<Driver>('drivers', bypassCache);
  },

  async getById(id: string, bypassCache = false): Promise<Driver | null> {
    const list = await this.getAll(bypassCache);
    return list.find((d) => d.driver_id === id) || null;
  },

  async create(data: Omit<Driver, 'driver_id' | 'created_at'>): Promise<Driver> {
    const all = await this.getAll(true);
    // Format ID: DR-001, DR-002, dst
    let maxNum = 0;
    for (const d of all) {
      const match = d.driver_id.match(/^DR-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextId = `DR-${String(maxNum + 1).padStart(3, '0')}`;

    const newDriver: Driver = {
      ...data,
      driver_id: nextId,
      created_at: getCurrentTimestampWITA(),
    };

    await appendRow<Driver>('drivers', newDriver);
    return newDriver;
  },

  async update(id: string, patch: Partial<Driver>): Promise<Driver | null> {
    const ok = await updateRowById<Driver>('drivers', 'driver_id', id, patch);
    if (!ok) return null;
    return this.getById(id, true);
  },

  async softDelete(id: string): Promise<boolean> {
    return updateRowById<Driver>('drivers', 'driver_id', id, { status: 'INACTIVE' });
  },
};
