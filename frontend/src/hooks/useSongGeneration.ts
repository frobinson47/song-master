import { useState } from 'react';
import { generateSong } from '../api/generation';
import { useGenerationStore } from '../store/generationSlice';
import { GenerateSongRequest } from '../types/generation';

export const useSongGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setJobId, setStatus } = useGenerationStore();

  const startGeneration = async (params: GenerateSongRequest) => {
    setIsGenerating(true);
    setError(null);
    setStatus('generating');

    try {
      const response = await generateSong(params);
      setJobId(response.job_id);
      return response;
    } catch (err: any) {
      setStatus('error');
      const errorMessage = err.response?.data?.detail || err.message || 'Generation failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return { startGeneration, isGenerating, error };
};
