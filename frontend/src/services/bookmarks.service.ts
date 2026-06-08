import api from './api';
import type { Bookmark, ApiResponse } from '../types';

export const bookmarksService = {
  getBookmarks: async (): Promise<ApiResponse<Bookmark[]>> => {
    const response = await api.get<ApiResponse<Bookmark[]>>('/api/bookmarks');
    return response.data;
  },

  addBookmark: async (projectId: number): Promise<ApiResponse<Bookmark>> => {
    const response = await api.post<ApiResponse<Bookmark>>('/api/bookmarks', {
      project_id: projectId,
    });
    return response.data;
  },

  removeBookmark: async (bookmarkId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/api/bookmarks/${bookmarkId}`);
    return response.data;
  },

  isBookmarked: async (projectId: number): Promise<ApiResponse<{ bookmarked: boolean; bookmark_id?: number }>> => {
    const response = await api.get<ApiResponse<{ bookmarked: boolean; bookmark_id?: number }>>(
      `/api/bookmarks/check/${projectId}`,
    );
    return response.data;
  },
};
