import { GateLog, GateLogStatus } from '@/types';
import { getRows, appendRow, updateRowById } from '../sheets';
import { getCurrentTimestampWITA, getLogDatePrefixWITA } from '../time';

export const logRepo = {
  async getAll(bypassCache = false): Promise<GateLog[]> {
    return getRows<GateLog>('gate_logs', bypassCache);
  },

  async getById(id: string, bypassCache = false): Promise<GateLog | null> {
    const list = await this.getAll(bypassCache);
    return list.find((l) => l.log_id === id) || null;
  },

  async getActiveByVehicleId(vehicleId: string, bypassCache = false): Promise<GateLog | null> {
    const list = await this.getAll(bypassCache);
    return list.find((l) => l.vehicle_id === vehicleId && l.status === 'INSIDE') || null;
  },

  async getActiveByDriverId(driverId: string, bypassCache = false): Promise<GateLog | null> {
    const list = await this.getAll(bypassCache);
    return list.find((l) => l.driver_id === driverId && l.status === 'INSIDE') || null;
  },

  async getAllActiveInside(bypassCache = false): Promise<GateLog[]> {
    const list = await this.getAll(bypassCache);
    return list.filter((l) => l.status === 'INSIDE');
  },

  async create(
    data: Omit<GateLog, 'log_id' | 'status' | 'time_in'> & {
      status?: GateLogStatus;
      time_in?: string;
    }
  ): Promise<GateLog> {
    const nowTimestamp = getCurrentTimestampWITA();
    const timeIn = data.time_in || nowTimestamp;
    const datePrefix = getLogDatePrefixWITA(new Date(timeIn));
    const prefix = `LOG-${datePrefix}-`;

    const all = await this.getAll(true);
    let maxNum = 0;
    for (const log of all) {
      if (log.log_id.startsWith(prefix)) {
        const numPart = log.log_id.slice(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextId = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;

    const newLog: GateLog = {
      log_id: nextId,
      vehicle_id: data.vehicle_id,
      driver_id: data.driver_id,
      gate: data.gate,
      purpose: data.purpose,
      destination: data.destination,
      time_in: timeIn,
      time_out: data.time_out || '',
      odometer_in: data.odometer_in,
      odometer_out: data.odometer_out !== undefined ? data.odometer_out : ('' as unknown as number),
      status: data.status || 'INSIDE',
      officer_id: data.officer_id,
      notes: data.notes || '',
    };

    await appendRow<GateLog>('gate_logs', newLog);
    return newLog;
  },

  async update(id: string, patch: Partial<GateLog>): Promise<GateLog | null> {
    const existing = await this.getById(id);
    const ok = await updateRowById<GateLog>('gate_logs', 'log_id', id, patch);
    if (!ok) return null;
    return existing ? { ...existing, ...patch } : this.getById(id, true);
  },
};
