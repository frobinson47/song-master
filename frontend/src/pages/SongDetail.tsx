import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSongById, deleteSong } from '../api/songs';
import { SongViewer } from '../components/SongViewer';
import { SongDetail } from '../types/song';

export const SongDetailPage: React.FC = () => {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<SongDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (songId) {
      loadSong();
    }
  }, [songId]);

  const loadSong = async () => {
    if (!songId) return;

    setLoading(true);
    try {
      const data = await getSongById(songId);
      setSong(data);
    } catch (error) {
      console.error('Failed to load song:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!songId || !confirm('Are you sure you want to delete this song?')) return;

    setDeleting(true);
    try {
      await deleteSong(songId);
      navigate('/library');
    } catch (error) {
      console.error('Failed to delete song:', error);
      alert('Failed to delete song');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Song not found</p>
          <button
            onClick={() => navigate('/library')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/library')}
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            {deleting ? 'Deleting...' : 'Delete Song'}
          </button>
        </div>
      </div>

      <SongViewer markdown={song.raw_markdown} albumArtUrl={song.metadata.album_art_url || undefined} />
    </div>
  );
};
