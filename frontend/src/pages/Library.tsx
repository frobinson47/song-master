import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSongs } from '../api/songs';
import { SongCard } from '../components/SongCard';
import { useSongsStore } from '../store/songsSlice';
import {
  Search, LayoutGrid, List, ChevronRight, Plus, Trash2, Import, Sparkles,
  Music, Library as LibraryIcon, Folder, Calendar, TrendingUp, Filter, SortAsc
} from 'lucide-react';
import { FloatingActionButton } from '../components/FloatingActionButton';

interface Album {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const { songs, loading, setSongs, setLoading } = useSongsStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPersona, setFilterPersona] = useState('all');
  const [filterTime, setFilterTime] = useState('all');

  // Mock albums - persisted in localStorage
  const [albums, setAlbums] = useState<Album[]>(() => {
    const stored = localStorage.getItem('albums');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      { id: '1', name: 'Testing', description: 'This is a test album!', createdAt: '2026-01-03' }
    ];
  });
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null);

  const handleDeleteAlbum = (albumId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent expanding/collapsing the album
    if (confirm('Are you sure you want to delete this album?')) {
      const updatedAlbums = albums.filter(album => album.id !== albumId);
      setAlbums(updatedAlbums);
      localStorage.setItem('albums', JSON.stringify(updatedAlbums));
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    setLoading(true);
    try {
      const data = await getSongs();
      setSongs(data);
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await getSongs({ search: search || undefined });
      setSongs(data);
    } catch (error) {
      console.error('Failed to search songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredSongs = songs.filter(song => {
    if (filterStatus !== 'all') {
      // Filter by status if implemented
    }
    if (filterPersona !== 'all' && song.persona !== filterPersona) {
      return false;
    }
    return true;
  });

  const sortedSongs = [...filteredSongs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-full bg-dark-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <LibraryIcon className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-500 text-sm uppercase tracking-wide">Workspace</p>
                <h1 className="text-4xl md:text-5xl font-bold gradient-text-purple">Your Library</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="btn-secondary flex items-center space-x-2">
                <Import className="w-4 h-4" />
                <span>Import</span>
              </button>
              <button
                onClick={() => navigate('/new')}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Song</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Total Songs</p>
                  <p className="text-2xl font-bold gradient-text">{songs.length}</p>
                </div>
              </div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/10 border-purple-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-purple-500/10 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Albums</p>
                  <p className="text-2xl font-bold gradient-text-purple">{albums.length}</p>
                </div>
              </div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10 border-cyan-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/30 to-cyan-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">This Week</p>
                  <p className="text-2xl font-bold gradient-text-cool">
                    {songs.filter(s => {
                      const created = new Date(s.created_at);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return created > weekAgo;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Albums Section */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-purple-500/10 flex items-center justify-center">
                <Folder className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold gradient-text-purple">Albums</h2>
            </div>
            <button className="btn-secondary flex items-center space-x-2 text-sm">
              <Plus className="w-4 h-4" />
              <span>New Album</span>
            </button>
          </div>

          <div className="space-y-2">
            {albums.map((album) => (
              <div key={album.id}>
                <div
                  className="flex items-center justify-between p-4 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 border border-dark-700/50 hover:border-purple-500/30 cursor-pointer transition-all group"
                  onClick={() => setExpandedAlbum(expandedAlbum === album.id ? null : album.id)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <ChevronRight
                      className={`w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-all ${
                        expandedAlbum === album.id ? 'rotate-90' : ''
                      }`}
                    />
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <Folder className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-slate-50 font-semibold text-lg group-hover:text-purple-400 transition-colors">
                        {album.name}
                      </h3>
                      <p className="text-slate-500 text-sm">{album.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-slate-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(album.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteAlbum(album.id, e)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                      title="Delete album"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {expandedAlbum === album.id && (
                  <div className="ml-16 mt-2 p-4 bg-dark-900/50 rounded-lg border border-dark-700/50">
                    <p className="text-slate-400 text-sm">No songs in this album yet. Drag and drop songs here to organize them.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search by title, artist, genre, or style tags..."
                className="input-field pl-12 text-lg"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    loadSongs();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="btn-primary px-6"
            >
              Search
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-slate-400">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-semibold">Filters:</span>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select-field w-36 text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={filterPersona}
                onChange={(e) => setFilterPersona(e.target.value)}
                className="select-field w-44 text-sm"
              >
                <option value="all">All Personas</option>
                <option value="antidote">Antidote</option>
                <option value="bleached_to_perfection">Bleached To Perfection</option>
                <option value="anagram">Anagram</option>
              </select>

              <select
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
                className="select-field w-32 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Sort and View */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-slate-400">
                <SortAsc className="w-4 h-4" />
                <span className="text-sm font-semibold">Sort:</span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select-field w-36 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
              </select>

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
            </div>
          </div>
        </div>

        {/* Songs Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Music className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-2xl font-bold gradient-text">
              All Songs
              <span className="text-slate-500 font-normal ml-2">({sortedSongs.length})</span>
            </h2>
          </div>
          {sortedSongs.length > 0 && (
            <p className="text-slate-500 text-sm">
              Showing {sortedSongs.length} of {songs.length} songs
            </p>
          )}
        </div>

        {/* Song grid/list */}
        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
        ) : sortedSongs.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700/30 to-slate-800/30 flex items-center justify-center mx-auto mb-4">
              <Music className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">No songs found</h3>
            <p className="text-slate-500 mb-6">
              {search || filterPersona !== 'all' || filterTime !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Get started by creating your first AI-generated song!'}
            </p>
            {!search && filterPersona === 'all' && filterTime === 'all' && (
              <button
                onClick={() => navigate('/new')}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Your First Song</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedSongs.map((song) => (
              <SongCard key={song.filename} song={song} viewMode="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSongs.map((song) => (
              <SongCard key={song.filename} song={song} viewMode="list" />
            ))}
          </div>
        )}

        {/* Load more button (if needed) */}
        {sortedSongs.length > 0 && sortedSongs.length % 24 === 0 && (
          <div className="text-center mt-6">
            <button className="btn-secondary">
              More Songs ({sortedSongs.length} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={Sparkles}
        onClick={() => navigate('/new')}
        label="Create New Song"
      />
    </div>
  );
};
