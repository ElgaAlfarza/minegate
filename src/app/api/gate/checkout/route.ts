import { NextRequest } from 'next/server';
import { gateService } from '@/lib/services/gateService';
import { getSession, requireRole } from '@/lib/auth';
import { checkOutSchema } from '@/lib/validations';
import { handleApiError, successResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const currentUser = requireRole(['OFFICER', 'SUPERVISOR', 'ADMIN'], session);

    const body = await request.json();
    const validated = checkOutSchema.parse(body);

    const updatedLog = await gateService.checkOut({
      ...validated,
      officer_id: currentUser.userId,
    });

    return successResponse(updatedLog);
  } catch (error) {
    return handleApiError(error);
  }
}
