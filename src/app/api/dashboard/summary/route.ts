import { dashboardService } from '@/lib/services/dashboardService';
import { getSession, requireRole } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    requireRole(['SUPERVISOR', 'ADMIN'], session);

    const summary = await dashboardService.getSummary();
    return successResponse(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
