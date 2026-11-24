import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { TokenPayload } from '@/types';

const AUTH_COOKIE_NAME = 'minegate_token';

const authSecretEnv = process.env.AUTH_SECRET;
if (!authSecretEnv || authSecretEnv.length < 32) {
  throw new Error('FATAL: Variabel lingkungan AUTH_SECRET wajib diisi dan memiliki panjang minimal 32 karakter.');
}
const secretKey = new TextEncoder().encode(authSecretEnv);

async function verifyEdgeToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Lewati aset statis dan rute publik
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await verifyEdgeToken(token) : null;

  // 2. Rute login publik
  if (pathname === '/login' || pathname === '/api/auth/login') {
    if (user && pathname === '/login') {
      // Jika sudah login, redirect sesuai peran
      const target = user.role === 'OFFICER' ? '/gate' : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 3. Jika belum login (unauthenticated)
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Autentikasi diperlukan. Silakan login terlebih dahulu.',
          },
        },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Root path redirect
  if (pathname === '/') {
    const target = user.role === 'OFFICER' ? '/gate' : '/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // 5. Cek izin akses halaman berdasarkan Role
  if (pathname.startsWith('/dashboard') && user.role === 'OFFICER') {
    return NextResponse.redirect(new URL('/gate', request.url));
  }

  if (pathname.startsWith('/users') && user.role !== 'ADMIN') {
    const target = user.role === 'OFFICER' ? '/gate' : '/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (login endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
