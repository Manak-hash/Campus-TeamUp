import api from './api';
import type { User, Project, AdminStats, ApiResponse, PaginatedResponse } from '../types';

export const adminService = {
  getStats: async (): Promise<ApiResponse<AdminStats>> => {
    const response = await api.get<ApiResponse<AdminStats>>('/api/admin/stats');
    return response.data;
  },

  getUsers: async (page = 1): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/api/admin/users', {
      params: { page },
    });
    return response.data;
  },

  deleteUser: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/api/admin/users/${id}`);
    return response.data;
  },

  updateUserRole: async (id: number, role: 'student' | 'admin'): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>(`/api/admin/users/${id}/role`, { role });
    return response.data;
  },

  getProjects: async (page = 1): Promise<PaginatedResponse<Project>> => {
    const response = await api.get<PaginatedResponse<Project>>('/api/admin/projects', {
      params: { page },
    });
    return response.data;
  },

  deleteProject: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/api/admin/projects/${id}`);
    return response.data;
  },
};
