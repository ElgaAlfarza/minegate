@echo off
title MINEGATE - Mining Vehicle Gate Management System
color 0B
cd /d "%~dp0"

cls
echo ======================================================================
echo          MINEGATE - MINING VEHICLE GATE MANAGEMENT SYSTEM
echo       Sistem Kontrol Keluar Masuk Kendaraan Area Tambang
echo ======================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Node.js tidak ditemukan di komputer ini!
    echo Harap download dan install Node.js dari https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist ".env.local" (
    if exist ".env.example" (
        echo [INFO] Menyiapkan .env.local dari .env.example...
        copy ".env.example" ".env.local" >nul
        echo [INFO] File .env.local berhasil dibuat.
    )
)

if not exist "node_modules" (
    echo [INFO] Dependensi belum terpasang. Menjalankan npm install...
    call npm install
    if %ERRORLEVEL% neq 0 (
        color 0C
        echo [ERROR] Gagal menginstall dependensi!
        echo.
        pause
        exit /b 1
    )
)

if exist ".next\server\middleware-manifest.json" (
    echo [INFO] Merapikan cache .next untuk development...
    rmdir /s /q ".next" 2>nul
)

set APP_PORT=3000
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set APP_PORT=3001
)

echo.
echo [STATUS] Membuka browser ke http://localhost:%APP_PORT% ...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:%APP_PORT%"

echo [STATUS] Menjalankan Next.js Development Server (port %APP_PORT%)...
echo.
echo ======================================================================
echo * Server aktif di: http://localhost:%APP_PORT%
echo * Untuk menghentikan server, tekan tombol CTRL + C lalu ketik Y
echo ======================================================================
echo.

if "%APP_PORT%"=="3001" (
    call npx next dev -p 3001
) else (
    call npm run dev
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo Server terhenti atau terjadi kesalahan.
    pause
)
