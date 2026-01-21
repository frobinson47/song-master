import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSongGeneration } from '../hooks/useSongGeneration';
import { ProgressTracker } from '../components/ProgressTracker';
import { useGenerationStore } from '../store/generationSlice';
import {
  Sparkles, Check, Music, Disc, Sliders, Users, Wand2,
  Search, X, Server, Wifi, Image as ImageIcon
} from 'lucide-react';

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
  const [instrumentSearch, setInstrumentSearch] = useState('');

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

  const filteredInstruments = INSTRUMENTS.filter(inst =>
    inst.toLowerCase().includes(instrumentSearch.toLowerCase())
  );

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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30 mb-4">
            <Wand2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">Create New Song</h1>
          <p className="text-slate-400 text-lg">Transform your ideas into music with AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Song Description */}
          <div className="card p-6 gradient-border-primary">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-50">Song Description</h2>
                <p className="text-slate-500 text-sm">What kind of song do you want to create?</p>
              </div>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="input-field resize-none"
              placeholder="Example: A high-energy rock anthem about overcoming challenges, with powerful vocals and electric guitar solos..."
              required
            />
            <p className="text-slate-500 text-xs mt-2">
              💡 Tip: Be specific about the theme, mood, and story you want to tell
            </p>
          </div>

          {/* AI Configuration */}
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/30 to-cyan-500/10 flex items-center justify-center">
                <Server className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-50">AI Configuration</h2>
                <p className="text-slate-500 text-sm">Choose your generation settings</p>
              </div>
            </div>

            {/* LLM Location Toggle */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">LLM Location</h3>
              <div className="inline-flex items-center bg-dark-800 rounded-lg border border-dark-700 p-1">
                <button
                  type="button"
                  onClick={() => setLlmLocation('remote')}
                  className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
                    llmLocation === 'remote'
                      ? 'bg-cyan-500 text-dark-950 shadow-lg'
                      : 'text-slate-400 hover:text-slate-50'
                  }`}
                >
                  <Wifi className="w-4 h-4" />
                  <span>Remote</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLlmLocation('local')}
                  className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
                    llmLocation === 'local'
                      ? 'bg-cyan-500 text-dark-950 shadow-lg'
                      : 'text-slate-400 hover:text-slate-50'
                  }`}
                >
                  <Server className="w-4 h-4" />
                  <span>Local</span>
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-2">
                {llmLocation === 'remote' ? '☁️ Using cloud AI (includes album art generation)' : '💻 Using local LM Studio'}
              </p>
            </div>

            {/* Cover Art Toggle */}
            {llmLocation === 'remote' && (
              <div className="bg-dark-800/50 border border-dark-700 p-4 rounded-lg">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={generateCoverArt}
                      onChange={(e) => setGenerateCoverArt(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-slate-300 text-sm font-medium">Generate Album Art</span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Song Details */}
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-purple-500/10 flex items-center justify-center">
                <Sliders className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-50">Song Details</h2>
                <p className="text-slate-500 text-sm">Fine-tune your song's characteristics</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Song Title (Optional)</label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    className="input-field"
                    placeholder="Leave empty for AI-generated title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Genre</label>
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
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tempo (BPM)</label>
                  <input
                    type="number"
                    value={tempo}
                    onChange={(e) => setTempo(e.target.value)}
                    className="input-field"
                    min="40"
                    max="240"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Key</label>
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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mood</label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="select-field"
                  >
                    {MOODS.map(m => (
                      <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Vocal Gender</label>
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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Album (Optional)</label>
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
            </div>
          </div>

          {/* Instruments */}
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center">
                <Disc className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-50">Instruments</h2>
                <p className="text-slate-500 text-sm">Select instruments for your song</p>
              </div>
              {selectedInstruments.length > 0 && (
                <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-semibold rounded-full">
                  {selectedInstruments.length} selected
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={instrumentSearch}
                onChange={(e) => setInstrumentSearch(e.target.value)}
                className="input-field pl-10 pr-10"
                placeholder="Search instruments..."
              />
              {instrumentSearch && (
                <button
                  type="button"
                  onClick={() => setInstrumentSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Instrument chips */}
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-1">
              {filteredInstruments.map(instrument => (
                <button
                  key={instrument}
                  type="button"
                  onClick={() => toggleInstrument(instrument)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    selectedInstruments.includes(instrument)
                      ? 'bg-primary text-dark-950 shadow-lg scale-105'
                      : 'bg-dark-700 text-slate-300 hover:bg-dark-600 hover:scale-105'
                  }`}
                >
                  {selectedInstruments.includes(instrument) && (
                    <Check className="w-3 h-3 inline mr-1" />
                  )}
                  {instrument}
                </button>
              ))}
            </div>

            {/* Custom Instruments */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Custom Instruments</label>
              <input
                type="text"
                value={customInstruments}
                onChange={(e) => setCustomInstruments(e.target.value)}
                className="input-field"
                placeholder="e.g. sitar, bagpipes, laser sounds"
              />
            </div>
          </div>

          {/* Persona Selection */}
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/30 to-pink-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-50">Persona (Optional)</h2>
                <p className="text-slate-500 text-sm">Choose a vocal style and personality</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* None option */}
              <button
                type="button"
                onClick={() => setSelectedPersona('')}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedPersona === ''
                    ? 'border-primary bg-gradient-to-br from-primary/10 to-purple-500/10 shadow-lg'
                    : 'border-dark-700 hover:border-dark-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-slate-50 font-semibold">No Persona</h3>
                    <p className="text-slate-500 text-sm mt-1">Let the AI decide the vocal style</p>
                  </div>
                  {selectedPersona === '' && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Persona options */}
              {PERSONAS.map(persona => (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedPersona === persona.id
                      ? 'border-primary bg-gradient-to-br from-primary/10 to-purple-500/10 shadow-lg'
                      : 'border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-slate-50 font-semibold text-lg">{persona.name}</h3>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">{persona.description}</p>
                    </div>
                    {selectedPersona === persona.id && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg animate-fadeIn">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isGenerating || !description}
            className="w-full btn-primary py-5 text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-primary/20 hover:shadow-primary/40"
          >
            <Sparkles className="w-6 h-6" />
            <span>{isGenerating ? 'Starting Generation...' : 'Generate Song'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
