import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { differenceInMinutes, parseISO } from 'date-fns';

export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Makassar';
export const DEFAULT_OVERSTAY_HOURS = Number(process.env.OVERSTAY_HOURS) || 12;

/**
 * Mendapatkan timestamp saat ini dalam format ISO 8601 dengan offset WITA (+08:00).
 * Contoh: 2026-11-24T10:30:00+08:00
 */
export function getCurrentTimestampWITA(date: Date = new Date()): string {
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssxxx");
}

/**
 * Format tanggal dalam zona waktu WITA dengan pola kustom
 */
export function formatToWITA(dateInput: Date | string | number, formatStr = 'yyyy-MM-dd HH:mm:ss'): string {
  const d = typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput);
  return formatInTimeZone(d, APP_TIMEZONE, formatStr);
}

/**
 * Tanggal hari ini dalam WITA (format YYYY-MM-DD)
 */
export function getTodayDateWITA(): string {
  return formatInTimeZone(new Date(), APP_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Prefix tanggal untuk format log_id: LOG-YYYYMMDD-001
 */
export function getLogDatePrefixWITA(date: Date = new Date()): string {
  return formatInTimeZone(date, APP_TIMEZONE, 'yyyyMMdd');
}

/**
 * Menghitung selisih durasi dalam menit antara waktu masuk dan waktu keluar (atau sekarang jika belum keluar)
 */
export function getDiffMinutes(startIso: string, endIso?: string): number {
  const startDate = parseISO(startIso);
  const endDate = endIso ? parseISO(endIso) : new Date();
  const diff = differenceInMinutes(endDate, startDate);
  return diff >= 0 ? diff : 0;
}

/**
 * Format durasi menit menjadi teks yang ramah pengguna (contoh: "14 jam 20 menit" atau "45 menit")
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} menit`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} jam`;
  }
  return `${hours} jam ${remainingMinutes} menit`;
}

/**
 * Mengecek apakah kendaraan berstatus overstay (> OVERSTAY_HOURS)
 */
export function isOverstay(timeInIso: string, overstayHours = DEFAULT_OVERSTAY_HOURS): boolean {
  const diffMinutes = getDiffMinutes(timeInIso);
  return diffMinutes > overstayHours * 60;
}

/**
 * Mendapatkan daftar N hari terakhir dalam format YYYY-MM-DD sesuai zona waktu WITA
 */
export function getLastNDaysWITA(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(formatInTimeZone(targetDate, APP_TIMEZONE, 'yyyy-MM-dd'));
  }
  return days;
}
