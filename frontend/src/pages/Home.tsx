import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GenerationForm } from '../components/GenerationForm';
import { ProgressTracker } from '../components/ProgressTracker';
import { useGenerationStore } from '../store/generationSlice';

export const Home: React.FC = () => {
  const { jobId, status, reset } = useGenerationStore();
  const navigate = useNavigate();

  const handleGenerationComplete = () => {
    reset();
    navigate('/library');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900">Song Master</h1>
        <p className="text-center text-gray-600 mb-12">
          AI-powered song generation with Claude, GPT, and Gemini
        </p>

        {status === 'generating' && jobId ? (
          <ProgressTracker jobId={jobId} onComplete={handleGenerationComplete} />
        ) : (
          <GenerationForm onSubmit={() => {}} />
        )}
      </div>
    </div>
  );
};
