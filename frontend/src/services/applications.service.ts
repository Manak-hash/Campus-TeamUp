import api from './api';
import type { Application, ApiResponse } from '../types';

export const applicationsService = {
  getMyApplications: async (): Promise<ApiResponse<Application[]>> => {
    const response = await api.get<ApiResponse<Application[]>>('/api/applications');
    return response.data;
  },

  cancelApplication: async (id: number): Promise<ApiResponse<Application>> => {
    const response = await api.put<ApiResponse<Application>>(`/api/applications/${id}`, {
      status: 'cancelled',
    });
    return response.data;
  },
};
