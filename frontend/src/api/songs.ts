import { apiClient } from './client';
import { SongMetadata, SongDetail } from '../types/song';

export const getSongs = async (params?: {
  search?: string;
  persona?: string;
  limit?: number;
  offset?: number;
}): Promise<SongMetadata[]> => {
  const response = await apiClient.get<SongMetadata[]>('/songs/', { params });
  return response.data;
};

export const getSongById = async (songId: string): Promise<SongDetail> => {
  const response = await apiClient.get<SongDetail>(`/songs/${songId}`);
  return response.data;
};

export const deleteSong = async (songId: string): Promise<void> => {
  await apiClient.delete(`/songs/${songId}`);
};
