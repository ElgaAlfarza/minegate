import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiResponse } from '@/types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Autentikasi diperlukan. Silakan login terlebih dahulu.') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Data yang diminta tidak ditemukan.') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(409, 'CONFLICT', message, details);
  }

  static unprocessable(message: string, details?: unknown) {
    return new AppError(422, 'UNPROCESSABLE_ENTITY', message, details);
  }

  static internal(message = 'Terjadi kesalahan internal pada server.', details?: unknown) {
    return new AppError(500, 'INTERNAL_SERVER_ERROR', message, details);
  }
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validasi input gagal. Silakan periksa kembali data Anda.',
          details: formattedErrors,
        },
      },
      { status: 422 }
    );
  }

  console.error('[Unhandled API Error]:', error);
  const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan sistem yang tidak terduga.';

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan internal pada server.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
    },
    { status: 500 }
  );
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}
