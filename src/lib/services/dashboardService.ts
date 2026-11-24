import { DashboardSummary, VehicleType } from '@/types';
import { logRepo } from '../repositories/logRepo';
import { vehicleRepo } from '../repositories/vehicleRepo';
import { gateService } from './gateService';
import {
  formatToWITA,
  getTodayDateWITA,
  getLastNDaysWITA,
  getDiffMinutes,
  formatDurationMinutes,
  DEFAULT_OVERSTAY_HOURS,
} from '../time';

export const dashboardService = {
  async getSummary(overstayHours = DEFAULT_OVERSTAY_HOURS): Promise<DashboardSummary> {
    const today = getTodayDateWITA();
    const [allLogs, vehicles, insideVehicles] = await Promise.all([
      logRepo.getAll(false),
      vehicleRepo.getAll(false),
      gateService.getInsideVehicles(overstayHours),
    ]);

    // 1. Jumlah kendaraan di dalam & overstay
    const vehicles_inside_count = insideVehicles.length;
    const overstay_list = insideVehicles.filter((v) => v.is_overstay);

    // 2. Total masuk & keluar hari ini (berdasarkan zona WITA)
    let today_checkin_count = 0;
    let today_checkout_count = 0;
    const completedDurationsToday: number[] = [];

    for (const log of allLogs) {
      const inDate = formatToWITA(log.time_in, 'yyyy-MM-dd');
      if (inDate === today) {
        today_checkin_count++;
      }

      if (log.time_out) {
        const outDate = formatToWITA(log.time_out, 'yyyy-MM-dd');
        if (outDate === today) {
          today_checkout_count++;
          completedDurationsToday.push(getDiffMinutes(log.time_in, log.time_out));
        }
      }
    }

    // 3. Rata-rata durasi
    const avgMinutes =
      completedDurationsToday.length > 0
        ? Math.round(
            completedDurationsToday.reduce((a, b) => a + b, 0) / completedDurationsToday.length
          )
        : 0;

    // 4. Distribusi per tipe kendaraan
    const vehicleTypeMap = new Map(vehicles.map((v) => [v.vehicle_id, v.type]));
    const vehicle_type_distribution: Record<VehicleType, number> = {
      DUMP_TRUCK: 0,
      WATER_TRUCK: 0,
      FUEL_TRUCK: 0,
      BUS: 0,
      LIGHT_VEHICLE: 0,
      EXCAVATOR_SUPPORT: 0,
    };

    for (const inside of insideVehicles) {
      const type = (inside.vehicle?.type || vehicleTypeMap.get(inside.vehicle_id)) as VehicleType;
      if (type && vehicle_type_distribution[type] !== undefined) {
        vehicle_type_distribution[type]++;
      }
    }

    // 5. Lalu lintas per jam hari ini (00:00 - 23:00)
    const hourlyTrafficMap = new Map<string, { in: number; out: number }>();
    for (let h = 0; h < 24; h++) {
      const hourStr = `${String(h).padStart(2, '0')}:00`;
      hourlyTrafficMap.set(hourStr, { in: 0, out: 0 });
    }

    for (const log of allLogs) {
      const inDate = formatToWITA(log.time_in, 'yyyy-MM-dd');
      if (inDate === today) {
        const hour = `${formatToWITA(log.time_in, 'HH')}:00`;
        const entry = hourlyTrafficMap.get(hour);
        if (entry) entry.in++;
      }

      if (log.time_out) {
        const outDate = formatToWITA(log.time_out, 'yyyy-MM-dd');
        if (outDate === today) {
          const hour = `${formatToWITA(log.time_out, 'HH')}:00`;
          const entry = hourlyTrafficMap.get(hour);
          if (entry) entry.out++;
        }
      }
    }

    const hourly_traffic_today = Array.from(hourlyTrafficMap.entries()).map(([hour, stats]) => ({
      hour,
      in: stats.in,
      out: stats.out,
    }));

    // 6. Lalu lintas harian 7 hari terakhir
    const last7Days = getLastNDaysWITA(7);
    const dailyStatsMap = new Map<string, { in: number; out: number }>();
    for (const date of last7Days) {
      dailyStatsMap.set(date, { in: 0, out: 0 });
    }

    for (const log of allLogs) {
      const inDate = formatToWITA(log.time_in, 'yyyy-MM-dd');
      if (dailyStatsMap.has(inDate)) {
        dailyStatsMap.get(inDate)!.in++;
      }

      if (log.time_out) {
        const outDate = formatToWITA(log.time_out, 'yyyy-MM-dd');
        if (dailyStatsMap.has(outDate)) {
          dailyStatsMap.get(outDate)!.out++;
        }
      }
    }

    const daily_traffic_last_7_days = last7Days.map((date) => ({
      date,
      in: dailyStatsMap.get(date)?.in || 0,
      out: dailyStatsMap.get(date)?.out || 0,
    }));

    // 7. 10 aktivitas terbaru (urutkan waktu descending)
    const sortedLogs = [...allLogs].sort((a, b) => {
      const timeA = a.time_out || a.time_in;
      const timeB = b.time_out || b.time_in;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    const recent_activities = sortedLogs.slice(0, 10);

    return {
      vehicles_inside_count,
      today_checkin_count,
      today_checkout_count,
      average_duration_minutes: avgMinutes,
      average_duration_formatted: formatDurationMinutes(avgMinutes),
      overstay_list,
      vehicle_type_distribution,
      hourly_traffic_today,
      daily_traffic_last_7_days,
      recent_activities,
    };
  },
};
