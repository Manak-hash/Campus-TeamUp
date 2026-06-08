import api from './api';
import type { Application } from '../types';

export const applicationsService = {
  getMyApplications: async (): Promise<Application[]> => {
    const response = await api.get<Application[]>('/api/applications/mine');
    return response.data;
  },

  cancelApplication: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/api/applications/${id}`);
    return response.data;
  },
};
