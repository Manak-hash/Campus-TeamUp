import api from './api';
import type { Skill } from '../types';

export const skillsService = {
  getAllSkills: async (): Promise<Skill[]> => {
    const response = await api.get<Skill[]>('/api/skills');
    return response.data;
  },

  searchSkills: async (query: string): Promise<Skill[]> => {
    const response = await api.get<Skill[]>('/api/skills', {
      params: { search: query },
    });
    return response.data;
  },

  createSkill: async (name: string): Promise<Skill> => {
    const response = await api.post<Skill>('/api/skills', { name });
    return response.data;
  },
};
