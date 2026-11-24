# Arsitektur Sistem Backend MINEGATE

MINEGATE (Mining Vehicle Gate Management System) adalah sistem pencatatan keluar-masuk kendaraan di gate area operasional tambang dengan **Google Sheets API v4** sebagai satu-satunya media penyimpanan data persistence (tanpa database SQL/NoSQL lain dan tanpa IoT).

---

## 1. Diagram Lapisan Arsitektur (Layered Architecture)

```text
+-----------------------------------------------------------------------------------+
|                                 CLIENT / FRONTEND                                 |
|            Web UI Routes: /login, /dashboard, /gate, /vehicles, /drivers,         |
|                           /logs, /users (Placeholder di Tahap Ini)               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                           NEXT.JS MIDDLEWARE (Edge Runtime)                       |
|  - Verifikasi JWT cookie (minegate_token) via jose                                |
|  - Proteksi rute web dan API berdasarkan sesi login & Role (ADMIN, SPV, OFFICER)  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                ROUTE HANDLERS (API)                               |
|  - /api/auth/* (login, logout, me)                                                |
|  - /api/vehicles/*, /api/drivers/*, /api/users/*                                  |
|  - /api/gate/* (checkin, checkout, inside)                                        |
|  - /api/logs/*, /api/dashboard/summary, /api/reports/export                       |
|  - Format respons terstandarisasi: { success: boolean, data?, error? }            |
|  - Penanganan error terpusat via AppError & handleApiError                        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                   SERVICES LAYER                                  |
|  - gateService: Menegakkan 7 Aturan Bisnis check-in, check-out, overstay          |
|  - dashboardService: Agregasi metrik KPI harian, grafik jam & tren 7 hari        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                 REPOSITORIES LAYER                                |
|  - vehicleRepo: CRUD kendaraan, format ID (VH-001), update odometer               |
|  - driverRepo: CRUD pengemudi, format ID (DR-001), soft delete                    |
|  - logRepo: Pencatatan log, format urut harian (LOG-YYYYMMDD-001)                 |
|  - userRepo: Akun pengguna, format ID (USR-001), enkripsi bcrypt                  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        GOOGLE SHEETS GATEWAY (lib/sheets.ts)                      |
|  * SATU-SATUNYA file yang berinteraksi langsung dengan Google Sheets API v4 *     |
|  - In-Memory Mutex Lock: Mengunci penulisan agar check-in concurrent tidak crash |
|  - In-Memory Cache: TTL 10 detik per tab, otomatis invalidate saat ada penulisan |
|  - Retry Exponential Backoff: Maks 3x untuk error rate limit (429) & server (5xx) |
|  - ensureHeaders, getRows, appendRow, updateRowById                               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        GOOGLE SHEETS SPREADSHEET (PERSISTENCE)                    |
|  Tab 1: vehicles  |  Tab 2: drivers  |  Tab 3: gate_logs  |  Tab 4: users        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Skema Tab Google Sheets

Semua header baris 1 persis sesuai spesifikasi teknis berikut:

| Tab | Header Kolom (Baris 1) | Tipe Data & Format |
|---|---|---|
| **vehicles** | `vehicle_id \| unit_code \| plate_number \| type \| brand_model \| owner_company \| status \| last_odometer \| created_at` | ID: `VH-001`<br>Status: `ACTIVE`, `MAINTENANCE`, `INACTIVE`<br>Type: `DUMP_TRUCK`, `WATER_TRUCK`, `FUEL_TRUCK`, `BUS`, `LIGHT_VEHICLE`, `EXCAVATOR_SUPPORT` |
| **drivers** | `driver_id \| name \| license_type \| company \| phone \| status \| created_at` | ID: `DR-001`<br>Status: `ACTIVE`, `INACTIVE` |
| **gate_logs** | `log_id \| vehicle_id \| driver_id \| gate \| purpose \| destination \| time_in \| time_out \| odometer_in \| odometer_out \| status \| officer_id \| notes` | ID: `LOG-YYYYMMDD-001`<br>Status: `INSIDE`, `OUT`<br>Gate: `GATE_1_MAIN`, `GATE_2_PIT`, `GATE_3_WORKSHOP`<br>Purpose: `HAULING`, `OPERATIONAL`, `MAINTENANCE`, `LOGISTICS`, `OTHER` |
| **users** | `user_id \| name \| username \| password_hash \| role \| status \| created_at` | ID: `USR-001`<br>Role: `ADMIN`, `OFFICER`, `SUPERVISOR`<br>Status: `ACTIVE`, `INACTIVE` |

*Semua timestamp disimpan dalam format ISO 8601 dengan offset zona WITA (+08:00, Asia/Makassar).*

---

## 3. Penegakan 7 Aturan Bisnis (gateService)

1. **Anti-Duplicate Inside (409 Conflict)**: Kendaraan dengan log berstatus `INSIDE` dilarang melakukan check-in ulang sebelum melakukan check-out.
2. **Valid Check-out Only (409 Conflict)**: Check-out hanya dapat dilakukan pada kendaraan yang riwayat aktifnya berstatus `INSIDE`.
3. **K3 Vehicle Maintenance Filter (422 Unprocessable)**: Kendaraan berstatus `MAINTENANCE` atau `INACTIVE` langsung ditolak saat mencoba check-in.
4. **Driver Eligibility & Single Assignment (422 / 409)**: Pengemudi berstatus `INACTIVE` ditolak (422). Pengemudi yang sudah aktif di kendaraan lain berstatus `INSIDE` tidak boleh check-in di kendaraan kedua (409).
5. **Odometer Progression Validation (422 Unprocessable)**: `odometer_in` tidak boleh lebih kecil dari `last_odometer` kendaraan. `odometer_out` tidak boleh lebih kecil dari `odometer_in`.
6. **Atomic Checkout Completion**: Saat check-out berhasil, sistem mengisi `time_out`, `odometer_out`, mengubah log menjadi `OUT`, dan memperbarui `last_odometer` di tab `vehicles`.
7. **Dynamic Overstay Calculation**: Status `is_overstay` dihitung secara dinamis saat query (`durasi > OVERSTAY_HOURS`, default 12 jam) dan tidak disimpan sebagai kolom statis.

---

## 4. Keamanan, Mutex, dan Caching

- **In-Memory Mutex Lock**: Mencegah race condition ketika dua petugas melakukan check-in atau check-out kendaraan yang sama dalam milidetik yang bersamaan. Status selalu diverifikasi ulang (`bypassCache: true`) tepat sebelum transaksi ditulis.
- **Cache In-Memory TTL 10 Detik**: Mengurangi beban request read ke Google Sheets API v4 agar tidak melampaui kuota read per menit, dan langsung di-invalidate seketika operasi penulisan (`appendRow` / `updateRowById`) terjadi.
- **JWT & Role Guards**: Token ditandatangani menggunakan kunci minimum 32 karakter dan disimpan dalam cookie `httpOnly`, `secure` (production), `sameSite=lax`, berlaku 8 jam.
