import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSongs } from '../api/songs';
import { SongMetadata } from '../types/song';
import { Sparkles, Library, Music, TrendingUp, Clock, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { ParticleBackground } from '../components/ParticleBackground';
import { SongCard } from '../components/SongCard';

export const Home: React.FC = () => {
  const [recentSongs, setRecentSongs] = useState<SongMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
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
        <div className="text-center mb-12 relative">
          <ParticleBackground />
          <h1 className="text-5xl md:text-6xl font-bold text-slate-50 mb-4 relative z-10">
            Welcome to <span className="gradient-text">Song Forge</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            AI-powered song generation with <span className="text-primary font-semibold">Claude</span>, <span className="text-[#FFB84D] font-semibold">GPT</span>, and <span className="text-[#FFB84D] font-semibold">Gemini</span>.
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
          <div className="card p-6 gradient-border-primary animate-fadeIn">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/20">
                <Music className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide">Total Songs</p>
                <p className="text-3xl font-bold gradient-text">{stats.totalSongs}</p>
              </div>
            </div>
          </div>

          <div className="card p-6 gradient-border-warm animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#F5A623]/30 to-[#F5A623]/10 flex items-center justify-center shadow-lg shadow-[#F5A623]/20">
                <TrendingUp className="w-7 h-7 text-[#F5A623]" />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide">This Week</p>
                <p className="text-3xl font-bold gradient-text">{stats.thisWeek}</p>
              </div>
            </div>
          </div>

          <div className="card p-6 gradient-border-warm animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center shadow-lg shadow-green-500/20">
                <Clock className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide">Personas</p>
                <p className="text-3xl font-bold gradient-text-warm">{stats.personas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Songs */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold gradient-text">Recent Songs</h2>
            <div className="flex items-center space-x-3">
              {/* View switcher */}
              <div className="flex items-center bg-dark-800 rounded-md border border-dark-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-l-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-dark-950'
                      : 'text-slate-400 hover:text-slate-50'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-r-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-dark-950'
                      : 'text-slate-400 hover:text-slate-50'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <Link
                to="/library"
                className="text-primary hover:text-primary-400 flex items-center space-x-1 text-sm font-medium transition-colors"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {loading ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card overflow-hidden">
                    <div className="aspect-square w-full skeleton animate-shimmer"></div>
                    <div className="p-4 space-y-2">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-text w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="card p-4 flex items-center space-x-4">
                    <div className="skeleton-circle w-16 h-16"></div>
                    <div className="flex-1 space-y-2">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-text w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : recentSongs.length === 0 ? (
            <div className="text-center py-8">
              <Music className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">No songs yet. Create your first song!</p>
              <Link to="/new" className="btn-primary mt-4 inline-flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Create Song</span>
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentSongs.map((song) => (
                <SongCard key={song.filename} song={song} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {recentSongs.map((song) => (
                <SongCard key={song.filename} song={song} viewMode="list" />
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
