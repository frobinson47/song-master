import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, Library, Settings } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/new', label: 'New Song', icon: Sparkles },
    { path: '/library', label: 'Library', icon: Library },
    { path: '/personas', label: 'Personas', icon: Settings },
  ];

  return (
    <header className="h-14 bg-dark-950 border-b border-dark-700/50 flex items-center justify-end px-6">
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
    </header>
  );
};
