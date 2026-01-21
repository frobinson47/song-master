import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSongById, deleteSong, generateImagePrompt, regenerateLyrics, uploadAlbumArt } from '../api/songs';
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

  const handleGenerateImagePrompt = async () => {
    if (!songId) return;

    setGeneratingPrompt(true);
    try {
      const response = await generateImagePrompt(songId);
      // Use the copy_ready_prompt directly (already formatted JSON)
      setImagePrompt(response.copy_ready_prompt);
      setShowPromptModal(true);

      // Also copy to clipboard automatically
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

  const handleUploadArt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!songId || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingArt(true);
    try {
      await uploadAlbumArt(songId, file);
      // Reload the song to show the new album art
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
                onClick={handleGenerateImagePrompt}
                disabled={generatingPrompt}
                className="btn-secondary flex items-center space-x-2"
              >
                <Copy className={`w-4 h-4`} />
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
          <div className="card p-6 mb-6">
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
            <LyricsViewer markdown={song.raw_markdown.replace(/\n## Image Blueprint\n[\s\S]*$/, '')} />
          </div>

          {/* Image Blueprint Card (if exists) */}
          {song.raw_markdown.includes('## Image Blueprint') && (
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-50">Album Art Image Blueprint</h2>
                <button
                  onClick={() => {
                    const parts = song.raw_markdown.split('## Image Blueprint');
                    if (parts.length > 1) {
                      navigator.clipboard.writeText(parts[1].trim());
                    }
                  }}
                  className="flex items-center space-x-1 text-slate-400 hover:text-primary text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Blueprint</span>
                </button>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                AI-generated blueprint ready to paste into ChatGPT, Gemini, Sora, or any image generator.
              </p>
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
                className="w-full btn-primary text-sm"
              >
                {uploadingArt ? 'Uploading...' : 'Upload Album Art'}
              </button>
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

      {/* Image Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-lg max-w-2xl w-full p-6 border border-dark-700">
            <h2 className="text-xl font-bold text-slate-50 mb-4">Album Art Image Prompt Generated!</h2>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
              <p className="text-green-400 text-sm flex items-center">
                <Check className="w-4 h-4 mr-2" />
                Saved to song markdown file and copied to clipboard!
              </p>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              This prompt has been saved to your song file and is ready to paste into ChatGPT, Gemini, Sora, or any AI image generator.
              You can also view it on the song page below or in the downloaded markdown.
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
                  loadSong(); // Reload to show the blueprint on the page
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
