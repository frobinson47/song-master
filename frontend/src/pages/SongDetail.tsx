import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSongById, deleteSong } from '../api/songs';
import { SongDetail } from '../types/song';
import { Trash2, Download, RefreshCw, Music, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const SongDetailPage: React.FC = () => {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<SongDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyStyles = () => {
    if (song?.metadata.suno_styles) {
      navigator.clipboard.writeText(song.metadata.suno_styles.join(', '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-full bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-4">Song not found</p>
          <button
            onClick={() => navigate('/library')}
            className="btn-primary"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-dark-950">
      <div className="flex">
        {/* Main content - lyrics */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-500 text-sm">Song</p>
              <h1 className="text-2xl font-bold text-slate-50">{song.metadata.title}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="tag status-completed px-3 py-1">COMPLETED</span>
              <button className="btn-secondary flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate Art</span>
              </button>
              <button className="btn-secondary flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate Lyrics</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-slate-400 mb-6">{song.metadata.description}</p>

          {/* Song Lyrics Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-50">Song Lyrics</h2>
              <div className="flex items-center space-x-2">
                <button className="text-slate-400 hover:text-primary text-sm">Save as New Version</button>
                <button className="flex items-center space-x-1 text-slate-400 hover:text-primary text-sm">
                  <Download className="w-4 h-4" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Markdown content */}
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{song.raw_markdown}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Right sidebar - metadata */}
        <div className="w-80 flex-shrink-0 border-l border-dark-700/50 p-6 overflow-auto">
          {/* Album Art */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-400">Album Art</h3>
              <button className="text-slate-400 hover:text-primary text-sm flex items-center space-x-1">
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            </div>
            <div className="aspect-square w-full rounded-lg overflow-hidden bg-dark-800">
              {song.metadata.album_art_url ? (
                <img
                  src={`http://localhost:8000${song.metadata.album_art_url}`}
                  alt="Album Art"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-16 h-16 text-slate-600" />
                </div>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <button className="w-full btn-secondary text-sm">Choose Image</button>
              <button className="w-full btn-primary text-sm">Upload Art</button>
            </div>
          </div>

          {/* Live Listen Feedback */}
          <div className="mb-6 card p-4">
            <h3 className="text-sm font-medium text-slate-50 mb-2">Live Listen Feedback</h3>
            <p className="text-slate-500 text-xs mb-3">
              Upload an MP3 of your current generated song. The AI will listen and provide feedback to improve the lyrics fit.
            </p>
            <button className="w-full btn-secondary text-sm mb-2">Choose MP3</button>
            <button className="w-full btn-primary text-sm">Submit for Feedback</button>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">Metadata</h3>

            {/* Mode and Persona */}
            <div className="flex items-center space-x-2 mb-4">
              <span className="tag">MODE: REMOTE</span>
              <span className="tag">PERSONA: {song.metadata.persona || 'None'}</span>
            </div>

            {/* Suno Styles */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase">SUNO STYLES</span>
                <button
                  onClick={handleCopyStyles}
                  className="text-slate-400 hover:text-primary flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span className="text-xs">Copy</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {song.metadata.suno_styles?.map((style, idx) => (
                  <span key={idx} className="tag-cyan text-xs">{style}</span>
                ))}
              </div>
            </div>

            {/* Exclude Styles */}
            {song.metadata.exclude_styles && song.metadata.exclude_styles.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 uppercase">EXCLUDE</span>
                  <button className="text-slate-400 hover:text-primary flex items-center space-x-1">
                    <Copy className="w-3 h-3" />
                    <span className="text-xs">Copy</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {song.metadata.exclude_styles.map((style, idx) => (
                    <span key={idx} className="tag text-xs bg-red-500/20 text-red-400 border border-red-500/30">{style}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Other metadata */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">GENRE</span>
                <span className="text-slate-300">{song.metadata.genre || 'rock'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TEMPO / BPM</span>
                <span className="text-slate-300">{song.metadata.tempo || '120'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MUSICAL KEY</span>
                <span className="text-slate-300">{song.metadata.key || 'C'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">EMOTIONAL ARC</span>
                <span className="text-slate-300">{song.metadata.emotional_arc || 'energetic'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">INSTRUMENTS</span>
                <span className="text-slate-300">{song.metadata.instruments || 'guitar'}</span>
              </div>
            </div>

            {/* Target Audience */}
            {song.metadata.target_audience && (
              <div className="mt-4">
                <span className="text-xs text-slate-500 uppercase block mb-1">TARGET AUDIENCE</span>
                <p className="text-slate-400 text-xs">{song.metadata.target_audience}</p>
              </div>
            )}

            {/* Commercial Assessment */}
            {song.metadata.commercial_assessment && (
              <div className="mt-4">
                <span className="text-xs text-slate-500 uppercase block mb-1">COMMERCIAL ASSESSMENT</span>
                <p className="text-slate-400 text-xs">{song.metadata.commercial_assessment}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
