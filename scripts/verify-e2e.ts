import fs from 'fs';
import path from 'path';

// Toleransi SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load .env.local
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

const BASE_URL = 'http://localhost:3000';

interface ScenarioResult {
  scenario: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

const results: ScenarioResult[] = [];

async function login(username: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: 'Minegate#2026' }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${username}: ${res.status} ${res.statusText}`);
  }
  const cookies = res.headers.get('set-cookie');
  if (!cookies) {
    throw new Error(`No set-cookie returned for ${username}`);
  }
  // Extract minegate_token
  const match = cookies.match(/minegate_token=([^;]+)/);
  if (!match) {
    throw new Error(`minegate_token not found in cookies: ${cookies}`);
  }
  return match[1];
}

async function runTests() {
  console.log('======================================================================');
  console.log('🧪 [MINEGATE] Menjalankan Pengujian End-to-End (8 Skenario Operasional)');
  console.log('======================================================================\n');

  try {
    // -----------------------------------------------------------------------
    // Skenario A: Login officer1 lalu check-in kendaraan ACTIVE
    // -----------------------------------------------------------------------
    console.log('▶️ Menguji Skenario A: Login officer1 & check-in kendaraan ACTIVE...');
    const officerToken = await login('officer1');
    const officerHeaders = {
      'Content-Type': 'application/json',
      Cookie: `minegate_token=${officerToken}`,
    };

    // Ambil data kendaraan terkini untuk mendapatkan last_odometer dinamis
    const vhRes = await fetch(`${BASE_URL}/api/vehicles`, { headers: officerHeaders });
    const vhJson = await vhRes.json();
    const vh002 = vhJson.data?.find((v: { vehicle_id: string; last_odometer: number }) => v.vehicle_id === 'VH-002');
    const currentOdo = vh002?.last_odometer || 40000;
    const testOdoIn = currentOdo + 10;
    const testOdoSmaller = testOdoIn - 5;
    const testOdoOut = testOdoIn + 30;

    // Pastikan VH-002 (DT-102) belum inside, atau check-in
    const checkinRes = await fetch(`${BASE_URL}/api/gate/checkin`, {
      method: 'POST',
      headers: officerHeaders,
      body: JSON.stringify({
        vehicle_id: 'VH-002',
        driver_id: 'DR-002',
        gate: 'GATE_1_MAIN',
        purpose: 'HAULING',
        destination: 'Pit Utara Front A',
        odometer_in: testOdoIn,
        notes: 'Uji Skenario A E2E',
      }),
    });

    const checkinJson = await checkinRes.json();
    let scenarioAPassed = false;
    let scenarioAMsg = '';

    if (checkinRes.status === 201 && checkinJson.success) {
      // Verifikasi bahwa unit muncul di daftar INSIDE
      const insideRes = await fetch(`${BASE_URL}/api/gate/inside`, {
        headers: officerHeaders,
      });
      const insideJson = await insideRes.json();
      const isInside = insideJson.data?.some((i: { vehicle_id: string }) => i.vehicle_id === 'VH-002');
      if (isInside) {
        scenarioAPassed = true;
        scenarioAMsg = `Sukses check-in VH-002 (Log ID: ${checkinJson.data.log_id}) dan muncul di daftar INSIDE.`;
      } else {
        scenarioAMsg = 'Check-in berstatus 201 namun tidak ditemukan di /api/gate/inside.';
      }
    } else {
      scenarioAMsg = `Gagal check-in: ${checkinRes.status} ${JSON.stringify(checkinJson.error)}`;
    }

    results.push({ scenario: 'a. Check-in kendaraan ACTIVE oleh officer1', passed: scenarioAPassed, message: scenarioAMsg });
    console.log(scenarioAPassed ? `✅ LULUS: ${scenarioAMsg}` : `❌ GAGAL: ${scenarioAMsg}`);

    // -----------------------------------------------------------------------
    // Skenario B: Check-in kendaraan yang sama lagi -> Ditolak (409 Conflict)
    // -----------------------------------------------------------------------
    console.log('\n▶️ Menguji Skenario B: Check-in kendaraan yang sama lagi (Anti-Duplicate)...');
    const duplicateRes = await fetch(`${BASE_URL}/api/gate/checkin`, {
      method: 'POST',
      headers: officerHeaders,
      body: JSON.stringify({
        vehicle_id: 'VH-002',
        driver_id: 'DR-004',
        gate: 'GATE_1_MAIN',
        purpose: 'HAULING',
        destination: 'ROM Stockpile',
        odometer_in: 39910,
      }),
    });
    const dupJson = await duplicateRes.json();
    const scenarioBPassed = duplicateRes.status === 409 && dupJson.error?.code === 'CONFLICT';
    const scenarioBMsg = scenarioBPassed
      ? `Ditolak dengan kode 409 Conflict: "${dupJson.error.message}"`
      : `Respons tidak sesuai ekspektasi 409. Status: ${duplicateRes.status}`;

    results.push({ scenario: 'b. Check-in kendaraan yang sama lagi (Anti-Duplicate)', passed: scenarioBPassed, message: scenarioBMsg });
    console.log(scenarioBPassed ? `✅ LULUS: ${scenarioBMsg}` : `❌ GAGAL: ${scenarioBMsg}`);

    // -----------------------------------------------------------------------
    // Skenario C: Check-in kendaraan status MAINTENANCE -> Ditolak (422)
    // -----------------------------------------------------------------------
    console.log('\n▶️ Menguji Skenario C: Check-in kendaraan status MAINTENANCE (K3 Filter)...');
    const maintRes = await fetch(`${BASE_URL}/api/gate/checkin`, {
      method: 'POST',
      headers: officerHeaders,
      body: JSON.stringify({
        vehicle_id: 'VH-007', // Unit DT-107 status MAINTENANCE
        driver_id: 'DR-005',
        gate: 'GATE_1_MAIN',
        purpose: 'HAULING',
        destination: 'Pit Front A',
        odometer_in: 64250,
      }),
    });
    const maintJson = await maintRes.json();
    const scenarioCPassed = maintRes.status === 422 && maintJson.error?.message?.includes('MAINTENANCE');
    const scenarioCMsg = scenarioCPassed
      ? `Ditolak dengan kode 422 Unprocessable: "${maintJson.error.message}"`
      : `Respons tidak sesuai ekspektasi 422. Status: ${maintRes.status}`;

    results.push({ scenario: 'c. Check-in kendaraan MAINTENANCE ditolak', passed: scenarioCPassed, message: scenarioCMsg });
    console.log(scenarioCPassed ? `✅ LULUS: ${scenarioCMsg}` : `❌ GAGAL: ${scenarioCMsg}`);

    // -----------------------------------------------------------------------
    // Skenario D: Check-out dengan odometer lebih kecil dari odometer masuk
    // -----------------------------------------------------------------------
    console.log('\n▶️ Menguji Skenario D: Check-out dengan odometer lebih kecil (Regresi Odometer)...');
    const odoRes = await fetch(`${BASE_URL}/api/gate/checkout`, {
      method: 'POST',
      headers: officerHeaders,
      body: JSON.stringify({
        vehicle_id: 'VH-002',
        odometer_out: testOdoSmaller, // Lebih kecil dari odometer masuk testOdoIn
      }),
    });
    const odoJson = await odoRes.json();
    const scenarioDPassed = odoRes.status === 422 && odoJson.error?.message?.includes('tidak boleh lebih kecil');
    const scenarioDMsg = scenarioDPassed
      ? `Ditolak dengan kode 422 Unprocessable: "${odoJson.error.message}"`
      : `Respons tidak sesuai ekspektasi 422. Status: ${odoRes.status}`;

    results.push({ scenario: 'd. Check-out odometer mundur ditolak', passed: scenarioDPassed, message: scenarioDMsg });
    console.log(scenarioDPassed ? `✅ LULUS: ${scenarioDMsg}` : `❌ GAGAL: ${scenarioDMsg}`);

    // -----------------------------------------------------------------------
    // Skenario E: Check-out normal -> status OUT & last_odometer ter-update
    // -----------------------------------------------------------------------
    console.log('\n▶️ Menguji Skenario E: Check-out normal & update last_odometer...');
    const checkoutRes = await fetch(`${BASE_URL}/api/gate/checkout`, {
      method: 'POST',
      headers: officerHeaders,
      body: JSON.stringify({
        vehicle_id: 'VH-002',
        odometer_out: testOdoOut,
        notes: 'Muatan aman dan lengkap',
      }),
    });
    const checkoutJson = await checkoutRes.json();
    let scenarioEPassed = false;
    let scenarioEMsg = '';

    if (checkoutRes.status === 200 && checkoutJson.data?.status === 'OUT') {
      // Verifikasi odometer kendaraan ter-update
      const vehicleRes = await fetch(`${BASE_URL}/api/vehicles/VH-002`, {
        headers: officerHeaders,
      });
      const vJson = await vehicleRes.json();
      if (vJson.data?.last_odometer === testOdoOut) {
        scenarioEPassed = true;
        scenarioEMsg = `Check-out sukses, status berubah OUT, time_out terisi, dan last_odometer VH-002 berhasil diperbarui menjadi ${vJson.data.last_odometer} km.`;
      } else {
        scenarioEMsg = `Check-out berhasil namun last_odometer adalah ${vJson.data?.last_odometer} (diharapkan ${testOdoOut}).`;
      }
    } else {
      scenarioEMsg = `Gagal check-out: ${checkoutRes.status} ${JSON.stringify(checkoutJson.error)}`;
    }

    results.push({ scenario: 'e. Check-out normal & update last_odometer', passed: scenarioEPassed, message: scenarioEMsg });
    console.log(scenarioEPassed ? `✅ LULUS: ${scenarioEMsg}` : `❌ GAGAL: ${scenarioEMsg}`);

    // -----------------------------------------------------------------------
    // Skenario F: Login supervisor1 & validasi ringkasan dashboard (termasuk overstay)
    // -----------------------------------------------------------------------
    console.log('\n▶️ Menguji Skenario F: Login supervisor1 & verifikasi data Dashboard...');
    const spvToken = await login('supervisor1');
    const spvHeaders = {
      'Content-Type': 'application/json',
      Cookie: `minegate_token=${spvToken}`,
    };

    const summaryRes = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: spvHeaders,
    });
    const summaryJson = await summaryRes.json();
    let scenarioFPassed = false;
    let scenarioFMsg = '';

    if (summaryRes.status === 200 && summaryJson.success) {
      const { vehicles_inside_count, overstay_list, today_checkin_count, today_checkout_count } = summaryJson.data;
      if (
        typeof vehicles_inside_count === 'number' &&
        Array.isArray(overstay_list) &&
        overstay_list.length >= 1 &&
        today_checkin_count > 0 &&
        today_checkout_count > 0
      ) {
        scenarioFPassed = true;
        scenarioFMsg = `Dashboard menampilkan ${vehicles_inside_count} unit di dalam, ${overstay_list.length} unit overstay (>12 jam), ${today_checkin_count} masuk hari ini, dan ${today_checkout_count} keluar hari ini.`;
      } else {
        scenarioFMsg = `Angka dashboard tidak konsisten: inside=${vehicles_inside_count}, overstay=${overstay_list?.length}`;
      }
    } else {
      scenarioFMsg = `Gagal mengambil summary: ${summaryRes.status} ${JSON.stringify(summaryJson.error)}`;
    }

    results.push({ scenario: 'f. Dashboard supervisor konsisten & overstay valid', passed: scenarioFPassed, message: scenarioFMsg });
    console.log(scenarioFPassed ? `✅ LULUS: ${scenarioFMsg}` : `❌ GAGAL: ${scenarioFMsg}`);

    // -----------------------------------------------------------------------
    // Skenario G: Export CSV terbuka dengan benar di Excel (UTF-8 BOM)
    // -----------------------------------------------------------------------
    console.log('\n▶️ Menguji Skenario G: Ekspor CSV dengan UTF-8 BOM untuk Excel...');
    const exportRes = await fetch(`${BASE_URL}/api/reports/export`, {
      headers: spvHeaders,
    });
    let scenarioGPassed = false;
    let scenarioGMsg = '';

    if (exportRes.status === 200) {
      const buffer = await exportRes.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // UTF-8 BOM bytes: EF BB BF
      const hasBom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
      const text = new TextDecoder().decode(bytes);
      const hasHeader = text.includes('ID Log') && text.includes('ID Kendaraan') && text.includes('Nomor Plat');

      if (hasBom && hasHeader) {
        scenarioGPassed = true;
        scenarioGMsg = `File CSV valid dengan UTF-8 BOM (0xEF, 0xBB, 0xBF) dan header kolom lengkap (${bytes.length} bytes).`;
      } else {
        scenarioGMsg = `File CSV tidak valid: hasBom=${hasBom}, hasHeader=${hasHeader}`;
      }
    } else {
      scenarioGMsg = `Gagal ekspor: ${exportRes.status} ${exportRes.statusText}`;
    }

    results.push({ scenario: 'g. Ekspor CSV UTF-8 BOM kompatibel Excel', passed: scenarioGPassed, message: scenarioGMsg });
    console.log(scenarioGPassed ? `✅ LULUS: ${scenarioGMsg}` : `❌ GAGAL: ${scenarioGMsg}`);

    // -----------------------------------------------------------------------
    // Skenario H: OFFICER tidak bisa membuka /dashboard dan /users
    // -----------------------------------------------------------------------
    console.log('\n▶️ Menguji Skenario H: Guard Role OFFICER dilarang ke /dashboard & /users...');

    // 1. Cek API /api/dashboard/summary oleh officer -> 403 Forbidden
    const offSummaryRes = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: officerHeaders,
    });
    const offSummaryJson = await offSummaryRes.json();
    const apiDashboardBlocked = offSummaryRes.status === 403;

    // 2. Cek API /api/users oleh officer -> 403 Forbidden
    const offUsersRes = await fetch(`${BASE_URL}/api/users`, {
      headers: officerHeaders,
    });
    const offUsersJson = await offUsersRes.json();
    const apiUsersBlocked = offUsersRes.status === 403;

    // 3. Cek page redirect di middleware
    const pageDashboardRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: `minegate_token=${officerToken}` },
      redirect: 'manual',
    });
    const pageDashboardRedirect =
      pageDashboardRes.status === 307 ||
      pageDashboardRes.status === 302 ||
      Boolean(pageDashboardRes.headers.get('location')?.includes('/gate'));

    const pageUsersRes = await fetch(`${BASE_URL}/users`, {
      headers: { Cookie: `minegate_token=${officerToken}` },
      redirect: 'manual',
    });
    const pageUsersRedirect =
      pageUsersRes.status === 307 ||
      pageUsersRes.status === 302 ||
      Boolean(pageUsersRes.headers.get('location')?.includes('/gate'));

    const scenarioHPassed = Boolean(
      apiDashboardBlocked && apiUsersBlocked && pageDashboardRedirect && pageUsersRedirect
    );

    const scenarioHMsg = scenarioHPassed
      ? `Role guard berhasil: API ditolak dengan 403 Forbidden, dan akses halaman /dashboard & /users di-redirect ke /gate.`
      : `Guard gagal: apiDash=${apiDashboardBlocked}, apiUsers=${apiUsersBlocked}, pageDash=${pageDashboardRedirect}, pageUsers=${pageUsersRedirect}`;

    results.push({ scenario: 'h. Guard Role OFFICER dilarang ke /dashboard & /users', passed: scenarioHPassed, message: scenarioHMsg });
    console.log(scenarioHPassed ? `✅ LULUS: ${scenarioHMsg}` : `❌ GAGAL: ${scenarioHMsg}`);

    // -----------------------------------------------------------------------
    // Rekapitulasi Akhir
    // -----------------------------------------------------------------------
    console.log('\n======================================================================');
    console.log('📊 REKAPITULASI HASIL PENGUJIAN END-TO-END');
    console.log('======================================================================');
    const allPassed = results.every((r) => r.passed);
    results.forEach((r, idx) => {
      console.log(`${idx + 1}. [${r.passed ? 'LULUS' : 'GAGAL'}] ${r.scenario}`);
      console.log(`   Detail: ${r.message}`);
    });
    console.log('======================================================================');
    console.log(allPassed ? '🎉 SEMUA 8 SKENARIO LULUS 100%!' : '⚠️ ADA SKENARIO YANG GAGAL');
    console.log('======================================================================\n');
  } catch (err) {
    console.error('Fatal error during E2E verification:', err);
    process.exit(1);
  }
}

runTests();
