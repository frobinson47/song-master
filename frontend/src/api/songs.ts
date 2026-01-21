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

export const generateImagePrompt = async (songId: string): Promise<{ status: string; blueprint: any; copy_ready_prompt: string }> => {
  const response = await apiClient.post<{ status: string; blueprint: any; copy_ready_prompt: string }>(`/songs/${songId}/generate-image-prompt`);
  return response.data;
};

export const regenerateLyrics = async (songId: string): Promise<{ job_id: string; status: string; websocket_url: string }> => {
  const response = await apiClient.post<{ job_id: string; status: string; websocket_url: string }>(`/songs/${songId}/regenerate-lyrics`);
  return response.data;
};
