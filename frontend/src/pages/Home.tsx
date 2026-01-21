import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSongs } from '../api/songs';
import { SongMetadata } from '../types/song';
import { Sparkles, Library, Music, TrendingUp, Clock, ChevronRight } from 'lucide-react';

export const Home: React.FC = () => {
  const [recentSongs, setRecentSongs] = useState<SongMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSongs: 0,
    thisWeek: 0,
    personas: 3,
  });

  useEffect(() => {
    loadRecentSongs();
  }, []);

  const loadRecentSongs = async () => {
    try {
      const data = await getSongs();
      setRecentSongs(data.slice(0, 5));
      setStats(prev => ({
        ...prev,
        totalSongs: data.length,
        thisWeek: data.filter(s => {
          const created = new Date(s.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length,
      }));
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-dark-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-50 mb-4">
            Welcome to <span className="text-primary">Song Master</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
            AI-powered song generation with Claude, GPT, and Gemini.
            Create professional lyrics with style tags, metadata, and album art.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              to="/new"
              className="btn-primary flex items-center space-x-2 px-8 py-3 text-lg"
            >
              <Sparkles className="w-5 h-5" />
              <span>Create New Song</span>
            </Link>
            <Link
              to="/library"
              className="btn-secondary flex items-center space-x-2 px-8 py-3 text-lg"
            >
              <Library className="w-5 h-5" />
              <span>View Library</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-slate-500 text-sm">Total Songs</p>
                <p className="text-2xl font-bold text-slate-50">{stats.totalSongs}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-500 text-sm">This Week</p>
                <p className="text-2xl font-bold text-slate-50">{stats.thisWeek}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-slate-500 text-sm">Personas</p>
                <p className="text-2xl font-bold text-slate-50">{stats.personas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Songs */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-50">Recent Songs</h2>
            <Link
              to="/library"
              className="text-primary hover:text-primary-400 flex items-center space-x-1 text-sm font-medium"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : recentSongs.length === 0 ? (
            <div className="text-center py-8">
              <Music className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">No songs yet. Create your first song!</p>
              <Link to="/new" className="btn-primary mt-4 inline-flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Create Song</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSongs.map((song) => (
                <Link
                  key={song.filename}
                  to={`/song/${song.filename}`}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-dark-700/50 transition-colors"
                >
                  {/* Album art */}
                  <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                    {song.album_art_url ? (
                      <img
                        src={`http://localhost:8000${song.album_art_url}`}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-cyan-500/30 flex items-center justify-center">
                        <Music className="w-5 h-5 text-primary/70" />
                      </div>
                    )}
                  </div>

                  {/* Song info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-50 font-medium truncate">{song.title}</h3>
                    <p className="text-slate-500 text-sm">
                      {song.persona ? song.persona.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'No Persona'}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="text-slate-500 text-sm">
                    {new Date(song.created_at).toLocaleDateString()}
                  </div>

                  {/* Status */}
                  <span className="tag status-completed px-2 py-1 text-xs rounded">
                    COMPLETED
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-50 mb-2">Quick Tips</h3>
            <ul className="text-slate-400 text-sm space-y-2">
              <li>• Be descriptive in your song prompts for better results</li>
              <li>• Use personas to maintain consistent style across songs</li>
              <li>• Remote LLM mode includes automatic album art generation</li>
              <li>• Export your songs as markdown files for backup</li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-50 mb-2">Keyboard Shortcuts</h3>
            <div className="text-slate-400 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span>New Song</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-xs font-mono">Ctrl + N</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Library</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-xs font-mono">Ctrl + L</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Search</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-xs font-mono">Ctrl + K</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
