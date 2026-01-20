import { apiClient } from './client';
import { GenerateSongRequest, JobResponse, JobStatus } from '../types/generation';

export const generateSong = async (request: GenerateSongRequest): Promise<JobResponse> => {
  const response = await apiClient.post<JobResponse>('/generation/', request);
  return response.data;
};

export const getJobStatus = async (jobId: string): Promise<JobStatus> => {
  const response = await apiClient.get<JobStatus>(`/generation/${jobId}/status`);
  return response.data;
};

export const cancelJob = async (jobId: string): Promise<void> => {
  await apiClient.post(`/generation/${jobId}/cancel`);
};
