import api from './api';
import type { Notification, ApiResponse, PaginatedResponse } from '../types';

export const notificationsService = {
  getNotifications: async (page = 1): Promise<PaginatedResponse<Notification>> => {
    const response = await api.get<PaginatedResponse<Notification>>('/api/notifications', {
      params: { page },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.get<ApiResponse<{ count: number }>>('/api/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: number): Promise<ApiResponse<Notification>> => {
    const response = await api.put<ApiResponse<Notification>>(`/api/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<null>> => {
    const response = await api.put<ApiResponse<null>>('/api/notifications/read-all');
    return response.data;
  },
};
