import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SongMetadata } from '../types/song';

interface SongCardProps {
  song: SongMetadata;
}

export const SongCard: React.FC<SongCardProps> = ({ song }) => {
  const navigate = useNavigate();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      onClick={() => navigate(`/song/${song.filename}`)}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Album art */}
      {song.album_art_url ? (
        <img
          src={`http://localhost:8000${song.album_art_url}`}
          alt={song.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <svg className="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{song.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{song.description}</p>

        {/* Styles tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {song.suno_styles.slice(0, 3).map((style, idx) => (
            <span
              key={idx}
              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
            >
              {style}
            </span>
          ))}
          {song.suno_styles.length > 3 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              +{song.suno_styles.length - 3}
            </span>
          )}
        </div>

        {/* Date */}
        <div className="text-xs text-gray-500">{formatDate(song.created_at)}</div>
      </div>
    </div>
  );
};
