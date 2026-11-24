import { getSession } from '@/lib/auth';
import { userRepo } from '@/lib/repositories/userRepo';
import { AppError, handleApiError, successResponse } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      throw AppError.unauthorized('Sesi tidak ditemukan atau telah kedaluwarsa.');
    }

    const user = await userRepo.getById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw AppError.unauthorized('Pengguna tidak valid atau telah dinonaktifkan.');
    }

    const safeUser = {
      user_id: user.user_id,
      name: user.name,
      username: user.username,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
    };

    return successResponse({ user: safeUser });
  } catch (error) {
    return handleApiError(error);
  }
}
