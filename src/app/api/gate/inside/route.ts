import { gateService } from '@/lib/services/gateService';
import { getSession, requireRole } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    requireRole(['OFFICER', 'SUPERVISOR', 'ADMIN'], session);

    const insideVehicles = await gateService.getInsideVehicles();
    return successResponse(insideVehicles);
  } catch (error) {
    return handleApiError(error);
  }
}
