import { NextRequest } from 'next/server';
import { driverRepo } from '@/lib/repositories/driverRepo';
import { getSession, requireRole } from '@/lib/auth';
import { updateDriverSchema } from '@/lib/validations';
import { AppError, handleApiError, successResponse } from '@/lib/errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    requireRole(['OFFICER', 'SUPERVISOR', 'ADMIN'], session);

    const { id } = await context.params;
    const driver = await driverRepo.getById(id);
    if (!driver) {
      throw AppError.notFound(`Pengemudi dengan ID '${id}' tidak ditemukan.`);
    }

    return successResponse(driver);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    requireRole(['ADMIN'], session);

    const { id } = await context.params;
    const driver = await driverRepo.getById(id);
    if (!driver) {
      throw AppError.notFound(`Pengemudi dengan ID '${id}' tidak ditemukan.`);
    }

    const body = await request.json();
    const validated = updateDriverSchema.parse(body);

    const updated = await driverRepo.update(id, validated);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    requireRole(['ADMIN'], session);

    const { id } = await context.params;
    const driver = await driverRepo.getById(id);
    if (!driver) {
      throw AppError.notFound(`Pengemudi dengan ID '${id}' tidak ditemukan.`);
    }

    await driverRepo.softDelete(id);
    return successResponse({
      message: `Pengemudi ${driver.name} berhasil dinonaktifkan (soft delete).`,
      driver_id: id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
