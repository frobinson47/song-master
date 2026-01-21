import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSongById, deleteSong, regenerateArt, regenerateLyrics } from '../api/songs';
import { SongDetail } from '../types/song';
import { Trash2, Download, RefreshCw, Music, Copy, Check, ChevronDown } from 'lucide-react';
import { LyricsViewer } from '../components/LyricsViewer';
import { useGenerationStore } from '../store/generationSlice';

export const SongDetailPage: React.FC = () => {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const { setJobId, setStatus } = useGenerationStore();
  const [song, setSong] = useState<SongDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copiedStyles, setCopiedStyles] = useState(false);
  const [copiedExclude, setCopiedExclude] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('');
  const [regeneratingArt, setRegeneratingArt] = useState(false);
  const [regeneratingLyrics, setRegeneratingLyrics] = useState(false);

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
      setSelectedPersona(data.metadata.persona || '');
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

  const handleRegenerateArt = async () => {
    if (!songId) return;

    setRegeneratingArt(true);
    try {
      await regenerateArt(songId);
      // Wait a bit for the art to be generated, then reload
      setTimeout(() => {
        loadSong();
        setRegeneratingArt(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to regenerate art:', error);
      alert('Failed to regenerate album art');
      setRegeneratingArt(false);
    }
  };

  const handleRegenerateLyrics = async () => {
    if (!songId) return;

    if (!confirm('This will create a new song with regenerated lyrics. Continue?')) return;

    setRegeneratingLyrics(true);
    try {
      const response = await regenerateLyrics(songId);
      // Set the job in the generation store
      setJobId(response.job_id);
      setStatus('generating');
      // Navigate to the new song page to show the progress tracker
      navigate('/new');
    } catch (error) {
      console.error('Failed to regenerate lyrics:', error);
      alert('Failed to regenerate lyrics');
      setRegeneratingLyrics(false);
    }
  };

  const handleCopyStyles = () => {
    if (song?.metadata.suno_styles) {
      navigator.clipboard.writeText(song.metadata.suno_styles.join(', '));
      setCopiedStyles(true);
      setTimeout(() => setCopiedStyles(false), 2000);
    }
  };

  const handleCopyExclude = () => {
    if (song?.metadata.exclude_styles) {
      navigator.clipboard.writeText(song.metadata.exclude_styles.join(', '));
      setCopiedExclude(true);
      setTimeout(() => setCopiedExclude(false), 2000);
    }
  };

  const handleDownloadMd = () => {
    if (!song) return;
    const blob = new Blob([song.raw_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.metadata.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-500 text-sm">Song</p>
              <h1 className="text-2xl font-bold text-slate-50">{song.metadata.title}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="tag status-completed px-3 py-1">COMPLETED</span>
              <button
                onClick={handleRegenerateArt}
                disabled={regeneratingArt}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${regeneratingArt ? 'animate-spin' : ''}`} />
                <span>{regeneratingArt ? 'Regenerating...' : 'Regenerate Art'}</span>
              </button>
              <button
                onClick={handleRegenerateLyrics}
                disabled={regeneratingLyrics}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${regeneratingLyrics ? 'animate-spin' : ''}`} />
                <span>{regeneratingLyrics ? 'Regenerating...' : 'Regenerate Lyrics'}</span>
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
          <p className="text-slate-400 mb-4 text-sm">{song.metadata.description}</p>

          {/* User Prompt */}
          {song.metadata.user_prompt && (
            <div className="mb-6 p-4 bg-dark-900 rounded-lg border border-dark-700/50">
              <p className="text-xs text-slate-500 uppercase mb-1">USER PROMPT</p>
              <p className="text-slate-300 text-sm">{song.metadata.user_prompt}</p>
            </div>
          )}

          {/* Song Lyrics Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-50">Song Lyrics</h2>
              <div className="flex items-center space-x-4">
                <button className="text-slate-400 hover:text-primary text-sm">Save as New Version</button>
                <button
                  onClick={handleDownloadMd}
                  className="flex items-center space-x-1 text-slate-400 hover:text-primary text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Structured Lyrics Viewer */}
            <LyricsViewer markdown={song.raw_markdown} />
          </div>
        </div>

        {/* Right sidebar - metadata */}
        <div className="w-80 flex-shrink-0 border-l border-dark-700/50 p-6 overflow-auto max-h-screen">
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
            <div className="flex items-center space-x-2 mb-4 flex-wrap gap-2">
              <span className="tag">MODE: REMOTE</span>
              <div className="relative">
                <select
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value)}
                  className="tag appearance-none pr-6 cursor-pointer bg-dark-700"
                >
                  <option value="">PERSONA: None</option>
                  <option value="bleached_to_perfection">Bleached To Perfection</option>
                  <option value="antidote">Antidote</option>
                  <option value="anagram">Anagram</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Suno Styles */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase">SUNO STYLES</span>
                <button
                  onClick={handleCopyStyles}
                  className="text-slate-400 hover:text-primary flex items-center space-x-1"
                >
                  {copiedStyles ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
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
                  <button
                    onClick={handleCopyExclude}
                    className="text-slate-400 hover:text-primary flex items-center space-x-1"
                  >
                    {copiedExclude ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
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
                <span className="text-slate-500 text-xs uppercase">GENRE</span>
                <span className="text-slate-300">{song.metadata.genre || 'rock'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs uppercase">TEMPO / BPM</span>
                <span className="text-slate-300">{song.metadata.tempo || '120'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs uppercase">MUSICAL KEY</span>
                <span className="text-slate-300">{song.metadata.key || 'C'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs uppercase">EMOTIONAL ARC</span>
                <span className="text-slate-300">{song.metadata.emotional_arc || 'energetic'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs uppercase">INSTRUMENTS</span>
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
