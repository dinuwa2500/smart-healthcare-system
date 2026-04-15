import api from '../../shared/api';
import type { User } from './model';

export const userApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: { users: User[]; total: number } }>('/auth/users', { params }),

  updateStatus: (id: string, isActive: boolean) =>
    api.patch(`/auth/users/${id}/status`, { isActive }),
};
