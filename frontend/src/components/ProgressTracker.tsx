import React, { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface ProgressTrackerProps {
  jobId: string;
  onComplete: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ jobId, onComplete }) => {
  const { progress, connected, connect, disconnect } = useWebSocket();

  useEffect(() => {
    connect(jobId);
    return () => disconnect();
  }, [jobId, connect, disconnect]);

  useEffect(() => {
    if (progress && progress.percentage >= 100) {
      setTimeout(onComplete, 1000);
    }
  }, [progress, onComplete]);

  const steps = [
    'Loading resources',
    'Parsing input',
    'Drafting lyrics',
    'Reviewing (rounds)',
    'Applying critique',
    'Preflight checks',
    'Generating metadata',
    'Creating album art',
    'Saving song',
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Generating Your Song</h3>
          {connected ? (
            <span className="text-green-600 text-sm flex items-center">
              <span className="h-2 w-2 bg-green-600 rounded-full mr-2"></span>
              Connected
            </span>
          ) : (
            <span className="text-gray-400 text-sm">Connecting...</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progress?.percentage || 0}%` }}
          />
        </div>

        {/* Current step */}
        {progress && (
          <p className="text-lg text-gray-700 mb-6 font-medium">{progress.message}</p>
        )}

        {/* Step list */}
        <div className="space-y-2">
          {steps.map((step, index) => {
            const isCompleted = progress && index < progress.step_index;
            const isCurrent = progress && index === progress.step_index;
            const isPending = !progress || index > progress.step_index;

            return (
              <div
                key={index}
                className={`flex items-center space-x-3 ${
                  isCompleted
                    ? 'text-green-600'
                    : isCurrent
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : isCurrent ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
                <span>{step}</span>
              </div>
            );
          })}
        </div>

        {/* Percentage */}
        {progress && (
          <div className="mt-6 text-center">
            <span className="text-2xl font-bold text-blue-600">{Math.round(progress.percentage)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
