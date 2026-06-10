import api from './api';
import type { Bookmark, ApiResponse } from '../types';

export const bookmarksService = {
  getBookmarks: async (): Promise<ApiResponse<Bookmark[]>> => {
    const response = await api.get<ApiResponse<Bookmark[]>>('/api/bookmarks');
    return response.data;
  },

  addBookmark: async (projectId: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post<ApiResponse<{ message: string }>>(`/api/projects/${projectId}/bookmark`);
    return response.data;
  },

  removeBookmark: async (projectId: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/projects/${projectId}/bookmark`);
    return response.data;
  },
};
