import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SongMetadata } from '../types/song';
import { Music } from 'lucide-react';

interface SongCardProps {
  song: SongMetadata;
  viewMode?: 'grid' | 'list';
}

export const SongCard: React.FC<SongCardProps> = ({ song, viewMode = 'grid' }) => {
  const navigate = useNavigate();

  const getPersonaDisplay = (persona?: string) => {
    if (!persona) return null;
    return persona.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => navigate(`/song/${song.filename}`)}
        className="card p-4 flex items-center space-x-4 hover:bg-dark-700/50 cursor-pointer transition-all duration-200 hover:translate-x-1 group animate-fadeIn"
      >
        {/* Album art */}
        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden shadow-lg group-hover:shadow-primary/20">
          {song.album_art_url ? (
            <img
              src={`http://localhost:8000${song.album_art_url}`}
              alt={song.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-cyan-500/30 flex items-center justify-center">
              <Music className="w-6 h-6 text-primary/70" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-50 font-semibold truncate group-hover:text-primary transition-colors">{song.title}</h3>
          <p className="text-slate-400 text-sm">{getPersonaDisplay(song.persona) || 'No Persona'}</p>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-semibold">
            COMPLETED
          </span>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      onClick={() => navigate(`/song/${song.filename}`)}
      className="card overflow-hidden hover:border-primary/30 cursor-pointer transition-all group animate-scaleIn relative"
    >
      {/* Album art */}
      <div className="aspect-square w-full overflow-hidden relative">
        {song.album_art_url ? (
          <img
            src={`http://localhost:8000${song.album_art_url}`}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center">
            <Music className="w-16 h-16 text-primary/50" />
          </div>
        )}
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="p-4 relative">
        <h3 className="text-slate-50 font-bold text-sm truncate mb-1 group-hover:text-primary transition-colors">{song.title}</h3>
        <p className="text-slate-400 text-xs mb-3">{getPersonaDisplay(song.persona) || 'No Persona'}</p>

        {/* Status tag */}
        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-semibold inline-block">
          COMPLETED
        </span>
      </div>
    </div>
  );
};
