import { clearAuthCookie } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

export async function POST() {
  try {
    const response = successResponse({
      message: 'Logout berhasil. Sesi telah diakhiri.',
    });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
