import { apiClient } from './client';

export interface Persona {
  id: string;
  name: string;
  description: string;
}

export const getPersonas = async (): Promise<Persona[]> => {
  const response = await apiClient.get<Persona[]>('/personas/');
  return response.data;
};

export const getPersona = async (personaId: string): Promise<Persona> => {
  const response = await apiClient.get<Persona>(`/personas/${personaId}`);
  return response.data;
};
