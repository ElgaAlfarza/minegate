import { google } from 'googleapis';
import { AppError } from './errors';

// Izinkan fetch ke Google Apps Script pada lingkungan Windows dengan sertifikat interceptor
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export const SHEET_HEADERS = {
  vehicles: [
    'vehicle_id',
    'unit_code',
    'plate_number',
    'type',
    'brand_model',
    'owner_company',
    'status',
    'last_odometer',
    'created_at',
  ],
  drivers: [
    'driver_id',
    'name',
    'license_type',
    'company',
    'phone',
    'status',
    'created_at',
  ],
  gate_logs: [
    'log_id',
    'vehicle_id',
    'driver_id',
    'gate',
    'purpose',
    'destination',
    'time_in',
    'time_out',
    'odometer_in',
    'odometer_out',
    'status',
    'officer_id',
    'notes',
  ],
  users: [
    'user_id',
    'name',
    'username',
    'password_hash',
    'role',
    'status',
    'created_at',
  ],
} as const;

export type SheetName = keyof typeof SHEET_HEADERS;

// Cache In-Memory: TTL 10 detik per tab
interface CacheEntry<T> {
  data: T[];
  cachedAt: number;
}
const cacheStore = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 10 * 1000; // 10 detik

export function invalidateSheetCache(sheetName?: SheetName): void {
  if (sheetName) {
    cacheStore.delete(sheetName);
  } else {
    cacheStore.clear();
  }
}

// Mutex In-Memory untuk operasi tulis
class AsyncMutex {
  private queue = Promise.resolve();

  public async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const waitPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previousPromise = this.queue;
    this.queue = waitPromise;

    await previousPromise;
    try {
      return await fn();
    } finally {
      release!();
    }
  }
}

const sheetsMutex = new AsyncMutex();

/**
 * Jalankan operasi dengan mutex in-memory terisolasi
 */
export async function withSheetsLock<T>(fn: () => Promise<T>): Promise<T> {
  return sheetsMutex.runExclusive(fn);
}

/**
 * Helper pemanggil Google Apps Script Web App
 */
async function callAppsScript<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) {
    throw AppError.internal('GOOGLE_APPS_SCRIPT_URL belum disetel di .env.local');
  }

  const apiKey = process.env.GOOGLE_APPS_SCRIPT_API_KEY;
  const fullPayload = apiKey ? { ...payload, apiKey } : payload;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(fullPayload),
    redirect: 'follow',
  });

  if (!res.ok) {
    throw AppError.internal(`Gagal menghubungi Google Apps Script: ${res.statusText}`);
  }

  const json = await res.json();
  if (json.success === false) {
    throw AppError.internal(`Error dari Google Apps Script: ${json.error || 'Terjadi kesalahan'}`);
  }

  return json.data as T;
}

/**
 * Inisialisasi Google Sheets Client dengan Service Account
 */
function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !clientEmail || !rawKey) {
    throw AppError.internal(
      'Kredensial Google Sheets belum dikonfigurasi. Pastikan GOOGLE_APPS_SCRIPT_URL atau (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) terisi di .env.local.'
    );
  }

  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId };
}

/**
 * Eksekusi dengan retry exponential backoff (maksimal 3 kali)
 */
async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      attempt++;
      const status = (err as { status?: number; code?: number })?.status || (err as { status?: number; code?: number })?.code;
      const isRetryable = status === 429 || (typeof status === 'number' && status >= 500 && status < 600);

      if (attempt > maxRetries || !isRetryable) {
        throw err;
      }

      const backoffMs = Math.pow(2, attempt) * 500 + Math.floor(Math.random() * 200);
      console.warn(`[GoogleSheets Retry] Percobaan ke-${attempt} gagal dengan kode ${status}. Menunggu ${backoffMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

/**
 * Memastikan header kolom di baris 1 tersedia dan sesuai spesifikasi
 */
export async function ensureHeaders(sheet: SheetName): Promise<void> {
  // Jika menggunakan Google Apps Script Web App
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    await callAppsScript({ action: 'ensureHeaders', sheet });
    return;
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  const expectedHeaders = SHEET_HEADERS[sheet];

  await executeWithRetry(async () => {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheet.data.sheets?.some(
      (s) => s.properties?.title === sheet
    );

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheet,
                },
              },
            },
          ],
        },
      });
    }

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheet}!1:1`,
    });

    const row1 = res.data.values?.[0] || [];
    const isMatching =
      row1.length >= expectedHeaders.length &&
      expectedHeaders.every((h, idx) => row1[idx] === h);

    if (!isMatching) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheet}!A1:${String.fromCharCode(64 + expectedHeaders.length)}1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [expectedHeaders as unknown as string[]],
        },
      });
      invalidateSheetCache(sheet);
    }
  });
}

/**
 * Mengambil semua baris dari sheet dan memetakannya menjadi array objek berdasarkan header baris 1
 */
export async function getRows<T extends object>(
  sheet: SheetName,
  bypassCache = false
): Promise<T[]> {
  if (!bypassCache) {
    const cached = cacheStore.get(sheet);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data as T[];
    }
  }

  // Jika menggunakan Google Apps Script Web App
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    const records = await callAppsScript<T[]>({ action: 'getRows', sheet });
    cacheStore.set(sheet, {
      data: records || [],
      cachedAt: Date.now(),
    });
    return (records || []) as T[];
  }

  const { sheets, spreadsheetId } = getSheetsClient();

  const data = await executeWithRetry(async () => {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheet}!A:Z`,
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) {
      return [];
    }

    const headers = rows[0].map((h: string) => h.trim());
    const records: T[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0 || row.every((c: string) => !c || c.trim() === '')) {
        continue;
      }

      const item: Record<string, unknown> = {};
      headers.forEach((header: string, colIdx: number) => {
        const val = row[colIdx] !== undefined ? row[colIdx] : '';
        if (header.includes('odometer') && val !== '') {
          const num = Number(val);
          item[header] = isNaN(num) ? 0 : num;
        } else {
          item[header] = val;
        }
      });

      records.push(item as T);
    }

    return records;
  });

  cacheStore.set(sheet, {
    data,
    cachedAt: Date.now(),
  });

  return data;
}

/**
 * Menambahkan 1 baris objek ke tab sheet
 */
export async function appendRow<T extends object>(
  sheet: SheetName,
  obj: T
): Promise<void> {
  // Jika menggunakan Google Apps Script Web App
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    await callAppsScript({ action: 'appendRow', sheet, data: obj });
    const cached = cacheStore.get(sheet);
    if (cached) {
      cached.data.push(obj);
      cached.cachedAt = Date.now();
    }
    return;
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  const headers = SHEET_HEADERS[sheet];

  const record = obj as Record<string, unknown>;
  const rowValues = headers.map((key) => {
    const val = record[key];
    if (val === undefined || val === null) return '';
    return val;
  });

  await executeWithRetry(async () => {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheet}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowValues],
      },
    });
  });

  const cached = cacheStore.get(sheet);
  if (cached) {
    cached.data.push(obj);
    cached.cachedAt = Date.now();
  }
}

/**
 * Mengupdate baris berdasarkan kolom ID
 */
export async function updateRowById<T extends object>(
  sheet: SheetName,
  idColumn: string,
  id: string,
  patch: Partial<T>
): Promise<boolean> {
  const updateCachedItem = () => {
    const cached = cacheStore.get(sheet);
    if (cached) {
      const idx = cached.data.findIndex(
        (item) => String((item as Record<string, unknown>)[idColumn]) === String(id)
      );
      if (idx !== -1) {
        cached.data[idx] = { ...(cached.data[idx] as object), ...patch };
        cached.cachedAt = Date.now();
      }
    }
  };

  // Jika menggunakan Google Apps Script Web App
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    await callAppsScript({
      action: 'updateRowById',
      sheet,
      idColumn,
      id,
      patch,
    });
    updateCachedItem();
    return true;
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  const headers = SHEET_HEADERS[sheet];
  const idColIdx = headers.indexOf(idColumn as unknown as never);

  if (idColIdx === -1) {
    throw AppError.internal(`Kolom ID '${idColumn}' tidak ditemukan pada sheet '${sheet}'.`);
  }

  const updated = await executeWithRetry(async () => {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheet}!A:Z`,
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return false;

    let targetRowIndex = -1;
    let currentRowValues: unknown[] = [];

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idColIdx] === id) {
        targetRowIndex = i + 1;
        currentRowValues = rows[i];
        break;
      }
    }

    if (targetRowIndex === -1) {
      return false;
    }

    const patchRecord = patch as Record<string, unknown>;
    const updatedValues = headers.map((key, idx) => {
      if (key in patchRecord) {
        const val = patchRecord[key];
        return val === undefined || val === null ? '' : val;
      }
      return currentRowValues[idx] !== undefined ? currentRowValues[idx] : '';
    });

    const colLetterEnd = String.fromCharCode(64 + headers.length);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheet}!A${targetRowIndex}:${colLetterEnd}${targetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedValues],
      },
    });

    return true;
  });

  if (updated) {
    updateCachedItem();
  }

  return updated;
}
