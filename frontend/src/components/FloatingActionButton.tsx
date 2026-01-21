import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  label?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon: Icon,
  onClick,
  label,
  position = 'bottom-right',
}) => {
  const positionClasses = position === 'bottom-right'
    ? 'bottom-8 right-8'
    : 'bottom-8 left-8';

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses} z-40 group animate-scaleIn`}
      aria-label={label}
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>

        {/* Button */}
        <div className="relative w-14 h-14 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110">
          <Icon className="w-6 h-6 text-dark-950" />
        </div>

        {/* Label tooltip */}
        {label && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-dark-900 text-slate-50 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-xl border border-dark-700">
              {label}
            </div>
          </div>
        )}
      </div>
    </button>
  );
};
