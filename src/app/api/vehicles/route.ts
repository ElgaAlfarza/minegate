import { NextRequest } from 'next/server';
import { vehicleRepo } from '@/lib/repositories/vehicleRepo';
import { getSession, requireRole } from '@/lib/auth';
import { createVehicleSchema } from '@/lib/validations';
import { AppError, handleApiError, successResponse } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    requireRole(['OFFICER', 'SUPERVISOR', 'ADMIN'], session);

    const vehicles = await vehicleRepo.getAll();
    return successResponse(vehicles);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    requireRole(['ADMIN'], session);

    const body = await request.json();
    const validated = createVehicleSchema.parse(body);

    // Cek duplikasi nomor plat atau kode unit
    const [existingPlate, existingCode] = await Promise.all([
      vehicleRepo.getByPlate(validated.plate_number),
      vehicleRepo.getByUnitCode(validated.unit_code),
    ]);

    if (existingPlate) {
      throw AppError.conflict(
        `Nomor plat '${validated.plate_number}' sudah terdaftar pada unit ${existingPlate.unit_code}.`
      );
    }

    if (existingCode) {
      throw AppError.conflict(
        `Kode unit '${validated.unit_code}' sudah terdaftar pada plat ${existingCode.plate_number}.`
      );
    }

    const created = await vehicleRepo.create(validated);
    return successResponse(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
