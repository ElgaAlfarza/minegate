# Product Requirements Document (PRD) — MineGate
**Sistem Terpadu Kontrol Gerbang & Monitoring Operasional Tambang**

## 1. Latar Belakang & Filosofi Sistem
Operasional pertambangan terbuka (*open-pit mining*) membutuhkan pencatatan arus keluar-masuk kendaraan secara disiplin, cepat, dan akurat. Sistem ini dirancang untuk **pencatatan manual oleh petugas gate** tanpa ketergantungan pada sensor IoT, ANPR otomatis, atau loop detector yang rentan terhadap debu tambang, lumpur, dan getaran ekstrem.

Dengan antarmuka yang dirancang khusus (*industrial command aesthetic*), petugas pos gerbang dapat:
1. Memverifikasi fisik identitas kendaraan dan nomor plat.
2. Memeriksa masa berlaku izin mengemudi tambang (SIMPER) pengemudi secara langsung.
3. Mencatat angka odometer dan rute pit secara cepat (di bawah 15 detik).
4. Memvalidasi kargo muatan batubara atau kondisi kosongan.

## 2. Aktor & Peran (User Roles)
1. **Operator Barrier (Petugas Pos Gate)**:
   - Melakukan pemeriksaan fisik kendaraan di pos barrier.
   - Menginput data check-in kedatangan dan check-out kepulangan.
   - Membuka barrier gate secara manual/tombol setelah verifikasi lengkap.
   - Mencetak tiket gate pass resmi untuk dibawa pengemudi.
2. **Supervisor Operasional Pit (SPV Operasional)**:
   - Memantau halaman **Dashboard Operasional** secara berkala.
   - Mengawasi unit yang berada di dalam pit dan menindaklanjuti peringatan unit *overstay* (>8 jam).
   - Berkoordinasi via radio VHF dengan marshall dan tim K3 keselamatan kerja pit.

## 3. Fitur Utama & Kebutuhan Fungsional

### A. Dashboard Operasional
- **4 Kartu Metrik Operasional Utama**:
  - **Di Dalam Area**: Jumlah unit yang saat ini aktif di dalam pit.
  - **Masuk Hari Ini**: Total ritase masuk terhadap target harian.
  - **Keluar Hari Ini**: Total ritase keluar yang telah menyelesaikan inspeksi.
  - **Overstay Kritis (>8 Jam)**: Unit yang belum keluar melebihi batas waktu shift kerja.
- **3 Visualisasi Grafik**:
  - Grafik Batang: Volume lalu lintas kendaraan per jam (06:00 - 14:00 WITA).
  - Grafik Donat: Komposisi armada aktif (Dump Truck 55%, Fuel Truck 20%, Light Vehicle 15%, Water Tank 10%).
  - Grafik Garis: Tren ritase harian selama 7 hari berjalan.
- **Roster Kendaraan Aktif**: Tabel interaktif berstandar aksesibilitas tinggi dengan filter cepat (Semua, Overstay, Dump Truck, Light Vehicle).
- **Aktivitas Terbaru Gate**: Catatan berurutan transaksi pos gerbang terkini.

### B. Gate Operasional (Check-In & Check-Out)
- **Stasiun Multi-Gate**: Gate 1 (Utama Pit), Gate 2 (Hauling West), Gate 3 (Workshop & ROM).
- **Check-In Alur Masuk**:
  - Pencarian cepat plat nomor dan kode unit.
  - Pemeriksaan otomatis status unit: Unit berstatus `MAINTENANCE` otomatis dicekal (*Hard Blocker K3*) sehingga petugas dilarang memberikan akses masuk.
  - Pemilihan data pengemudi dan verifikasi SIMPER.
  - Penginputan odometer masuk dan catatan muatan/surat jalan.
- **Check-Out Alur Keluar**:
  - Daftar visual kendaraan yang sedang berada di dalam pit.
  - Penginputan odometer keluar dan kalkulasi otomatis jarak tempuh (*Trip Math*).
  - Pilihan kondisi muatan (Kosongan vs Bermuatan Penuh) serta checklist pemeriksaan bak & kabin.
  - Cetak tiket gate pass fisik.

### C. Manajemen Data Master
- **Data Kendaraan**: 20 armada terdaftar (Dump Truck, Fuel Truck, Water Tank, Light Vehicle 4x4, Alat Berat).
- **Data Sopir**: 15 pengemudi dengan verifikasi nomor dan masa berlaku SIMPER K3.
- **Riwayat Log**: Sekitar 60 log transaksi operasional (6 unit di dalam pit, 2 di antaranya overstay).

## 4. Skema Integrasi Google Sheets
Semua data dihubungkan melalui lapisan data `src/lib/data/` dan skema `src/lib/mock/` dengan nama field persis sesuai kolom tab Google Sheets:
- `vehicles`: `vehicle_id`, `unit_code`, `plate_number`, `type`, `brand_model`, `owner_company`, `status`, `last_odometer`, `created_at`
- `drivers`: `driver_id`, `name`, `simper_number`, `simper_expiry`, `company`, `phone`, `status`, `created_at`
- `gate_logs`: `log_id`, `log_number`, `vehicle_id`, `unit_code`, `plate_number`, `vehicle_type`, `driver_id`, `driver_name`, `company`, `gate_in`, `time_in`, `odometer_in`, `purpose`, `specific_location`, `notes_in`, `gate_out`, `time_out`, `odometer_out`, `trip_distance`, `cargo_condition_out`, `status`, `officer_in`, `officer_out`, `created_at`
- `users`: `user_id`, `username`, `password_hash`, `full_name`, `role`, `gate_post`, `shift`, `status`, `created_at`
