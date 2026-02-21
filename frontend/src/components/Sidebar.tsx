import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music, Library, Plus } from 'lucide-react';

interface SidebarProps {
  systemStatus: {
    healthy: boolean;
    message: string;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ systemStatus }) => {
  const location = useLocation();

  return (
    <aside className="w-48 flex-shrink-0 bg-dark-950 border-r border-dark-700/50 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-dark-700/50">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
            <Music className="w-6 h-6 text-dark-950" />
          </div>
          <div>
            <span className="text-lg font-bold text-primary">SONG</span>
            <span className="text-lg font-bold text-slate-50">FORGE</span>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Quick actions</h3>
        <div className="space-y-2">
          <Link
            to="/new"
            className={`flex items-center justify-center space-x-2 w-full py-2 px-4 rounded-md font-medium transition-colors ${
              location.pathname === '/new'
                ? 'bg-primary text-dark-950'
                : 'bg-[#F5A623] hover:bg-[#FFB84D] text-dark-950'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>New Song</span>
          </Link>
          <Link
            to="/library"
            className={`flex items-center justify-center space-x-2 w-full py-2 px-4 rounded-md font-medium transition-colors ${
              location.pathname === '/library'
                ? 'bg-primary text-dark-950'
                : 'bg-[#F5A623] hover:bg-[#FFB84D] text-dark-950'
            }`}
          >
            <Library className="w-4 h-4" />
            <span>Library</span>
          </Link>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* System Status */}
      <div className="p-4 border-t border-dark-700/50">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Live System Status</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${systemStatus.healthy ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-slate-400">{systemStatus.message}</span>
        </div>
      </div>
    </aside>
  );
};
