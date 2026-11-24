import { NextRequest } from 'next/server';
import { gateService } from '@/lib/services/gateService';
import { getSession, requireRole } from '@/lib/auth';
import { checkInSchema } from '@/lib/validations';
import { handleApiError, successResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const currentUser = requireRole(['OFFICER', 'SUPERVISOR', 'ADMIN'], session);

    const body = await request.json();
    const validated = checkInSchema.parse(body);

    const newLog = await gateService.checkIn({
      ...validated,
      officer_id: currentUser.userId,
    });

    return successResponse(newLog, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
