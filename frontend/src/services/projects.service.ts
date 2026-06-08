import api from './api';
import type {
  Project,
} from '../types';

export interface ProjectFilters {
  search?: string;
  category?: string;
  skill?: string;
  status?: string;
  page?: number;
  limit?: number; // replaced per_page with limit
}

export interface ProjectsListResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProjectCreateUpdateResponse {
  message: string;
  project: Project;
}

export const projectsService = {
  getProjects: async (params?: ProjectFilters): Promise<ProjectsListResponse> => {
    const response = await api.get<ProjectsListResponse>('/api/projects', { params });
    return response.data;
  },

  getProject: async (idOrSlug: string): Promise<any> => {
    const response = await api.get<any>(`/api/projects/${idOrSlug}`);
    return response.data;
  },

  createProject: async (data: any): Promise<ProjectCreateUpdateResponse> => {
    const response = await api.post<ProjectCreateUpdateResponse>('/api/projects', data);
    return response.data;
  },

  updateProject: async (idOrSlug: string, data: any): Promise<ProjectCreateUpdateResponse> => {
    const response = await api.put<ProjectCreateUpdateResponse>(`/api/projects/${idOrSlug}`, data);
    return response.data;
  },

  deleteProject: async (idOrSlug: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/api/projects/${idOrSlug}`);
    return response.data;
  },

  applyToProject: async (idOrSlug: string | number, message: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/api/projects/${idOrSlug}/apply`, { message });
    return response.data;
  },

  getProjectApplications: async (idOrSlug: string | number): Promise<any> => {
    const response = await api.get<any>(`/api/projects/${idOrSlug}/applications`);
    return response.data;
  },

  reviewApplication: async (applicationId: number, status: 'accepted' | 'rejected'): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/api/applications/${applicationId}/status`, { status });
    return response.data;
  },
};

