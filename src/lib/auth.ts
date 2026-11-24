import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { TokenPayload, UserRole } from '@/types';
import { AppError } from './errors';

export const AUTH_COOKIE_NAME = 'minegate_token';
export const TOKEN_EXPIRATION_HOURS = 8;

const authSecretEnv = process.env.AUTH_SECRET;
if (!authSecretEnv || authSecretEnv.length < 32) {
  throw new Error('FATAL: Variabel lingkungan AUTH_SECRET wajib diisi dan memiliki panjang minimal 32 karakter.');
}
const secretKey = new TextEncoder().encode(authSecretEnv);

/**
 * Hash password menggunakan bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Komparasi password dengan hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Buat JWT token berdurasi 8 jam
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRATION_HOURS}h`)
    .sign(secretKey);
}

/**
 * Verifikasi JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Pasang Auth Cookie ke response
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_EXPIRATION_HOURS * 60 * 60,
  });
}

/**
 * Hapus Auth Cookie dari response
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Ambil token dari cookie Next.js App Router (dari headers / cookies())
 */
export async function getSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Ekstrak token dari NextRequest (untuk Middleware dan Route Handler)
 */
export async function getSessionFromRequest(request: NextRequest): Promise<TokenPayload | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Guard role: Memastikan user telah login dan memiliki salah satu dari allowedRoles
 */
export function requireRole(allowedRoles: UserRole[], currentUser?: TokenPayload | null): TokenPayload {
  if (!currentUser) {
    throw AppError.unauthorized('Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.');
  }

  if (!allowedRoles.includes(currentUser.role)) {
    throw AppError.forbidden(
      `Role '${currentUser.role}' tidak memiliki izin untuk mengakses fitur ini.`
    );
  }

  return currentUser;
}
