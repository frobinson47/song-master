import { apiClient } from './client';
import { ProviderConfig, UpdateProviderRequest } from '../types/config';

export const getConfig = async (): Promise<ProviderConfig> => {
  const response = await apiClient.get<ProviderConfig>('/config/');
  return response.data;
};

export const updateConfig = async (request: UpdateProviderRequest): Promise<void> => {
  await apiClient.put('/config/', request);
};
