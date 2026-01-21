import React, { useEffect, useState } from 'react';
import { getConfig } from '../api/config';
import { API_BASE_URL } from '../api/client';

interface BackendStatus {
  healthy: boolean;
  provider: string;
  model: string;
  error?: string;
}

export const StatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<BackendStatus>({
    healthy: false,
    provider: 'Loading...',
    model: 'Loading...',
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check health endpoint
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        const isHealthy = healthResponse.ok;

        // Get provider config
        const config = await getConfig();

        setStatus({
          healthy: isHealthy,
          provider: config.current_provider,
          model: config.current_model,
        });
      } catch (error) {
        setStatus({
          healthy: false,
          provider: 'Disconnected',
          model: 'N/A',
          error: 'Cannot connect to backend',
        });
      }
    };

    checkStatus();
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getProviderDisplay = (provider: string) => {
    const providerMap: Record<string, string> = {
      anthropic: 'Anthropic Claude',
      openai: 'OpenAI GPT',
      google: 'Google Gemini',
    };
    return providerMap[provider] || provider;
  };

  const getModelShortName = (model: string) => {
    if (model.includes('claude')) return model.split('-').slice(0, 3).join('-');
    if (model.includes('gpt')) return model;
    if (model.includes('gemini')) return model.split('/')[1];
    return model;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed view - just the status dot */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center space-x-2 bg-white rounded-full shadow-lg px-4 py-2 hover:shadow-xl transition-all duration-200 border border-gray-200"
        >
          <div className="relative flex items-center">
            <div
              className={`h-3 w-3 rounded-full ${
                status.healthy ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {status.healthy && (
                <div className="absolute inset-0 h-3 w-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {status.healthy ? 'Online' : 'Offline'}
          </span>
        </button>
      )}

      {/* Expanded view - detailed status */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Backend Status</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Connection Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Connection</span>
              <div className="flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    status.healthy ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span className={`text-xs font-medium ${
                  status.healthy ? 'text-green-700' : 'text-red-700'
                }`}>
                  {status.healthy ? 'Healthy' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Provider */}
            {status.healthy && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Provider</span>
                  <span className="text-xs font-medium text-blue-700">
                    {getProviderDisplay(status.provider)}
                  </span>
                </div>

                {/* Model */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Model</span>
                  <span className="text-xs font-mono text-gray-700">
                    {getModelShortName(status.model)}
                  </span>
                </div>

                {/* Port info */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Backend</span>
                  <span className="text-xs font-mono text-gray-500">
                    :8000
                  </span>
                </div>
              </>
            )}

            {/* Error message */}
            {status.error && (
              <div className="pt-2 border-t border-red-100">
                <p className="text-xs text-red-600">{status.error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
