import { User } from '@/types';

export const mockUsers: User[] = [
  {
    user_id: 'U-001',
    name: 'Rahmat Hidayat (Supervisor K3 & Ops)',
    username: 'supervisor',
    password_hash: '$2a$10$wE0v4P0wXm2j7VzXw2Vq.u1V3zR0sW9b8X1p3Y0q5m2l9k8j7h6g', // bcrypt hash for 'minegate123'
    role: 'SUPERVISOR',
    status: 'ACTIVE',
    created_at: '2025-01-01T08:00:00Z',
  },
  {
    user_id: 'U-002',
    name: 'Siti Rahmawati (Petugas Pos Gate 1)',
    username: 'operator',
    password_hash: '$2a$10$wE0v4P0wXm2j7VzXw2Vq.u1V3zR0sW9b8X1p3Y0q5m2l9k8j7h6g', // bcrypt hash for 'minegate123'
    role: 'OFFICER',
    status: 'ACTIVE',
    created_at: '2025-01-01T08:00:00Z',
  },
  {
    user_id: 'U-003',
    name: 'Administrator Tambang',
    username: 'admin',
    password_hash: '$2a$10$wE0v4P0wXm2j7VzXw2Vq.u1V3zR0sW9b8X1p3Y0q5m2l9k8j7h6g', // bcrypt hash for 'minegate123'
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: '2025-01-01T08:00:00Z',
  },
];
