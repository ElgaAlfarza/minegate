# Dokumentasi Alur Operasional & ERD MINEGATE

Dokumen ini memuat diagram alur proses bisnis gerbang tambang (*check-in* & *check-out*), diagram entitas relasi (*ERD*), dan mesin status operasional pada sistem **MINEGATE**.

---

## 1. Alur Check-In Kendaraan (Sequence Diagram)

Diagram berikut menjelaskan verifikasi K3 dan validasi anti-duplikasi saat kendaraan tiba di gerbang masuk.

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Petugas Gate (OFFICER)
    participant UI as Antarmuka Web (/gate)
    participant API as Gate API (/api/gate/checkin)
    participant Service as GateService
    participant Lock as Sheets Mutex Lock
    participant Sheet as Google Sheets (Dual-Mode)

    Officer->>UI: Input Vehicle ID/Plat, Driver, Odometer Masuk, Gate, Keperluan
    UI->>API: POST /api/gate/checkin
    API->>Service: checkIn(input)
    Service->>Lock: withSheetsLock(fn)
    activate Lock

    Lock->>Sheet: Ambil status kendaraan (vehicles)
    alt Kendaraan MAINTENANCE atau INACTIVE
        Sheet-->>Service: status != ACTIVE
        Service-->>API: Throw AppError 422 (Ditolak Aturan K3)
        API-->>UI: 422 Unprocessable Entity
        UI-->>Officer: Tampilkan peringatan: Kendaraan dilarang beroperasi
    end

    Lock->>Sheet: Ambil status sopir (drivers)
    alt Sopir INACTIVE
        Sheet-->>Service: status == INACTIVE
        Service-->>API: Throw AppError 422 (Sopir Nonaktif)
        API-->>UI: 422 Unprocessable Entity
        UI-->>Officer: Tampilkan peringatan: Sopir dilarang masuk
    end

    Lock->>Sheet: Periksa log aktif (gate_logs status INSIDE)
    alt Kendaraan sudah berstatus INSIDE
        Sheet-->>Service: activeLog ditemukan
        Service-->>API: Throw AppError 409 (Anti-Duplicate)
        API-->>UI: 409 Conflict
        UI-->>Officer: Tampilkan peringatan: Kendaraan masih berada di dalam pit
    end

    Lock->>Sheet: Periksa Odometer Masuk vs Odometer Terakhir
    alt Odometer Masuk < Last Odometer
        Service-->>API: Throw AppError 422 (Regresi Odometer)
        API-->>UI: 422 Unprocessable Entity
        UI-->>Officer: Tampilkan peringatan: Nilai odometer tidak logis
    end

    Note over Lock,Sheet: Validasi Lolos - Generate Log ID urut harian
    Lock->>Sheet: appendRow('gate_logs', newLog [status: INSIDE])
    Sheet-->>Lock: Baris tersimpan
    deactivate Lock

    Service-->>API: GateLog terbuat
    API-->>UI: 201 Created (Log ID: LOG-YYYYMMDD-XXX)
    UI-->>Officer: Tampilkan notifikasi sukses & unit muncul di tabel INSIDE
```

---

## 2. Alur Check-Out Kendaraan (Sequence Diagram)

Diagram berikut menjelaskan verifikasi pelepasan muatan, validasi odometer keluar, serta pembaruan odometer kendaraan pada Google Sheets.

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Petugas Gate (OFFICER)
    participant UI as Antarmuka Web (/gate)
    participant API as Gate API (/api/gate/checkout)
    participant Service as GateService
    participant Lock as Sheets Mutex Lock
    participant Sheet as Google Sheets (Dual-Mode)

    Officer->>UI: Klik Checkout pada unit di tabel INSIDE, isi Odometer Keluar & Catatan
    UI->>API: POST /api/gate/checkout
    API->>Service: checkOut(input)
    Service->>Lock: withSheetsLock(fn)
    activate Lock

    Lock->>Sheet: Ambil log aktif kendaraan (gate_logs status INSIDE)
    alt Log INSIDE tidak ditemukan
        Sheet-->>Service: null
        Service-->>API: Throw AppError 409 Conflict
        API-->>UI: 409 Conflict
        UI-->>Officer: Error: Kendaraan tidak terdaftar sedang di dalam pit
    end

    Lock->>Sheet: Validasi Odometer Keluar vs Odometer Masuk
    alt Odometer Keluar < Odometer Masuk
        Service-->>API: Throw AppError 422 Unprocessable Entity
        API-->>UI: 422 Unprocessable
        UI-->>Officer: Error: Odometer keluar tidak boleh lebih kecil dari masuk
    end

    Note over Lock,Sheet: Validasi Lolos - Update Log & Update Master Kendaraan
    Lock->>Sheet: updateRowById('gate_logs', log_id, { status: 'OUT', time_out, odometer_out })
    Lock->>Sheet: updateRowById('vehicles', vehicle_id, { last_odometer: odometer_out })
    Sheet-->>Lock: Pembaruan berhasil
    deactivate Lock

    Service-->>API: Log updated
    API-->>UI: 200 OK (Status OUT)
    UI-->>Officer: Konfirmasi sukses, unit dihapus dari daftar INSIDE
```

---

## 3. Entity Relationship Diagram (ERD) Google Sheets

Meskipun disimpan di dalam Google Sheets tanpa *foreign key constraints* di tingkat basis data, relasi logis antar tab dipelihara secara ketat oleh *Repository Layer* dan *Service Layer*.

```mermaid
erDiagram
    VEHICLES ||--o{ GATE_LOGS : "dicatat_dalam"
    DRIVERS ||--o{ GATE_LOGS : "mengemudikan"
    USERS ||--o{ GATE_LOGS : "disahkan_oleh"

    VEHICLES {
        string vehicle_id PK "Format: VH-001"
        string plate_number "Nomor polisi unik (e.g. EA 8101 BA)"
        string unit_code "Kode lambung unik (e.g. DT-101)"
        string type "DUMP_TRUCK | WATER_TRUCK | FUEL_TRUCK | BUS | LIGHT_VEHICLE | EXCAVATOR_SUPPORT"
        string brand "Merk kendaraan (e.g. Scania, Volvo)"
        string model "Model tipe unit"
        number year "Tahun produksi"
        string status "ACTIVE | MAINTENANCE | INACTIVE"
        number last_odometer "Odometer terkini (km)"
        string notes "Catatan mekanik / operasional"
        string created_at "ISO 8601 WITA"
        string updated_at "ISO 8601 WITA"
    }

    DRIVERS {
        string driver_id PK "Format: DR-001"
        string name "Nama lengkap pengemudi"
        string sim_number "Nomor SIM BII Umum / Polisi"
        string sim_type "SIM BII UMUM | SIM A | dsb"
        string sim_expiry "Masa berlaku (YYYY-MM-DD)"
        string company "Perusahaan vendor/internal"
        string phone "Nomor telepon aktif"
        string status "ACTIVE | INACTIVE"
        string created_at "ISO 8601 WITA"
        string updated_at "ISO 8601 WITA"
    }

    GATE_LOGS {
        string log_id PK "Format: LOG-YYYYMMDD-001 (Urut harian)"
        string vehicle_id FK "Relasi ke VEHICLES.vehicle_id"
        string driver_id FK "Relasi ke DRIVERS.driver_id"
        string gate "GATE_1_MAIN | GATE_2_PIT | GATE_3_WORKSHOP"
        string purpose "HAULING | OPERATIONAL | MAINTENANCE | LOGISTICS | OTHER"
        string destination "Lokasi tujuan di pit/stockpile"
        string time_in "ISO 8601 WITA waktu masuk"
        string time_out "ISO 8601 WITA waktu keluar (kosong jika INSIDE)"
        number odometer_in "Odometer saat check-in (km)"
        number odometer_out "Odometer saat check-out (km)"
        string status "INSIDE | OUT"
        string officer_id FK "Relasi ke USERS.user_id"
        string notes "Catatan muatan / kendala"
    }

    USERS {
        string user_id PK "Format: USR-001"
        string username "Username unik login"
        string password_hash "Bcrypt hash salt 10"
        string name "Nama personil gate/supervisor"
        string role "ADMIN | SUPERVISOR | OFFICER"
        string status "ACTIVE | INACTIVE"
        string created_at "ISO 8601 WITA"
        string updated_at "ISO 8601 WITA"
    }
```

---

## 4. Siklus Hidup Status Kendaraan & Log Operasional

```mermaid
stateDiagram-v2
    [*] --> OUTSIDE : Kendaraan berada di luar konsesi

    state OUTSIDE {
        [*] --> SiapMasuk
    }

    OUTSIDE --> INSIDE : Check-In Berhasil\n(Aturan 1, 3, 4, 5 Lolos)
    
    state INSIDE {
        [*] --> OperasiNormal : Durasi <= 12 Jam
        OperasiNormal --> Overstay : Durasi > 12 Jam (Aturan 7)\n(Peringatan Dashboard SPV)
    }

    INSIDE --> OUTSIDE : Check-Out Berhasil\n(Odometer Keluar >= Masuk)\nUpdate last_odometer
```
