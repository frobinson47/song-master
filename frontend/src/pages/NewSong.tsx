import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSongGeneration } from '../hooks/useSongGeneration';
import { ProgressTracker } from '../components/ProgressTracker';
import { useGenerationStore } from '../store/generationSlice';
import { Sparkles, Check } from 'lucide-react';

// Available instruments
const INSTRUMENTS = [
  '808 BEAT', 'ACOUSTIC GUITAR', 'ARPEGGIATED SYNTHS', 'BASS GUITAR', 'DELAYED GUITARS', 'DISTORTED BASS',
  'DIVA', 'ELECTRIC GUITAR', 'ELECTRIC GUITARS', 'FX RISERS', 'FEMALE', 'FILTERED SYNTH PADS',
  'FINGERSTYLE GUITAR', 'FULL ORCHESTRA', 'GRAND PIANO', 'GUITAR', 'HAMMOND ORGAN', 'HIP HOP BEAT', 'MALE',
  'MELODIC BASS', 'METAL GUITARS', 'ORGAN', 'PADS', 'POWER CHORDS', 'SYNTH LEAD', 'SYNTH RISERS', 'VIOLIN',
  'BASS', 'BASS LINE', 'CELLO', 'CHOIR', 'CINEMATIC PERCUSSION', 'CRASHING CYMBALS',
  'CROWD NOISE', 'DISTANT PIANO', 'DISTORTED GUITARS', 'DOUBLE BASS DRUM', 'DRIVING BASS', 'DRIVING DRUMS',
  'DRUMS', 'FILTERED DRUMS', 'GENTLE STRINGS', 'INDUSTRIAL PERCUSSION', 'KICK PULSE', 'LAYERED SYNTH ARPS',
  'MINIMAL PERCUSSION', 'PERCUSSION BUILD', 'PHASER EFFECTS', 'PIANO', 'POP DRUMS',
  'PULSING BASS', 'REVERB TAILS', 'RISERS', 'ROCK BAND', 'SAMPLES', 'STRINGS', 'SUBTLE PERCUSSION', 'SYNTH PADS',
  'TURNTABLE SCRATCHES', 'VINYL CRACKLE'
];

// Core styles/genres
const CORE_STYLES = [
  'None',
  'Rock', 'Pop', 'Metal', 'Hip Hop', 'Electronic', 'Jazz', 'Country', 'R&B',
  'Punk', 'Folk', 'Classical', 'Blues', 'Reggae', 'Soul', 'Funk', 'Disco',
  'Grunge', 'Indie', 'Alternative', 'Synthwave', 'Ambient'
];

// Keys
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Moods
const MOODS = [
  'happy', 'sad', 'energetic', 'calm', 'aggressive', 'romantic', 'melancholic',
  'uplifting', 'dark', 'mysterious', 'epic', 'playful', 'nostalgic', 'intense'
];

// Personas
const PERSONAS = [
  { id: 'anagram', name: 'Anagram', description: 'alt pop rock, modern rock, stadium anthem, male lead, energetic, half-spoken verses, soaring chorus, group chants, stomps, claps, bass synth, electric guitar bursts, big drums, Spatial Audio, Dolby ATMOS' },
  { id: 'antidote', name: 'Antidote', description: '80s hair metal, glam rock, arena rock, party anthem, high-energy, explosive guitar riffs, pounding drums, melodic hooks, gang vocals, power ballad dynamics, rock and roll lifestyle, catchy chorus, guitar solo, anthemic, festive, passionate, raw energy, stadium rock, glam metal swagger, Spatial Audio, Dolby Atmos mix, high-fidelity' },
  { id: 'bleached_to_perfection', name: 'Bleached To Perfection', description: 'Modern Soulful Electronic, Powerful Cynth-Rock, Hard Rock String Bending Guitar Riffs, Mezzo-soprano-heavy, female rock singer, power vocals, expressive vibrato, emotional delivery, dynamic range, rock attitude, smoky timbre, soulful grit, intense presence, Spatial Audio, Dolby Atmos mix, high-fidelity' },
];

export const NewSong: React.FC = () => {
  const navigate = useNavigate();
  const { jobId, status, reset } = useGenerationStore();
  const { startGeneration, isGenerating, error } = useSongGeneration();

  // Form state
  const [description, setDescription] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [coreStyle, setCoreStyle] = useState('None');
  const [tempo, setTempo] = useState('120');
  const [musicalKey, setMusicalKey] = useState('C');
  const [mood, setMood] = useState('happy');
  const [vocalGender, setVocalGender] = useState('auto');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [customInstruments, setCustomInstruments] = useState('');
  const [llmLocation, setLlmLocation] = useState<'remote' | 'local'>('remote');
  const [generateCoverArt, setGenerateCoverArt] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState('');
  const [album, setAlbum] = useState('');

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments(prev =>
      prev.includes(instrument)
        ? prev.filter(i => i !== instrument)
        : [...prev, instrument]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await startGeneration({
        user_input: description,
        song_name: songTitle || null,
        persona: selectedPersona || null,
        use_local: llmLocation === 'local',
      });
    } catch (err) {
      console.error('Failed to start generation:', err);
    }
  };

  const handleGenerationComplete = () => {
    reset();
    navigate('/library');
  };

  // Show progress tracker if generating
  if (status === 'generating' && jobId) {
    return (
      <div className="min-h-full bg-dark-950 p-6">
        <div className="max-w-4xl mx-auto">
          <ProgressTracker jobId={jobId} onComplete={handleGenerationComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-dark-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-slate-500 text-sm">Create</p>
          <h1 className="text-2xl font-bold text-slate-50">New Song</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Song Description */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-50 mb-4">Song Description</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="input-field resize-none"
              placeholder="Describe the song you want to create..."
              required
            />
          </div>

          {/* LLM Location */}
          <div className="card p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-3">LLM Location</h3>
            <div className="flex items-center space-x-2 mb-2">
              <button
                type="button"
                onClick={() => setLlmLocation('remote')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  llmLocation === 'remote'
                    ? 'bg-cyan-500 text-dark-950'
                    : 'bg-dark-700 text-slate-400 hover:bg-dark-600'
                }`}
              >
                Remote
              </button>
              <button
                type="button"
                onClick={() => setLlmLocation('local')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  llmLocation === 'local'
                    ? 'bg-cyan-500 text-dark-950'
                    : 'bg-dark-700 text-slate-400 hover:bg-dark-600'
                }`}
              >
                Local
              </button>
              <span className="text-slate-500 text-sm ml-2">
                Using Remote LLM (includes album art)
              </span>
            </div>

            {/* Cover Art */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Cover Art</h3>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateCoverArt}
                  onChange={(e) => setGenerateCoverArt(e.target.checked)}
                  className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-cyan-500 focus:ring-cyan-500/50"
                />
                <span className="text-slate-300 text-sm">Generate Cover Art</span>
              </label>
            </div>
          </div>

          {/* Song Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-50 mb-4">Song Details</h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Song Title */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Song Title</label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="input-field"
                  placeholder="Give your song a name"
                />
              </div>

              {/* Core Style & Genre */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Core Style & Genre</label>
                <select
                  value={coreStyle}
                  onChange={(e) => setCoreStyle(e.target.value)}
                  className="select-field"
                >
                  {CORE_STYLES.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              {/* Tempo */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Tempo (BPM)</label>
                <input
                  type="number"
                  value={tempo}
                  onChange={(e) => setTempo(e.target.value)}
                  className="input-field"
                  min="40"
                  max="240"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Key */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Key</label>
                <select
                  value={musicalKey}
                  onChange={(e) => setMusicalKey(e.target.value)}
                  className="select-field"
                >
                  {KEYS.map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Mood</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="select-field"
                >
                  {MOODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Vocal Gender */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Vocal Gender</label>
                <select
                  value={vocalGender}
                  onChange={(e) => setVocalGender(e.target.value)}
                  className="select-field"
                >
                  <option value="auto">Auto (Persona / AI choice)</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            {/* Instruments */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">Instruments</label>
              <div className="flex flex-wrap gap-2">
                {INSTRUMENTS.map(instrument => (
                  <button
                    key={instrument}
                    type="button"
                    onClick={() => toggleInstrument(instrument)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      selectedInstruments.includes(instrument)
                        ? 'bg-primary text-dark-950'
                        : 'bg-dark-700 text-slate-300 hover:bg-dark-600'
                    }`}
                  >
                    {instrument}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instruments */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Manual / Custom Instruments</label>
              <input
                type="text"
                value={customInstruments}
                onChange={(e) => setCustomInstruments(e.target.value)}
                className="input-field"
                placeholder="e.g. sitar, bagpipes, laser sounds"
              />
            </div>

            {/* Album */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Album (optional)</label>
              <select
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="select-field"
              >
                <option value="">No Album</option>
                <option value="testing">Testing</option>
              </select>
            </div>
          </div>

          {/* Persona Selection */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-50 mb-4">Persona</h2>
            <div className="space-y-3">
              {PERSONAS.map(persona => (
                <div
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedPersona === persona.id
                      ? 'border-primary bg-primary/10'
                      : 'border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-slate-50 font-semibold">{persona.name}</h3>
                      <p className="text-slate-500 text-sm mt-1">{persona.description}</p>
                    </div>
                    {selectedPersona === persona.id && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isGenerating || !description}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isGenerating ? 'Starting Generation...' : 'Generate Song'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
