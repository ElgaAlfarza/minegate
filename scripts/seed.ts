import fs from 'fs';
import path from 'path';

// Toleransi sertifikat SSL sistem Windows jika diperlukan
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import bcrypt from 'bcryptjs';
import { formatInTimeZone } from 'date-fns-tz';
import {
  Vehicle,
  Driver,
  GateLog,
  User,
  VehicleType,
  GateStation,
  LogPurpose,
} from '../src/types';
import {
  ensureHeaders,
  getRows,
  appendRow,
  updateRowById,
  invalidateSheetCache,
} from '../src/lib/sheets';

// Load .env.local jika ada
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Makassar';

function formatWITA(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssxxx");
}

function getDayOffsetDate(daysAgo: number, hoursAgo = 0, minutesAgo = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  d.setMinutes(d.getMinutes() - minutesAgo);
  return d;
}

async function main() {
  console.log('========================================================');
  console.log('🚀 [MINEGATE] Memulai Proses Seeding Google Sheets...');
  console.log('========================================================');

  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!appsScriptUrl && (!spreadsheetId || !serviceAccount || !privateKey)) {
    console.error('❌ GAGAL: Konfigurasi Google Sheets belum lengkap!');
    console.error('Harap isi GOOGLE_APPS_SCRIPT_URL (Metode Apps Script yang mudah)');
    console.error('ATAU isi (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) pada file .env.local');
    process.exit(1);
  }

  // 1. Pastikan semua tab memiliki Header baris 1 yang valid
  console.log('📋 1. Memastikan header pada 4 tab (vehicles, drivers, gate_logs, users)...');
  await ensureHeaders('vehicles');
  await ensureHeaders('drivers');
  await ensureHeaders('gate_logs');
  await ensureHeaders('users');
  console.log('✅ Header semua tab terverifikasi.');

  // 2. Ambil data eksisting untuk memastikan idempotensi
  console.log('🔍 2. Memeriksa data eksisting untuk idempotensi...');
  const existingVehicles = await getRows<Vehicle>('vehicles', true);
  const existingDrivers = await getRows<Driver>('drivers', true);
  const existingUsers = await getRows<User>('users', true);
  const existingLogs = await getRows<GateLog>('gate_logs', true);

  const existingVehicleIds = new Set(existingVehicles.map((v) => v.vehicle_id));
  const existingDriverIds = new Set(existingDrivers.map((d) => d.driver_id));
  const existingUsernames = new Set(existingUsers.map((u) => u.username.toLowerCase()));
  const existingLogIds = new Set(existingLogs.map((l) => l.log_id));

  // 3. Seed Users (admin, officer1, supervisor1)
  console.log('👤 3. Melakukan seeding data Users...');
  const defaultPasswordHash = await bcrypt.hash('Minegate#2026', 10);
  const seedUsers: Omit<User, 'created_at'>[] = [
    {
      user_id: 'USR-001',
      name: 'Administrator Gate',
      username: 'admin',
      password_hash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    {
      user_id: 'USR-002',
      name: 'Petugas Jaga Gate',
      username: 'officer1',
      password_hash: defaultPasswordHash,
      role: 'OFFICER',
      status: 'ACTIVE',
    },
    {
      user_id: 'USR-003',
      name: 'Supervisor Operasional',
      username: 'supervisor1',
      password_hash: defaultPasswordHash,
      role: 'SUPERVISOR',
      status: 'ACTIVE',
    },
  ];

  let insertedUsers = 0;
  for (const u of seedUsers) {
    if (!existingUsernames.has(u.username.toLowerCase())) {
      const newUser: User = {
        ...u,
        created_at: formatWITA(getDayOffsetDate(14)),
      };
      await appendRow<User>('users', newUser);
      existingUsernames.add(u.username.toLowerCase());
      insertedUsers++;
    }
  }
  console.log(`✅ Users: ${insertedUsers} ditambahkan, ${seedUsers.length - insertedUsers} sudah ada.`);

  // 4. Seed 20 Kendaraan (plat EA, unit DT-101, WT-201, FT-301, BUS-401, LV-501)
  console.log('🚛 4. Melakukan seeding 20 Kendaraan...');
  const seedVehicles: Omit<Vehicle, 'created_at'>[] = [
    // Dump Trucks (DT)
    { vehicle_id: 'VH-001', unit_code: 'DT-101', plate_number: 'EA 8101 BA', type: 'DUMP_TRUCK', brand_model: 'Scania R580 6x4', owner_company: 'PT Nusa Hauling Mandiri', status: 'ACTIVE', last_odometer: 42150 },
    { vehicle_id: 'VH-002', unit_code: 'DT-102', plate_number: 'EA 8102 BA', type: 'DUMP_TRUCK', brand_model: 'Scania R580 6x4', owner_company: 'PT Nusa Hauling Mandiri', status: 'ACTIVE', last_odometer: 39820 },
    { vehicle_id: 'VH-003', unit_code: 'DT-103', plate_number: 'EA 8103 BB', type: 'DUMP_TRUCK', brand_model: 'Volvo FMX 440', owner_company: 'PT Mineral Bumi Lestari', status: 'ACTIVE', last_odometer: 51200 },
    { vehicle_id: 'VH-004', unit_code: 'DT-104', plate_number: 'EA 8104 BB', type: 'DUMP_TRUCK', brand_model: 'Volvo FMX 440', owner_company: 'PT Mineral Bumi Lestari', status: 'ACTIVE', last_odometer: 47610 },
    { vehicle_id: 'VH-005', unit_code: 'DT-105', plate_number: 'EA 8105 BC', type: 'DUMP_TRUCK', brand_model: 'Mercedes Actros 4043', owner_company: 'PT Tambang Raya Transport', status: 'ACTIVE', last_odometer: 33400 },
    { vehicle_id: 'VH-006', unit_code: 'DT-106', plate_number: 'EA 8106 BC', type: 'DUMP_TRUCK', brand_model: 'Mercedes Actros 4043', owner_company: 'PT Tambang Raya Transport', status: 'ACTIVE', last_odometer: 28950 },
    { vehicle_id: 'VH-007', unit_code: 'DT-107', plate_number: 'EA 8107 BD', type: 'DUMP_TRUCK', brand_model: 'Hino 700 Profia', owner_company: 'PT Nusa Hauling Mandiri', status: 'MAINTENANCE', last_odometer: 64200 },
    { vehicle_id: 'VH-008', unit_code: 'DT-108', plate_number: 'EA 8108 BD', type: 'DUMP_TRUCK', brand_model: 'Hino 700 Profia', owner_company: 'PT Nusa Hauling Mandiri', status: 'INACTIVE', last_odometer: 89000 },
    // Water Trucks (WT)
    { vehicle_id: 'VH-009', unit_code: 'WT-201', plate_number: 'EA 8201 WA', type: 'WATER_TRUCK', brand_model: 'Nissan Diesel CWB45', owner_company: 'PT Rinjani Supplying', status: 'ACTIVE', last_odometer: 36700 },
    { vehicle_id: 'VH-010', unit_code: 'WT-202', plate_number: 'EA 8202 WA', type: 'WATER_TRUCK', brand_model: 'Hino FM 260 JD', owner_company: 'PT Rinjani Supplying', status: 'ACTIVE', last_odometer: 24150 },
    { vehicle_id: 'VH-011', unit_code: 'WT-203', plate_number: 'EA 8203 WB', type: 'WATER_TRUCK', brand_model: 'Mitsubishi Fuso FN527', owner_company: 'PT Mineral Bumi Lestari', status: 'ACTIVE', last_odometer: 19800 },
    // Fuel Trucks (FT)
    { vehicle_id: 'VH-012', unit_code: 'FT-301', plate_number: 'EA 8301 FA', type: 'FUEL_TRUCK', brand_model: 'Scania P360 6x4', owner_company: 'PT Energi Mitra Tambang', status: 'ACTIVE', last_odometer: 18450 },
    { vehicle_id: 'VH-013', unit_code: 'FT-302', plate_number: 'EA 8302 FA', type: 'FUEL_TRUCK', brand_model: 'Volvo FM 370', owner_company: 'PT Energi Mitra Tambang', status: 'ACTIVE', last_odometer: 22100 },
    { vehicle_id: 'VH-014', unit_code: 'FT-303', plate_number: 'EA 8303 FB', type: 'FUEL_TRUCK', brand_model: 'Hino FM 285 TI', owner_company: 'PT Energi Mitra Tambang', status: 'ACTIVE', last_odometer: 15300 },
    // Bus Karyawan (BUS)
    { vehicle_id: 'VH-015', unit_code: 'BUS-401', plate_number: 'EA 8401 PA', type: 'BUS', brand_model: 'Mercedes-Benz OF 917', owner_company: 'PT Trans Borneo Samudra', status: 'ACTIVE', last_odometer: 54300 },
    { vehicle_id: 'VH-016', unit_code: 'BUS-402', plate_number: 'EA 8402 PA', type: 'BUS', brand_model: 'Isuzu NQR 71', owner_company: 'PT Trans Borneo Samudra', status: 'ACTIVE', last_odometer: 48900 },
    // Light Vehicles (LV)
    { vehicle_id: 'VH-017', unit_code: 'LV-501', plate_number: 'EA 8501 LA', type: 'LIGHT_VEHICLE', brand_model: 'Toyota Hilux 4x4 Double Cabin', owner_company: 'PT Nusa Hauling Mandiri', status: 'ACTIVE', last_odometer: 61200 },
    { vehicle_id: 'VH-018', unit_code: 'LV-502', plate_number: 'EA 8502 LA', type: 'LIGHT_VEHICLE', brand_model: 'Toyota Hilux 4x4 Single Cabin', owner_company: 'PT Mineral Bumi Lestari', status: 'ACTIVE', last_odometer: 45700 },
    { vehicle_id: 'VH-019', unit_code: 'LV-503', plate_number: 'EA 8503 LB', type: 'LIGHT_VEHICLE', brand_model: 'Mitsubishi Triton HDX 4x4', owner_company: 'PT Rinjani Supplying', status: 'ACTIVE', last_odometer: 38250 },
    // Excavator Support (ES)
    { vehicle_id: 'VH-020', unit_code: 'ES-601', plate_number: 'EA 8601 SA', type: 'EXCAVATOR_SUPPORT', brand_model: 'Hino Ranger 500 Lube Truck', owner_company: 'PT Tambang Raya Transport', status: 'ACTIVE', last_odometer: 27800 },
  ];

  let insertedVehicles = 0;
  for (const v of seedVehicles) {
    if (!existingVehicleIds.has(v.vehicle_id)) {
      const newV: Vehicle = {
        ...v,
        created_at: formatWITA(getDayOffsetDate(10)),
      };
      await appendRow<Vehicle>('vehicles', newV);
      existingVehicleIds.add(v.vehicle_id);
      insertedVehicles++;
    }
  }
  console.log(`✅ Kendaraan: ${insertedVehicles} ditambahkan, ${seedVehicles.length - insertedVehicles} sudah ada.`);

  // 5. Seed 15 Pengemudi
  console.log('👷 5. Melakukan seeding 15 Pengemudi...');
  const seedDrivers: Omit<Driver, 'created_at'>[] = [
    { driver_id: 'DR-001', name: 'Bambang Sudiro', license_type: 'SIM B2 UMUM', company: 'PT Nusa Hauling Mandiri', phone: '081234567801', status: 'ACTIVE' },
    { driver_id: 'DR-002', name: 'I Made Sujana', license_type: 'SIM B2 UMUM', company: 'PT Nusa Hauling Mandiri', phone: '081234567802', status: 'ACTIVE' },
    { driver_id: 'DR-003', name: 'Ahmad Fauzi', license_type: 'SIM B2 UMUM', company: 'PT Mineral Bumi Lestari', phone: '081234567803', status: 'ACTIVE' },
    { driver_id: 'DR-004', name: 'Denny Setiawan', license_type: 'SIM B2 UMUM', company: 'PT Mineral Bumi Lestari', phone: '081234567804', status: 'ACTIVE' },
    { driver_id: 'DR-005', name: 'Rahmat Hidayat', license_type: 'SIM B2 UMUM', company: 'PT Tambang Raya Transport', phone: '081234567805', status: 'ACTIVE' },
    { driver_id: 'DR-006', name: 'Heri Prasetyo', license_type: 'SIM B2 UMUM', company: 'PT Tambang Raya Transport', phone: '081234567806', status: 'ACTIVE' },
    { driver_id: 'DR-007', name: 'Syamsul Bahri', license_type: 'SIM B1 UMUM', company: 'PT Rinjani Supplying', phone: '081234567807', status: 'ACTIVE' },
    { driver_id: 'DR-008', name: 'Gede Arya Wijaya', license_type: 'SIM B1 UMUM', company: 'PT Rinjani Supplying', phone: '081234567808', status: 'ACTIVE' },
    { driver_id: 'DR-009', name: 'Faisal Basri', license_type: 'SIM B2 UMUM', company: 'PT Energi Mitra Tambang', phone: '081234567809', status: 'ACTIVE' },
    { driver_id: 'DR-010', name: 'Joko Susanto', license_type: 'SIM B2 UMUM', company: 'PT Energi Mitra Tambang', phone: '081234567810', status: 'ACTIVE' },
    { driver_id: 'DR-011', name: 'Muhammad Ridwan', license_type: 'SIM B1', company: 'PT Trans Borneo Samudra', phone: '081234567811', status: 'ACTIVE' },
    { driver_id: 'DR-012', name: 'Kadek Sastrawan', license_type: 'SIM B1', company: 'PT Trans Borneo Samudra', phone: '081234567812', status: 'ACTIVE' },
    { driver_id: 'DR-013', name: 'Agus Salim', license_type: 'SIM A', company: 'PT Nusa Hauling Mandiri', phone: '081234567813', status: 'ACTIVE' },
    { driver_id: 'DR-014', name: 'Budi Hartono', license_type: 'SIM A', company: 'PT Mineral Bumi Lestari', phone: '081234567814', status: 'ACTIVE' },
    { driver_id: 'DR-015', name: 'Eko Wahyudi', license_type: 'SIM B2 UMUM', company: 'PT Tambang Raya Transport', phone: '081234567815', status: 'INACTIVE' },
  ];

  let insertedDrivers = 0;
  for (const d of seedDrivers) {
    if (!existingDriverIds.has(d.driver_id)) {
      const newD: Driver = {
        ...d,
        created_at: formatWITA(getDayOffsetDate(10)),
      };
      await appendRow<Driver>('drivers', newD);
      existingDriverIds.add(d.driver_id);
      insertedDrivers++;
    }
  }
  console.log(`✅ Pengemudi: ${insertedDrivers} ditambahkan, ${seedDrivers.length - insertedDrivers} sudah ada.`);

  // 6. Seed Gate Logs (~60 logs selama 7 hari terakhir)
  // Syarat:
  // - 6 kendaraan berstatus INSIDE saat ini, 2 di antaranya OVERSTAY (> 12 jam)
  // - 54 log lainnya berstatus OUT (selesai)
  console.log('📝 6. Melakukan seeding Gate Logs (60 records, 6 INSIDE [2 Overstay])...');

  const gates: GateStation[] = ['GATE_1_MAIN', 'GATE_2_PIT', 'GATE_3_WORKSHOP'];
  const purposes: LogPurpose[] = ['HAULING', 'OPERATIONAL', 'MAINTENANCE', 'LOGISTICS', 'OTHER'];
  const destinations = ['Pit Utara Front A', 'ROM Stockpile 1', 'Workshop Central', 'Disposal Barat', 'Fuel Station 2', 'Port Jetty'];

  const logsToInsert: GateLog[] = [];

  // A. 54 Log OUT selama 7 hari terakhir (Hari -6 sampai Hari -1 dan tadi pagi)
  let logSeq = 1;
  for (let day = 6; day >= 1; day--) {
    const logsPerDay = 8;
    for (let i = 0; i < logsPerDay; i++) {
      const vIdx = (day * 3 + i) % 16; // gunakan kendaraan aktif VH-001 s.d VH-016
      const dIdx = (day * 2 + i) % 14; // gunakan pengemudi aktif DR-001 s.d DR-014
      const vehicle = seedVehicles[vIdx];
      const driver = seedDrivers[dIdx];

      const hourIn = 6 + (i * 2) % 14; // antara 06:00 sampai 20:00
      const durationHours = 1 + (i % 4); // 1 sampai 4 jam

      const dateIn = getDayOffsetDate(day, 24 - hourIn, (i * 13) % 60);
      const dateOut = new Date(dateIn.getTime() + durationHours * 3600 * 1000 + 15 * 60 * 1000);

      const dateStr = formatInTimeZone(dateIn, TIMEZONE, 'yyyyMMdd');
      const logId = `LOG-${dateStr}-${String(logSeq++).padStart(3, '0')}`;

      const odoIn = vehicle.last_odometer - 1500 + day * 100 + i * 20;
      const odoOut = odoIn + 15 + (i % 30);

      logsToInsert.push({
        log_id: logId,
        vehicle_id: vehicle.vehicle_id,
        driver_id: driver.driver_id,
        gate: gates[(day + i) % gates.length],
        purpose: purposes[(i + day) % purposes.length],
        destination: destinations[(i * 2 + day) % destinations.length],
        time_in: formatWITA(dateIn),
        time_out: formatWITA(dateOut),
        odometer_in: odoIn,
        odometer_out: odoOut,
        status: 'OUT',
        officer_id: 'USR-002',
        notes: `Rute normal pengangkutan ${destinations[(i * 2 + day) % destinations.length]}`,
      });
    }
  }

  // Tambahkan 6 log OUT tadi pagi hari ini (Day 0)
  for (let i = 0; i < 6; i++) {
    const vIdx = (i + 4) % 16;
    const dIdx = (i + 5) % 14;
    const vehicle = seedVehicles[vIdx];
    const driver = seedDrivers[dIdx];

    const dateIn = getDayOffsetDate(0, 8 - i, 10);
    const dateOut = new Date(dateIn.getTime() + 2 * 3600 * 1000 + 20 * 60 * 1000);
    const dateStr = formatInTimeZone(dateIn, TIMEZONE, 'yyyyMMdd');
    const logId = `LOG-${dateStr}-${String(logSeq++).padStart(3, '0')}`;

    const odoIn = vehicle.last_odometer - 60 + i * 5;
    const odoOut = odoIn + 25;

    logsToInsert.push({
      log_id: logId,
      vehicle_id: vehicle.vehicle_id,
      driver_id: driver.driver_id,
      gate: gates[i % gates.length],
      purpose: purposes[i % purposes.length],
      destination: destinations[i % destinations.length],
      time_in: formatWITA(dateIn),
      time_out: formatWITA(dateOut),
      odometer_in: odoIn,
      odometer_out: odoOut,
      status: 'OUT',
      officer_id: 'USR-002',
      notes: 'Selesai shift pagi',
    });
  }

  // B. 6 Kendaraan INSIDE saat ini:
  // - 2 OVERSTAY: Masuk > 12 jam yang lalu (misal 16 jam lalu dan 26 jam lalu)
  // - 4 NORMAL INSIDE: Masuk 1-6 jam yang lalu
  // Pastikan kendaraan dan pengemudi unik dan berstatus ACTIVE!

  // Inside 1 (OVERSTAY #1): Masuk 26 jam yang lalu (kemarin)
  const overstay1DateIn = getDayOffsetDate(1, 2, 0); // ~26 jam lalu
  const logDateStr1 = formatInTimeZone(overstay1DateIn, TIMEZONE, 'yyyyMMdd');
  logsToInsert.push({
    log_id: `LOG-${logDateStr1}-${String(logSeq++).padStart(3, '0')}`,
    vehicle_id: 'VH-001', // DT-101
    driver_id: 'DR-001', // Bambang Sudiro
    gate: 'GATE_1_MAIN',
    purpose: 'HAULING',
    destination: 'Pit Barat Blok 3',
    time_in: formatWITA(overstay1DateIn),
    time_out: '',
    odometer_in: 42150,
    odometer_out: '' as unknown as number,
    status: 'INSIDE',
    officer_id: 'USR-002',
    notes: 'Perbaikan ban darurat di area pit, menunggu mekanik',
  });

  // Inside 2 (OVERSTAY #2): Masuk 16 jam yang lalu
  const overstay2DateIn = getDayOffsetDate(0, 16, 30); // 16.5 jam lalu
  const logDateStr2 = formatInTimeZone(overstay2DateIn, TIMEZONE, 'yyyyMMdd');
  logsToInsert.push({
    log_id: `LOG-${logDateStr2}-${String(logSeq++).padStart(3, '0')}`,
    vehicle_id: 'VH-009', // WT-201
    driver_id: 'DR-007', // Syamsul Bahri
    gate: 'GATE_2_PIT',
    purpose: 'OPERATIONAL',
    destination: 'Hauling Road KM 12',
    time_in: formatWITA(overstay2DateIn),
    time_out: '',
    odometer_in: 36700,
    odometer_out: '' as unknown as number,
    status: 'INSIDE',
    officer_id: 'USR-002',
    notes: 'Penyiraman debu jalan hauling shift malam lanjutan',
  });

  // Inside 3 (Normal): Masuk 5 jam yang lalu
  const inside3DateIn = getDayOffsetDate(0, 5, 15);
  const logDateStr3 = formatInTimeZone(inside3DateIn, TIMEZONE, 'yyyyMMdd');
  logsToInsert.push({
    log_id: `LOG-${logDateStr3}-${String(logSeq++).padStart(3, '0')}`,
    vehicle_id: 'VH-003', // DT-103
    driver_id: 'DR-003', // Ahmad Fauzi
    gate: 'GATE_1_MAIN',
    purpose: 'HAULING',
    destination: 'ROM Stockpile 1',
    time_in: formatWITA(inside3DateIn),
    time_out: '',
    odometer_in: 51200,
    odometer_out: '' as unknown as number,
    status: 'INSIDE',
    officer_id: 'USR-002',
    notes: 'Hauling batubara kloter 2',
  });

  // Inside 4 (Normal): Masuk 3 jam yang lalu
  const inside4DateIn = getDayOffsetDate(0, 3, 40);
  const logDateStr4 = formatInTimeZone(inside4DateIn, TIMEZONE, 'yyyyMMdd');
  logsToInsert.push({
    log_id: `LOG-${logDateStr4}-${String(logSeq++).padStart(3, '0')}`,
    vehicle_id: 'VH-012', // FT-301
    driver_id: 'DR-009', // Faisal Basri
    gate: 'GATE_2_PIT',
    purpose: 'LOGISTICS',
    destination: 'Fuel Station 2',
    time_in: formatWITA(inside4DateIn),
    time_out: '',
    odometer_in: 18450,
    odometer_out: '' as unknown as number,
    status: 'INSIDE',
    officer_id: 'USR-002',
    notes: 'Refueling excavator di lokasi tambang',
  });

  // Inside 5 (Normal): Masuk 2 jam yang lalu
  const inside5DateIn = getDayOffsetDate(0, 2, 10);
  const logDateStr5 = formatInTimeZone(inside5DateIn, TIMEZONE, 'yyyyMMdd');
  logsToInsert.push({
    log_id: `LOG-${logDateStr5}-${String(logSeq++).padStart(3, '0')}`,
    vehicle_id: 'VH-015', // BUS-401
    driver_id: 'DR-011', // Muhammad Ridwan
    gate: 'GATE_1_MAIN',
    purpose: 'OPERATIONAL',
    destination: 'Mess Karyawan Pit',
    time_in: formatWITA(inside5DateIn),
    time_out: '',
    odometer_in: 54300,
    odometer_out: '' as unknown as number,
    status: 'INSIDE',
    officer_id: 'USR-002',
    notes: 'Antar jemput operator shift 1',
  });

  // Inside 6 (Normal): Masuk 45 menit yang lalu
  const inside6DateIn = getDayOffsetDate(0, 0, 45);
  const logDateStr6 = formatInTimeZone(inside6DateIn, TIMEZONE, 'yyyyMMdd');
  logsToInsert.push({
    log_id: `LOG-${logDateStr6}-${String(logSeq++).padStart(3, '0')}`,
    vehicle_id: 'VH-017', // LV-501
    driver_id: 'DR-013', // Agus Salim
    gate: 'GATE_3_WORKSHOP',
    purpose: 'OPERATIONAL',
    destination: 'Workshop Central',
    time_in: formatWITA(inside6DateIn),
    time_out: '',
    odometer_in: 61200,
    odometer_out: '' as unknown as number,
    status: 'INSIDE',
    officer_id: 'USR-002',
    notes: 'Inspeksi K3 berkala lapangan',
  });

  let insertedLogs = 0;
  for (const log of logsToInsert) {
    if (!existingLogIds.has(log.log_id)) {
      await appendRow<GateLog>('gate_logs', log);
      existingLogIds.add(log.log_id);
      insertedLogs++;
    }
  }

  console.log(`✅ Gate Logs: ${insertedLogs} ditambahkan, ${logsToInsert.length - insertedLogs} sudah ada.`);
  invalidateSheetCache();

  console.log('========================================================');
  console.log('🎉 SEEDING SELESAI DENGAN SUKSES!');
  console.log(`Total Kendaraan: ${seedVehicles.length}`);
  console.log(`Total Pengemudi: ${seedDrivers.length}`);
  console.log(`Total Pengguna: ${seedUsers.length} (Password: Minegate#2026)`);
  console.log(`Total Gate Logs: ${logsToInsert.length} (6 INSIDE, 2 Overstay)`);
  console.log('========================================================');
}

main().catch((err) => {
  console.error('❌ Terjadi kesalahan saat seeding:', err);
  process.exit(1);
});
