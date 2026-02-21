import React, { useEffect, useState } from 'react';
import { X, Settings as SettingsIcon, Loader2, Check, AlertCircle, Sparkles, Cpu, Zap } from 'lucide-react';
import { getConfig, updateConfig } from '../api/config';
import { ProviderConfig } from '../types/config';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDER_INFO = {
  anthropic: {
    name: 'Claude',
    icon: Sparkles,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'from-orange-500/10 to-amber-500/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
  },
  openai: {
    name: 'OpenAI',
    icon: Cpu,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-500/10 to-emerald-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
  },
  google: {
    name: 'Gemini',
    icon: Zap,
    color: 'from-[#F5A623] to-[#FFB84D]',
    bgColor: 'from-[#F5A623]/10 to-[#FFB84D]/10',
    borderColor: 'border-[#F5A623]/30',
    textColor: 'text-[#F5A623]',
  },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<ProviderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [success, setSuccess] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConfig();
      setConfig(data);
      setSelectedProvider(data.current_provider);
      setSelectedModel(data.current_model);
      setShowApiKeyInput(false);
      setApiKey('');
    } catch (error) {
      console.error('Failed to load config:', error);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
    // Auto-select first available model for this provider
    const models = config?.available_models[provider];
    if (models && models.length > 0) {
      setSelectedModel(models[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await updateConfig({
        provider: selectedProvider,
        model: selectedModel || undefined,
        api_key: apiKey || undefined,
      });

      setSuccess(true);
      setApiKey('');
      setShowApiKeyInput(false);
      await loadConfig();

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to update config:', error);
      setError('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-dark-900 border border-dark-700 rounded-lg shadow-2xl max-w-3xl w-full p-6 animate-scaleIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-50">Settings</h2>
              <p className="text-slate-400 text-sm">Configure your AI provider</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-2 hover:bg-dark-700/50 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : config ? (
          <div className="space-y-6">
            {/* Provider Selection Cards */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Select AI Provider</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {config.available_providers.map((provider) => {
                  const info = PROVIDER_INFO[provider as keyof typeof PROVIDER_INFO];
                  if (!info) return null;

                  const Icon = info.icon;
                  const isSelected = selectedProvider === provider;
                  const hasKey = config.api_keys_configured?.[provider] || false;
                  const isCurrent = config.current_provider === provider;

                  return (
                    <button
                      key={provider}
                      onClick={() => handleProviderSelect(provider)}
                      className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? `bg-gradient-to-br ${info.bgColor} ${info.borderColor} shadow-lg scale-105`
                          : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
                      }`}
                    >
                      {/* Current provider badge */}
                      {isCurrent && (
                        <div className="absolute -top-2 -right-2 bg-primary text-dark-950 text-xs font-bold px-2 py-1 rounded-full">
                          ACTIVE
                        </div>
                      )}

                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      {/* Name */}
                      <h4 className={`text-lg font-bold mb-2 ${isSelected ? info.textColor : 'text-slate-50'}`}>
                        {info.name}
                      </h4>

                      {/* Status */}
                      <div className="flex items-center justify-center space-x-1">
                        {hasKey ? (
                          <>
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-green-400 font-medium">Key Configured</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs text-yellow-400 font-medium">No API Key</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model Selection */}
            {selectedProvider && config.available_models[selectedProvider] && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-slate-50 focus:outline-none focus:border-primary transition-colors"
                >
                  {config.available_models[selectedProvider].map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* API Key Section */}
            {selectedProvider && (
              <div className="animate-fadeIn">
                {!showApiKeyInput ? (
                  <button
                    onClick={() => setShowApiKeyInput(true)}
                    className="text-sm text-primary hover:text-primary-400 transition-colors font-medium"
                  >
                    {config.api_keys_configured?.[selectedProvider]
                      ? '+ Update API Key'
                      : '+ Add API Key'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-300">
                        {PROVIDER_INFO[selectedProvider as keyof typeof PROVIDER_INFO]?.name} API Key
                      </label>
                      <button
                        onClick={() => {
                          setShowApiKeyInput(false);
                          setApiKey('');
                        }}
                        className="text-xs text-slate-400 hover:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-... or your API key"
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-slate-50 focus:outline-none focus:border-primary transition-colors placeholder:text-slate-500"
                    />
                    <p className="text-xs text-slate-500">
                      Your API key is stored securely in the .env file
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Current Active Configuration */}
            <div className="bg-dark-800/50 border border-dark-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Current Active Configuration</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Provider</p>
                  <p className="text-sm font-medium text-primary">
                    {PROVIDER_INFO[config.current_provider as keyof typeof PROVIDER_INFO]?.name || config.current_provider}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Model</p>
                  <p className="text-sm font-medium text-[#F5A623] truncate" title={config.current_model}>
                    {config.current_model}
                  </p>
                </div>
              </div>
            </div>

            {/* Success message */}
            {success && (
              <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center space-x-2 animate-fadeIn">
                <Check className="w-5 h-5" />
                <span className="font-medium">Configuration updated successfully!</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-dark-700">
              <button
                onClick={onClose}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (selectedProvider === config.current_provider && selectedModel === config.current_model && !apiKey)}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
