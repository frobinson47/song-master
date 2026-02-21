import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, Library, Music2, Settings, Cpu, Zap } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { getConfig } from '../api/config';

const PROVIDER_INFO = {
  anthropic: {
    name: 'Claude',
    icon: Sparkles,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  openai: {
    name: 'OpenAI',
    icon: Cpu,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  google: {
    name: 'Gemini',
    icon: Zap,
    color: 'text-[#F5A623]',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
};

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<string>('anthropic');

  useEffect(() => {
    loadProvider();
  }, []);

  const loadProvider = async () => {
    try {
      const config = await getConfig();
      setCurrentProvider(config.current_provider);
    } catch (error) {
      console.error('Failed to load provider:', error);
    }
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
    // Reload provider after settings change
    loadProvider();
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/new', label: 'New Song', icon: Sparkles },
    { path: '/library', label: 'Library', icon: Library },
    { path: '/personas', label: 'Personas', icon: Music2 },
  ];

  const providerInfo = PROVIDER_INFO[currentProvider as keyof typeof PROVIDER_INFO];
  const ProviderIcon = providerInfo?.icon || Sparkles;

  return (
    <>
      <header className="h-14 bg-dark-950 border-b border-dark-700/50 flex items-center justify-between px-6">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-dark-950" />
          </div>
          <span className="text-lg font-bold gradient-text">Song Forge</span>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <nav className="flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-dark-950'
                      : 'text-slate-400 hover:text-slate-50 hover:bg-dark-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Active Provider Indicator */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border ${providerInfo?.borderColor} ${providerInfo?.bgColor} ml-2`}>
            <ProviderIcon className={`w-4 h-4 ${providerInfo?.color}`} />
            <span className={`text-xs font-semibold ${providerInfo?.color}`}>
              {providerInfo?.name}
            </span>
          </div>

          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-slate-400 hover:text-slate-50 hover:bg-dark-800"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={handleSettingsClose} />
    </>
  );
};
