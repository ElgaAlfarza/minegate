import { NextRequest } from 'next/server';
import { vehicleRepo } from '@/lib/repositories/vehicleRepo';
import { getSession, requireRole } from '@/lib/auth';
import { updateVehicleSchema } from '@/lib/validations';
import { AppError, handleApiError, successResponse } from '@/lib/errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    requireRole(['OFFICER', 'SUPERVISOR', 'ADMIN'], session);

    const { id } = await context.params;
    const vehicle = await vehicleRepo.getById(id);
    if (!vehicle) {
      throw AppError.notFound(`Kendaraan dengan ID '${id}' tidak ditemukan.`);
    }

    return successResponse(vehicle);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    requireRole(['ADMIN'], session);

    const { id } = await context.params;
    const vehicle = await vehicleRepo.getById(id);
    if (!vehicle) {
      throw AppError.notFound(`Kendaraan dengan ID '${id}' tidak ditemukan.`);
    }

    const body = await request.json();
    const validated = updateVehicleSchema.parse(body);

    if (validated.plate_number && validated.plate_number !== vehicle.plate_number) {
      const existingPlate = await vehicleRepo.getByPlate(validated.plate_number);
      if (existingPlate && existingPlate.vehicle_id !== id) {
        throw AppError.conflict(`Nomor plat '${validated.plate_number}' sudah digunakan.`);
      }
    }

    if (validated.unit_code && validated.unit_code !== vehicle.unit_code) {
      const existingCode = await vehicleRepo.getByUnitCode(validated.unit_code);
      if (existingCode && existingCode.vehicle_id !== id) {
        throw AppError.conflict(`Kode unit '${validated.unit_code}' sudah digunakan.`);
      }
    }

    const updated = await vehicleRepo.update(id, validated);
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
    const vehicle = await vehicleRepo.getById(id);
    if (!vehicle) {
      throw AppError.notFound(`Kendaraan dengan ID '${id}' tidak ditemukan.`);
    }

    await vehicleRepo.softDelete(id);
    return successResponse({
      message: `Kendaraan ${vehicle.unit_code} berhasil dinonaktifkan (soft delete).`,
      vehicle_id: id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
