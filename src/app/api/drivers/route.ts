import { NextRequest } from 'next/server';
import { driverRepo } from '@/lib/repositories/driverRepo';
import { getSession, requireRole } from '@/lib/auth';
import { createDriverSchema } from '@/lib/validations';
import { handleApiError, successResponse } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    requireRole(['OFFICER', 'SUPERVISOR', 'ADMIN'], session);

    const drivers = await driverRepo.getAll();
    return successResponse(drivers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    requireRole(['ADMIN'], session);

    const body = await request.json();
    const validated = createDriverSchema.parse(body);

    const created = await driverRepo.create(validated);
    return successResponse(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
