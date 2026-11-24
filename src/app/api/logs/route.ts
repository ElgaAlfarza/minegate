import { NextRequest } from 'next/server';
import { logRepo } from '@/lib/repositories/logRepo';
import { getSession, requireRole } from '@/lib/auth';
import { logsQuerySchema } from '@/lib/validations';
import { handleApiError, successResponse } from '@/lib/errors';
import { formatToWITA } from '@/lib/time';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    requireRole(['OFFICER', 'SUPERVISOR', 'ADMIN'], session);

    const searchParams = request.nextUrl.searchParams;
    const query = logsQuerySchema.parse({
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      status: searchParams.get('status') || undefined,
      gate: searchParams.get('gate') || undefined,
      vehicleId: searchParams.get('vehicleId') || undefined,
      q: searchParams.get('q') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    });

    const allLogs = await logRepo.getAll();

    // Lakukan filtering
    const filtered = allLogs.filter((log) => {
      if (query.status && log.status !== query.status) {
        return false;
      }

      if (query.gate && log.gate !== query.gate) {
        return false;
      }

      if (query.vehicleId && log.vehicle_id !== query.vehicleId) {
        return false;
      }

      if (query.from) {
        const inDate = formatToWITA(log.time_in, 'yyyy-MM-dd');
        if (inDate < query.from) {
          return false;
        }
      }

      if (query.to) {
        const inDate = formatToWITA(log.time_in, 'yyyy-MM-dd');
        if (inDate > query.to) {
          return false;
        }
      }

      if (query.q) {
        const keyword = query.q.toLowerCase();
        const matchesSearch =
          log.log_id.toLowerCase().includes(keyword) ||
          log.vehicle_id.toLowerCase().includes(keyword) ||
          log.driver_id.toLowerCase().includes(keyword) ||
          log.destination.toLowerCase().includes(keyword) ||
          log.notes.toLowerCase().includes(keyword) ||
          log.purpose.toLowerCase().includes(keyword);

        if (!matchesSearch) return false;
      }

      return true;
    });

    // Urutkan waktu descending
    filtered.sort((a, b) => new Date(b.time_in).getTime() - new Date(a.time_in).getTime());

    // Paginasi
    const total = filtered.length;
    const page = query.page;
    const pageSize = query.pageSize;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return successResponse({
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
