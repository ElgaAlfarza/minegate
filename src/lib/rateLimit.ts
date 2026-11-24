/**
 * In-Memory Rate Limiter untuk Login (Brute Force Protection)
 *
 * KETERBATASAN:
 * Menggunakan in-memory Map lokal per runtime instance. Pada arsitektur multi-instance /
 * serverless lambdas tanpa shared state, memori tidak disinkronkan antar worker.
 * Untuk produksi skala enterprise, gantikan dengan Redis / Upstash Distributed Rate Limiting.
 */
export interface RateLimitEntry {
  failedAttempts: number;
  blockedUntil: number | null;
}

export const loginRateLimits = new Map<string, RateLimitEntry>();
export const MAX_FAILED_ATTEMPTS = 5;
export const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 menit

export function _resetLoginRateLimit(key?: string) {
  if (key) {
    loginRateLimits.delete(key);
  } else {
    loginRateLimits.clear();
  }
}
