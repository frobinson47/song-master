import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  CheckCircle2, Loader2, AlertCircle, Wifi, WifiOff,
  Sparkles, Music, Clock, Zap, X
} from 'lucide-react';

interface ProgressTrackerProps {
  jobId: string;
  onComplete: () => void;
  useHookhouse?: boolean; // NEW: Track which workflow is being used
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  jobId,
  onComplete,
  useHookhouse = true
}) => {
  const { progress, connected, error, connect, disconnect, cancelJob } = useWebSocket();
  const [showSuccess, setShowSuccess] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    connect(jobId);
    return () => disconnect();
  }, [jobId, connect, disconnect]);

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (progress && progress.percentage >= 100) {
      setShowSuccess(true);
      setTimeout(onComplete, 2000);
    }
  }, [progress, onComplete]);

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this generation?')) {
      cancelJob();
      disconnect();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // HookHouse workflow steps
  const hookhouseSteps = [
    { name: '🎭 Narrative Development', description: 'Crafting story concepts with Storysmith Muse', icon: Sparkles },
    { name: '✍️ HookHouse Draft', description: 'Generating Suno-compliant lyrics', icon: Music },
    { name: '🔍 HookHouse Review', description: 'Quality check against HookHouse standards', icon: CheckCircle2 },
    { name: '🎸 Funksmith Refinement', description: 'Adding physiological resonance & groove', icon: Zap },
    { name: '✅ Preflight Checks', description: 'Final validation before metadata', icon: CheckCircle2 },
    { name: '📋 HookHouse Metadata', description: 'Generating Blocks 2-5 (Style, Exclude, Title, Summary)', icon: Music },
    { name: '🎨 Album Art', description: 'Generating cover artwork', icon: Sparkles },
    { name: '💾 Saving Song', description: 'Finalizing and saving', icon: CheckCircle2 },
  ];

  // Original workflow steps
  const originalSteps = [
    { name: 'Loading resources', description: 'Initializing AI models and resources', icon: Zap },
    { name: 'Parsing input', description: 'Understanding your song requirements', icon: Music },
    { name: 'Drafting lyrics', description: 'Crafting original lyrics', icon: Sparkles },
    { name: 'Reviewing (rounds)', description: 'Multiple critique rounds for refinement', icon: CheckCircle2 },
    { name: 'Applying critique', description: 'Enhancing lyrical flow', icon: Sparkles },
    { name: 'Preflight checks', description: 'Validating song structure', icon: CheckCircle2 },
    { name: 'Generating metadata', description: 'Creating song information', icon: Music },
    { name: 'Creating album art', description: 'Designing cover artwork', icon: Sparkles },
    { name: 'Saving song', description: 'Finalizing and saving', icon: CheckCircle2 },
  ];

  const steps = useHookhouse ? hookhouseSteps : originalSteps;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success Animation */}
      {showSuccess && (
        <div className="card p-8 text-center gradient-border-primary animate-scaleIn">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center animate-pulse">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-2">Song Created!</h2>
          <p className="text-slate-400">Redirecting to your library...</p>
        </div>
      )}

      {!showSuccess && (
        <>
          {/* Main Progress Card */}
          <div className="card p-8 relative overflow-hidden">
            {/* Background gradient orb */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#F5A623]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-[#FFB84D]/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold gradient-text">Generating Your Song</h3>
                    <p className="text-slate-500 text-sm">AI is working its magic...</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Connection Status */}
                  {connected ? (
                    <span className="flex items-center space-x-2 text-green-400 text-sm font-medium">
                      <Wifi className="w-4 h-4" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2 text-slate-500 text-sm">
                      <WifiOff className="w-4 h-4 animate-pulse" />
                      <span>Connecting...</span>
                    </span>
                  )}

                  {/* Cancel Button */}
                  <button
                    onClick={handleCancel}
                    className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-dark-700/50 rounded-lg"
                    title="Cancel generation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 animate-fadeIn">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-red-400 font-semibold mb-1">Generation Failed</h4>
                      <p className="text-red-300 text-sm">{error}</p>
                      {error.includes('rate_limit') && (
                        <p className="text-red-300/70 text-xs mt-2">
                          💡 Tip: Wait a minute for the rate limit to reset, or switch to a different provider in Settings.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400 font-medium">Overall Progress</span>
                  <span className="text-sm text-primary font-bold">
                    {Math.round(progress?.percentage || 0)}%
                  </span>
                </div>
                <div className="relative w-full bg-dark-700 rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-[#D48A0A] via-primary to-[#FFB84D] h-4 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${progress?.percentage || 0}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Current Step Message */}
              {progress && (
                <div className="bg-gradient-to-r from-primary/10 to-[#FFB84D]/10 border border-primary/30 rounded-lg p-4 mb-6">
                  <p className="text-lg text-slate-50 font-semibold">{progress.message}</p>
                </div>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-3 text-center">
                  <Clock className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500 mb-1">Elapsed Time</p>
                  <p className="text-lg font-bold text-primary">{formatTime(elapsedTime)}</p>
                </div>
                <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-3 text-center">
                  <Sparkles className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500 mb-1">Current Step</p>
                  <p className="text-lg font-bold text-[#F5A623]">
                    {progress ? `${progress.step_index + 1} of ${steps.length}` : '0 of 9'}
                  </p>
                </div>
                <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-3 text-center">
                  <Zap className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <p className="text-lg font-bold text-green-400">
                    {connected ? 'Active' : 'Waiting'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step List Card */}
          <div className="card p-6">
            <h4 className="text-lg font-bold text-slate-50 mb-4 flex items-center space-x-2">
              <Music className="w-5 h-5 text-primary" />
              <span>Generation Steps</span>
            </h4>
            <div className="space-y-3">
              {steps.map((step, index) => {
                const isCompleted = progress && index < progress.step_index;
                const isCurrent = progress && index === progress.step_index;
                const StepIcon = step.icon;

                return (
                  <div
                    key={index}
                    className={`relative flex items-start space-x-4 p-4 rounded-lg transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500/10 border border-green-500/30'
                        : isCurrent
                        ? 'bg-primary/10 border border-primary/30 scale-105 shadow-lg'
                        : 'bg-dark-800/30 border border-dark-700/50'
                    }`}
                    style={isCurrent ? { animationDelay: `${index * 0.1}s` } : {}}
                  >
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-green-500/20'
                          : isCurrent
                          ? 'bg-primary/20'
                          : 'bg-dark-700'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <StepIcon className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h5
                        className={`font-semibold mb-1 ${
                          isCompleted
                            ? 'text-green-400'
                            : isCurrent
                            ? 'text-primary'
                            : 'text-slate-500'
                        }`}
                      >
                        {step.name}
                      </h5>
                      <p
                        className={`text-sm ${
                          isCompleted
                            ? 'text-green-400/70'
                            : isCurrent
                            ? 'text-slate-400'
                            : 'text-slate-600'
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>

                    {/* Progress indicator line */}
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute left-9 top-16 w-0.5 h-6 ${
                          isCompleted ? 'bg-green-500/30' : 'bg-dark-700'
                        }`}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips Card */}
          <div className="card p-6 bg-gradient-to-br from-primary/5 to-[#FFB84D]/5 border-primary/20">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-primary font-semibold mb-2">Did you know?</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  The AI generates multiple versions of your lyrics and uses critique rounds to refine them,
                  ensuring high-quality output with proper structure, rhyme schemes, and emotional depth.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
