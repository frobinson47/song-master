import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSongs } from '../api/songs';
import { SongCard } from '../components/SongCard';
import { useSongsStore } from '../store/songsSlice';
import { Search, LayoutGrid, List, ChevronRight, Plus, Trash2, Import } from 'lucide-react';

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-500 text-sm">Workspace</p>
            <h1 className="text-3xl font-bold gradient-text-purple">Albums & Songs</h1>
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

        {/* Albums Section */}
        <div className="card p-4 mb-6">
          <h2 className="text-xl font-bold gradient-text-warm mb-4">Albums</h2>

          {albums.map((album) => (
            <div key={album.id} className="mb-2">
              <div
                className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-700/50 cursor-pointer transition-colors"
                onClick={() => setExpandedAlbum(expandedAlbum === album.id ? null : album.id)}
              >
                <div className="flex items-center space-x-3">
                  <ChevronRight
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      expandedAlbum === album.id ? 'rotate-90' : ''
                    }`}
                  />
                  <div>
                    <h3 className="text-slate-50 font-medium">{album.name}</h3>
                    <p className="text-slate-500 text-sm">{album.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-slate-500 text-sm">Created: {album.createdAt}</span>
                  <button
                    onClick={(e) => handleDeleteAlbum(album.id, e)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button className="flex items-center space-x-2 text-slate-400 hover:text-primary transition-colors mt-2 p-2">
            <Plus className="w-4 h-4" />
            <span>Create New Album</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search songs..."
                className="input-field pl-10"
              />
            </div>

            {/* Filters */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select-field w-32"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={filterPersona}
              onChange={(e) => setFilterPersona(e.target.value)}
              className="select-field w-36"
            >
              <option value="all">All Personas</option>
              <option value="antidote">Antidote</option>
              <option value="bleached_to_perfection">Bleached To Perfection</option>
              <option value="anagram">Anagram</option>
            </select>

            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="select-field w-28"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Sort and View */}
          <div className="flex items-center space-x-3 ml-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select-field w-36"
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
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Songs Count */}
        <h2 className="text-lg font-semibold text-slate-50 mb-4">
          Songs ({sortedSongs.length})
        </h2>

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
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No songs found. Generate your first song!</p>
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
    </div>
  );
};
