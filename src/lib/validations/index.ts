import { z } from 'zod';

export const vehicleTypeEnum = z.enum([
  'DUMP_TRUCK',
  'WATER_TRUCK',
  'FUEL_TRUCK',
  'BUS',
  'LIGHT_VEHICLE',
  'EXCAVATOR_SUPPORT',
]);

export const vehicleStatusEnum = z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']);

export const driverStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

export const gateLogStatusEnum = z.enum(['INSIDE', 'OUT']);

export const gateStationEnum = z.enum(['GATE_1_MAIN', 'GATE_2_PIT', 'GATE_3_WORKSHOP']);

export const logPurposeEnum = z.enum([
  'HAULING',
  'OPERATIONAL',
  'MAINTENANCE',
  'LOGISTICS',
  'OTHER',
]);

export const userRoleEnum = z.enum(['ADMIN', 'OFFICER', 'SUPERVISOR']);

export const userStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

export const plateNumberSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().replace(/\s+/g, ' ').toUpperCase() : val),
  z
    .string()
    .min(3, 'Nomor plat minimal 3 karakter')
    .max(15, 'Nomor plat maksimal 15 karakter')
);

// Auth
export const loginSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

// Vehicle
export const createVehicleSchema = z.object({
  unit_code: z.string().min(2, 'Kode unit minimal 2 karakter').max(20).toUpperCase(),
  plate_number: plateNumberSchema,
  type: vehicleTypeEnum,
  brand_model: z.string().min(2, 'Merk / model minimal 2 karakter').max(100),
  owner_company: z.string().min(2, 'Nama perusahaan pemilik minimal 2 karakter').max(100),
  status: vehicleStatusEnum.default('ACTIVE'),
  last_odometer: z.coerce.number().min(0, 'Odometer tidak boleh negatif'),
});

export const updateVehicleSchema = createVehicleSchema.partial();

// Driver
export const createDriverSchema = z.object({
  name: z.string().min(2, 'Nama pengemudi minimal 2 karakter').max(100),
  license_type: z.string().min(2, 'Jenis SIM / Lisensi minimal 2 karakter').max(20).toUpperCase(),
  company: z.string().min(2, 'Nama perusahaan minimal 2 karakter').max(100),
  phone: z.string().min(8, 'Nomor telepon minimal 8 digit').max(20),
  status: driverStatusEnum.default('ACTIVE'),
});

export const updateDriverSchema = createDriverSchema.partial();

// Gate Check-in & Check-out
export const checkInSchema = z.object({
  vehicle_id: z.string().min(1, 'ID Kendaraan wajib diisi'),
  driver_id: z.string().min(1, 'ID Pengemudi wajib diisi'),
  gate: gateStationEnum,
  purpose: logPurposeEnum,
  destination: z.string().min(2, 'Tujuan operasional wajib diisi').max(100),
  odometer_in: z.coerce.number().min(0, 'Odometer masuk tidak boleh negatif'),
  notes: z.string().max(500).optional().default(''),
});

export const checkOutSchema = z.object({
  vehicle_id: z.string().min(1, 'ID Kendaraan wajib diisi'),
  odometer_out: z.coerce.number().min(0, 'Odometer keluar tidak boleh negatif'),
  notes: z.string().max(500).optional(),
});

// Users
export const createUserSchema = z.object({
  name: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(100),
  username: z.string().min(3, 'Username minimal 3 karakter').max(50).toLowerCase(),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: userRoleEnum,
  status: userStatusEnum.default('ACTIVE'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  password: z.string().min(6).optional(),
  role: userRoleEnum.optional(),
  status: userStatusEnum.optional(),
});

// Query params for logs
export const logsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  status: gateLogStatusEnum.optional(),
  gate: gateStationEnum.optional(),
  vehicleId: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});
