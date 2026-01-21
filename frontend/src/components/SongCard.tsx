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
        className="card p-4 flex items-center space-x-4 hover:bg-dark-700/50 cursor-pointer transition-colors"
      >
        {/* Album art */}
        <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
          {song.album_art_url ? (
            <img
              src={`http://localhost:8000${song.album_art_url}`}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-cyan-500/30 flex items-center justify-center">
              <Music className="w-6 h-6 text-primary/70" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-50 font-semibold truncate">{song.title}</h3>
          <p className="text-slate-500 text-sm">{getPersonaDisplay(song.persona) || 'No Persona'}</p>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-3">
          <span className="tag status-completed px-3 py-1 text-xs rounded-full">
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
      className="card overflow-hidden hover:border-dark-600 cursor-pointer transition-all group"
    >
      {/* Album art */}
      <div className="aspect-square w-full overflow-hidden">
        {song.album_art_url ? (
          <img
            src={`http://localhost:8000${song.album_art_url}`}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center">
            <Music className="w-16 h-16 text-primary/50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-slate-50 font-semibold text-sm truncate mb-1">{song.title}</h3>
        <p className="text-slate-500 text-xs mb-2">{getPersonaDisplay(song.persona) || 'No Persona'}</p>

        {/* Status tag */}
        <span className="tag status-completed px-2 py-0.5 text-xs rounded">
          COMPLETED
        </span>
      </div>
    </div>
  );
};
