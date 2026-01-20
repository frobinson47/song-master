import { create } from 'zustand';

interface GenerationState {
  jobId: string | null;
  status: 'idle' | 'generating' | 'completed' | 'error';
  setJobId: (id: string) => void;
  setStatus: (status: GenerationState['status']) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  jobId: null,
  status: 'idle',
  setJobId: (id) => set({ jobId: id }),
  setStatus: (status) => set({ status }),
  reset: () => set({ jobId: null, status: 'idle' }),
}));
