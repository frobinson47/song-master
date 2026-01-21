import { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { CheckCircle2, Circle, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface ProgressTrackerProps {
  jobId: string;
  onComplete: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ jobId, onComplete }) => {
  const { progress, connected, error, connect, disconnect } = useWebSocket();

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
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-50">Generating Your Song</h3>
          {connected ? (
            <span className="flex items-center space-x-2 text-green-400 text-sm">
              <Wifi className="w-4 h-4" />
              <span>Connected</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2 text-slate-500 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Connecting...</span>
            </span>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-red-400 font-semibold mb-1">Generation Failed</h4>
                <p className="text-red-300 text-sm">{error}</p>
                {error.includes('rate_limit') && (
                  <p className="text-red-300/70 text-xs mt-2">
                    Tip: Wait a minute for the rate limit to reset, or switch to a different provider in Settings.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-cyan-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress?.percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Current step message */}
        {progress && (
          <p className="text-lg text-slate-300 mb-6 font-medium">{progress.message}</p>
        )}

        {/* Step list */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = progress && index < progress.step_index;
            const isCurrent = progress && index === progress.step_index;

            return (
              <div
                key={index}
                className={`flex items-center space-x-3 transition-colors ${
                  isCompleted
                    ? 'text-green-400'
                    : isCurrent
                    ? 'text-primary'
                    : 'text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
                <span className={isCurrent ? 'font-semibold' : ''}>{step}</span>
              </div>
            );
          })}
        </div>

        {/* Percentage */}
        {progress && (
          <div className="mt-8 text-center">
            <span className="text-4xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
              {Math.round(progress.percentage)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
