import { User } from '@/types';
import { getRows, appendRow, updateRowById } from '../sheets';
import { getCurrentTimestampWITA } from '../time';

export const userRepo = {
  async getAll(bypassCache = false): Promise<User[]> {
    return getRows<User>('users', bypassCache);
  },

  async getById(id: string, bypassCache = false): Promise<User | null> {
    const list = await this.getAll(bypassCache);
    return list.find((u) => u.user_id === id) || null;
  },

  async getByUsername(username: string, bypassCache = false): Promise<User | null> {
    const normalized = username.trim().toLowerCase();
    const list = await this.getAll(bypassCache);
    return list.find((u) => u.username.toLowerCase() === normalized) || null;
  },

  async create(data: Omit<User, 'user_id' | 'created_at'>): Promise<User> {
    const all = await this.getAll(true);
    let maxNum = 0;
    for (const u of all) {
      const match = u.user_id.match(/^USR-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextId = `USR-${String(maxNum + 1).padStart(3, '0')}`;

    const newUser: User = {
      ...data,
      username: data.username.toLowerCase(),
      user_id: nextId,
      created_at: getCurrentTimestampWITA(),
    };

    await appendRow<User>('users', newUser);
    return newUser;
  },

  async update(id: string, patch: Partial<User>): Promise<User | null> {
    const ok = await updateRowById<User>('users', 'user_id', id, patch);
    if (!ok) return null;
    return this.getById(id, true);
  },
};
