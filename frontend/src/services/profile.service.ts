import api from './api';
import type { User } from '../types';

export interface UpdateProfileData {
  name?: string;
  department?: string;
  academic_level?: string;
  bio?: string;
}

export interface UpdateSkillPayload {
  skill_id: number;
  proficiency_level: string;
}

export const profileService = {
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/api/profile');
    return response.data;
  },

  getUserProfile: async (id: string | number): Promise<User> => {
    const response = await api.get<User>(`/api/users/${id}`);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/api/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ message: string; avatar_url: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<{ message: string; avatar_url: string }>('/api/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateSkills: async (skills: UpdateSkillPayload[]): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/api/profile/skills', { skills });
    return response.data;
  },
};
