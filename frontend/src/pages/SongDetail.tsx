import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSongById, deleteSong, generateImagePrompt, regenerateLyrics, uploadAlbumArt } from '../api/songs';
import { SongDetail } from '../types/song';
import {
  Trash2, Download, RefreshCw, Music, Copy, Check, ChevronDown,
  ArrowLeft, Image, Sparkles, Upload, Disc, Tag, TrendingUp, Users
} from 'lucide-react';
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
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [regeneratingLyrics, setRegeneratingLyrics] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [uploadingArt, setUploadingArt] = useState(false);

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
    if (!songId || !confirm('Are you sure you want to delete this song? This action cannot be undone.')) return;

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

  const handleGenerateImagePrompt = async () => {
    if (!songId) return;

    setGeneratingPrompt(true);
    try {
      const response = await generateImagePrompt(songId);
      setImagePrompt(response.copy_ready_prompt);
      setShowPromptModal(true);
      await navigator.clipboard.writeText(response.copy_ready_prompt);
    } catch (error: any) {
      console.error('Failed to generate image prompt:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to generate image prompt';
      alert(errorMessage);
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(imagePrompt);
  };

  const handleRegenerateLyrics = async () => {
    if (!songId) return;

    if (!confirm('This will create a new song with regenerated lyrics. Continue?')) return;

    setRegeneratingLyrics(true);
    try {
      const response = await regenerateLyrics(songId);
      setJobId(response.job_id);
      setStatus('generating');
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

  const handleUploadArt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!songId || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingArt(true);
    try {
      await uploadAlbumArt(songId, file);
      await loadSong();
      alert('Album art uploaded successfully!');
    } catch (error: any) {
      console.error('Failed to upload album art:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to upload album art';
      alert(errorMessage);
    } finally {
      setUploadingArt(false);
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

  const handleDownloadAlbumArt = () => {
    if (!song?.metadata.album_art_url) return;
    const a = document.createElement('a');
    a.href = `http://localhost:8000${song.metadata.album_art_url}`;
    a.download = `${song.metadata.title.replace(/[^a-z0-9]/gi, '_')}_cover.png`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-full bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-[#FFB84D]/30 flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
          <p className="text-slate-400">Loading song...</p>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-full bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-slate-600 mx-auto mb-4" />
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
          {/* Back Button */}
          <button
            onClick={() => navigate('/library')}
            className="flex items-center space-x-2 text-slate-400 hover:text-primary transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Library</span>
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-bold gradient-text">{song.metadata.title}</h1>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold rounded-full">
                    COMPLETED
                  </span>
                </div>
                <p className="text-slate-400 text-lg">{song.metadata.description}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGenerateImagePrompt}
                disabled={generatingPrompt}
                className="btn-secondary flex items-center space-x-2"
              >
                <Image className="w-4 h-4" />
                <span>{generatingPrompt ? 'Generating...' : 'Create Image Prompt'}</span>
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
                onClick={handleDownloadMd}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download .md</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger flex items-center space-x-2 ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>

          {/* User Prompt */}
          {song.metadata.user_prompt && (
            <div className="mb-6 card p-4 bg-gradient-to-r from-primary/10 to-[#FFB84D]/10 border-primary/30">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-xs text-primary uppercase font-semibold">Original Prompt</p>
              </div>
              <p className="text-slate-300">{song.metadata.user_prompt}</p>
            </div>
          )}

          {/* Song Lyrics Card */}
          <div className="card p-6 mb-6 gradient-border-primary">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-50">Song Lyrics</h2>
            </div>

            {/* Structured Lyrics Viewer */}
            <LyricsViewer markdown={song.raw_markdown.replace(/\n## Image Blueprint\n[\s\S]*$/, '')} />
          </div>

          {/* Image Blueprint Card (if exists) */}
          {song.raw_markdown.includes('## Image Blueprint') && (
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5A623]/30 to-[#F5A623]/10 flex items-center justify-center">
                    <Image className="w-5 h-5 text-[#F5A623]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-50">Album Art Image Blueprint</h2>
                    <p className="text-slate-500 text-sm">Ready for ChatGPT, Gemini, Sora, or any AI image generator</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const parts = song.raw_markdown.split('## Image Blueprint');
                    if (parts.length > 1) {
                      navigator.clipboard.writeText(parts[1].trim());
                    }
                  }}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Blueprint</span>
                </button>
              </div>
              <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 max-h-96 overflow-y-auto">
                <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono">
                  {(() => {
                    const parts = song.raw_markdown.split('## Image Blueprint');
                    return parts.length > 1 ? parts[1].trim() : '';
                  })()}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - metadata */}
        <div className="w-96 flex-shrink-0 border-l border-dark-700/50 p-6 overflow-auto max-h-screen space-y-6">
          {/* Album Art */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-50 flex items-center space-x-2">
                <Disc className="w-4 h-4 text-primary" />
                <span>Album Art</span>
              </h3>
              {song.metadata.album_art_url && (
                <button
                  onClick={handleDownloadAlbumArt}
                  className="text-slate-400 hover:text-primary text-xs flex items-center space-x-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              )}
            </div>
            <div className="aspect-square w-full rounded-lg overflow-hidden bg-gradient-to-br from-dark-800 to-dark-900 border-2 border-dark-700 relative group">
              {song.metadata.album_art_url ? (
                <>
                  <img
                    src={`http://localhost:8000${song.metadata.album_art_url}`}
                    alt="Album Art"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-medium">Click to replace</p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Music className="w-16 h-16 text-slate-600 mb-2" />
                  <p className="text-slate-500 text-sm">No album art</p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <input
                type="file"
                id="album-art-upload"
                accept="image/*"
                onChange={handleUploadArt}
                className="hidden"
              />
              <button
                onClick={() => document.getElementById('album-art-upload')?.click()}
                disabled={uploadingArt}
                className="w-full btn-primary text-sm flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>{uploadingArt ? 'Uploading...' : 'Upload Album Art'}</span>
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="card p-4">
            <h3 className="text-sm font-bold text-slate-50 mb-4 flex items-center space-x-2">
              <Tag className="w-4 h-4 text-primary" />
              <span>Metadata</span>
            </h3>

            {/* Mode and Persona */}
            <div className="flex items-center space-x-2 mb-4 flex-wrap gap-2">
              <span className="px-3 py-1 bg-amber-500/20 text-[#F5A623] border border-amber-500/30 text-xs font-semibold rounded-full">
                MODE: REMOTE
              </span>
              <div className="relative">
                <select
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value)}
                  className="px-3 py-1 bg-amber-500/20 text-[#F5A623] border border-amber-500/30 text-xs font-semibold rounded-full appearance-none pr-6 cursor-pointer"
                >
                  <option value="">PERSONA: None</option>
                  <option value="bleached_to_perfection">Bleached To Perfection</option>
                  <option value="antidote">Antidote</option>
                  <option value="anagram">Anagram</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-[#F5A623] pointer-events-none" />
              </div>
            </div>

            {/* Suno Styles */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Suno Styles</span>
                <button
                  onClick={handleCopyStyles}
                  className="text-slate-400 hover:text-primary flex items-center space-x-1 transition-colors"
                >
                  {copiedStyles ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span className="text-xs">{copiedStyles ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {song.metadata.suno_styles?.map((style, idx) => (
                  <span key={idx} className="px-2 py-1 bg-amber-500/20 text-[#F5A623] border border-amber-500/30 text-xs rounded-md font-medium">
                    {style}
                  </span>
                ))}
              </div>
            </div>

            {/* Exclude Styles */}
            {song.metadata.exclude_styles && song.metadata.exclude_styles.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Exclude Styles</span>
                  <button
                    onClick={handleCopyExclude}
                    className="text-slate-400 hover:text-primary flex items-center space-x-1 transition-colors"
                  >
                    {copiedExclude ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    <span className="text-xs">{copiedExclude ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {song.metadata.exclude_styles.map((style, idx) => (
                    <span key={idx} className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-xs rounded-md font-medium">
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Other metadata */}
            <div className="space-y-3 pt-4 border-t border-dark-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs uppercase font-semibold">Genre</span>
                <span className="text-slate-300 text-sm font-medium">{song.metadata.genre || 'Rock'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs uppercase font-semibold">Tempo / BPM</span>
                <span className="text-slate-300 text-sm font-medium">{song.metadata.tempo || '120'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs uppercase font-semibold">Musical Key</span>
                <span className="text-slate-300 text-sm font-medium">{song.metadata.key || 'C'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs uppercase font-semibold">Emotional Arc</span>
                <span className="text-slate-300 text-sm font-medium">{song.metadata.emotional_arc || 'Energetic'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs uppercase font-semibold">Instruments</span>
                <span className="text-slate-300 text-sm font-medium truncate ml-2" title={song.metadata.instruments}>
                  {song.metadata.instruments || 'Guitar'}
                </span>
              </div>
            </div>
          </div>

          {/* Target Audience */}
          {song.metadata.target_audience && (
            <div className="card p-4">
              <h3 className="text-sm font-bold text-slate-50 mb-2 flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Target Audience</span>
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{song.metadata.target_audience}</p>
            </div>
          )}

          {/* Commercial Assessment */}
          {song.metadata.commercial_assessment && (
            <div className="card p-4">
              <h3 className="text-sm font-bold text-slate-50 mb-2 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Commercial Assessment</span>
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{song.metadata.commercial_assessment}</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-dark-900 border border-dark-700 rounded-lg shadow-2xl max-w-3xl w-full p-6 animate-scaleIn">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-50">Image Prompt Generated!</h2>
                <p className="text-slate-500 text-sm">Ready to use in any AI image generator</p>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
              <p className="text-green-400 text-sm flex items-center">
                <Check className="w-4 h-4 mr-2" />
                Saved to song markdown file and copied to clipboard!
              </p>
            </div>

            <p className="text-slate-400 text-sm mb-4">
              This prompt has been saved to your song file and is ready to paste into ChatGPT, Gemini, Sora, or any AI image generator.
            </p>

            <div className="bg-dark-800 rounded-lg p-4 mb-4 border border-dark-700 max-h-64 overflow-y-auto">
              <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono">{imagePrompt}</pre>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleCopyPrompt}
                className="btn-secondary flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Again</span>
              </button>
              <button
                onClick={() => {
                  setShowPromptModal(false);
                  loadSong();
                }}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
