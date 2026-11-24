import { NextRequest } from 'next/server';
import { userRepo } from '@/lib/repositories/userRepo';
import { getSession, requireRole, hashPassword } from '@/lib/auth';
import { createUserSchema } from '@/lib/validations';
import { AppError, handleApiError, successResponse } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    requireRole(['ADMIN'], session);

    const users = await userRepo.getAll();
    const safeUsers = users.map((u) => ({
      user_id: u.user_id,
      name: u.name,
      username: u.username,
      role: u.role,
      status: u.status,
      created_at: u.created_at,
    }));

    return successResponse(safeUsers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    requireRole(['ADMIN'], session);

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    const existingUser = await userRepo.getByUsername(validated.username);
    if (existingUser) {
      throw AppError.conflict(`Username '${validated.username}' sudah digunakan.`);
    }

    const hashedPassword = await hashPassword(validated.password);

    const newUser = await userRepo.create({
      name: validated.name,
      username: validated.username,
      password_hash: hashedPassword,
      role: validated.role,
      status: validated.status,
    });

    const safeUser = {
      user_id: newUser.user_id,
      name: newUser.name,
      username: newUser.username,
      role: newUser.role,
      status: newUser.status,
      created_at: newUser.created_at,
    };

    return successResponse(safeUser, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
