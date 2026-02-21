import React, { useEffect, useState } from 'react';
import { getConfig, updateConfig } from '../api/config';
import { ProviderConfig } from '../types/config';

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<ProviderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getConfig();
      setConfig(data);
      setSelectedProvider(data.current_provider);
      setSelectedModel(data.current_model);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      await updateConfig({
        provider: selectedProvider,
        model: selectedModel || undefined,
        api_key: apiKey || undefined,
      });

      setSuccess(true);
      setApiKey(''); // Clear API key field after save
      await loadConfig(); // Reload config

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update config:', error);
      alert('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-slate-50">Settings</h1>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-50">LLM Provider Configuration</h2>
            <p className="text-sm text-slate-400 mb-4">
              Configure which AI provider and model to use for song generation.
            </p>
          </div>

          {/* Provider selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Provider</label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                // Reset model when provider changes
                const models = config?.available_models[e.target.value];
                if (models && models.length > 0) {
                  setSelectedModel(models[0]);
                }
              }}
              className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            >
              {config?.available_providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Model selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            >
              {config?.available_models[selectedProvider]?.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* API Key (optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              API Key (Optional - leave empty to keep current)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Only enter if you want to change the API key
            </p>
          </div>

          {/* Current config display */}
          <div className="bg-dark-900 p-4 border border-dark-700 rounded-lg">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Current Configuration</h3>
            <p className="text-sm text-slate-400">
              <strong>Provider:</strong> {config?.current_provider}
            </p>
            <p className="text-sm text-slate-400">
              <strong>Model:</strong> {config?.current_model}
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
              Configuration updated successfully!
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-600 disabled:bg-dark-600 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};
