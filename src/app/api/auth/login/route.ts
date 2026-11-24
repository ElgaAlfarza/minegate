import { NextRequest } from 'next/server';
import { userRepo } from '@/lib/repositories/userRepo';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { AppError, handleApiError, successResponse } from '@/lib/errors';

/**
 * In-Memory Rate Limiter untuk Login (Brute Force Protection)
 *
 * KETERBATASAN:
 * Menggunakan in-memory Map lokal per runtime instance. Pada arsitektur multi-instance /
 * serverless lambdas tanpa shared state, memori tidak disinkronkan antar worker.
 * Untuk produksi skala enterprise, gantikan dengan Redis / Upstash Distributed Rate Limiting.
 */
interface RateLimitEntry {
  failedAttempts: number;
  blockedUntil: number | null;
}

const loginRateLimits = new Map<string, RateLimitEntry>();
const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 menit

export function _resetLoginRateLimit(key?: string) {
  if (key) {
    loginRateLimits.delete(key);
  } else {
    loginRateLimits.clear();
  }
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const clientIp = getClientIp(request);
    const rateLimitKey = `${clientIp}:${validated.username.toLowerCase()}`;
    const now = Date.now();

    // 1. Cek apakah username+IP sedang dalam masa blokir
    const limitRecord = loginRateLimits.get(rateLimitKey);
    if (limitRecord && limitRecord.blockedUntil && now < limitRecord.blockedUntil) {
      const remainingMinutes = Math.ceil((limitRecord.blockedUntil - now) / 60000);
      throw new AppError(
        429,
        'TOO_MANY_REQUESTS',
        `Terlalu banyak percobaan login gagal. Akses akun diblokir sementara selama ${remainingMinutes} menit demi keamanan.`
      );
    }

    // 2. Ambil data pengguna dari database Google Sheets (tanpa fallback mock)
    let user = null;
    try {
      user = await userRepo.getByUsername(validated.username);
    } catch {
      throw new AppError(
        503,
        'SERVICE_UNAVAILABLE',
        'Layanan database autentikasi (Google Sheets) sedang tidak dapat dijangkau. Silakan hubungi Administrator.'
      );
    }

    const recordFailedAttempt = () => {
      const current = loginRateLimits.get(rateLimitKey) || { failedAttempts: 0, blockedUntil: null };
      const attempts = current.failedAttempts + 1;
      const blockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? Date.now() + BLOCK_DURATION_MS : null;
      loginRateLimits.set(rateLimitKey, { failedAttempts: attempts, blockedUntil });
    };

    if (!user) {
      recordFailedAttempt();
      throw AppError.unauthorized('Username atau password yang Anda masukkan salah.');
    }

    if (user.status !== 'ACTIVE') {
      throw AppError.forbidden('Akun Anda sedang dinonaktifkan. Silakan hubungi Administrator.');
    }

    // 3. Verifikasi password dengan bcrypt (Hapus pengecekan hardcoded minegate123)
    const isValidPassword = await comparePassword(validated.password, user.password_hash);
    if (!isValidPassword) {
      recordFailedAttempt();
      throw AppError.unauthorized('Username atau password yang Anda masukkan salah.');
    }

    // 4. Login sukses: bersihkan catatan percobaan gagal untuk key ini
    loginRateLimits.delete(rateLimitKey);

    const token = await signToken({
      userId: user.user_id,
      username: user.username,
      role: user.role,
      name: user.name,
    });

    const safeUser = {
      user_id: user.user_id,
      name: user.name,
      username: user.username,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
    };

    const response = successResponse({
      message: 'Login berhasil.',
      user: safeUser,
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
