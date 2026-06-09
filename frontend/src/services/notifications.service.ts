import api from './api';

export interface Notification {
  id: number;
  type: 'application_received' | 'application_accepted' | 'application_rejected' | string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export const notificationsService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/api/notifications');
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/api/notifications/unread-count');
    return response.data.count;
  },

  markRead: async (id: number): Promise<void> => {
    await api.put(`/api/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.put('/api/notifications/read-all');
  },
};
