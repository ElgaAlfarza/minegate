import { NextRequest, NextResponse } from 'next/server';
import { logRepo } from '@/lib/repositories/logRepo';
import { vehicleRepo } from '@/lib/repositories/vehicleRepo';
import { driverRepo } from '@/lib/repositories/driverRepo';
import { getSession, requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { formatToWITA, getCurrentTimestampWITA } from '@/lib/time';

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // Netralkan CSV injection (sel diawali =, +, -, @ diberi tanda petik tunggal)
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    requireRole(['SUPERVISOR', 'ADMIN'], session);

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const [allLogs, vehicles, drivers] = await Promise.all([
      logRepo.getAll(),
      vehicleRepo.getAll(),
      driverRepo.getAll(),
    ]);

    const vehicleMap = new Map(vehicles.map((v) => [v.vehicle_id, v]));
    const driverMap = new Map(drivers.map((d) => [d.driver_id, d]));

    // Filter berdasarkan rentang tanggal
    const filtered = allLogs.filter((log) => {
      const inDate = formatToWITA(log.time_in, 'yyyy-MM-dd');
      if (from && inDate < from) return false;
      if (to && inDate > to) return false;
      return true;
    });

    // Urutkan waktu ascending untuk laporan
    filtered.sort((a, b) => new Date(a.time_in).getTime() - new Date(b.time_in).getTime());

    const headers = [
      'ID Log',
      'ID Kendaraan',
      'Kode Unit',
      'Nomor Plat',
      'Tipe Kendaraan',
      'ID Pengemudi',
      'Nama Pengemudi',
      'Perusahaan Pemilik',
      'Gate',
      'Keperluan',
      'Tujuan',
      'Waktu Masuk (WITA)',
      'Waktu Keluar (WITA)',
      'Odometer Masuk (km)',
      'Odometer Keluar (km)',
      'Status',
      'ID Petugas',
      'Catatan',
    ];

    const rows = filtered.map((log) => {
      const v = vehicleMap.get(log.vehicle_id);
      const d = driverMap.get(log.driver_id);

      return [
        log.log_id,
        log.vehicle_id,
        v?.unit_code || '',
        v?.plate_number || '',
        v?.type || '',
        log.driver_id,
        d?.name || '',
        v?.owner_company || d?.company || '',
        log.gate,
        log.purpose,
        log.destination,
        log.time_in ? formatToWITA(log.time_in) : '',
        log.time_out ? formatToWITA(log.time_out) : '',
        log.odometer_in,
        log.odometer_out !== undefined ? log.odometer_out : '',
        log.status,
        log.officer_id,
        log.notes || '',
      ]
        .map(escapeCsvCell)
        .join(',');
    });

    // Sertakan UTF-8 BOM (\uFEFF) agar Microsoft Excel membuka karakter dengan benar
    const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');

    const filename = `minegate_reports_${formatToWITA(new Date(), 'yyyyMMdd_HHmmss')}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
