import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSongGeneration } from '../hooks/useSongGeneration';
import { ProgressTracker } from '../components/ProgressTracker';
import { useGenerationStore } from '../store/generationSlice';
import { getPersonas, type Persona } from '../api/personas';
import {
  Sparkles, Check, Music, Disc, Sliders, Users, Wand2,
  Search, X, Server, Wifi, Image as ImageIcon, ChevronDown
} from 'lucide-react';

// HookHouse blend options
const BLEND_OPTIONS = [
  'Southern Rock', 'Gospel', 'Soul', 'Metal', 'Boogie', 'Groove',
  'Funk', 'Jam', 'Nashville Country', 'Americana', 'Singer-Songwriter',
  'Blues', 'R&B', 'Jazz', 'Rock'
];

const POV_OPTIONS = [
  'First-person', 'Third-person', 'Second-person', 'Omniscient'
];

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

  // Personas state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personasLoading, setPersonasLoading] = useState(true);
  const [personaSearchOpen, setPersonaSearchOpen] = useState(false);
  const [personaSearch, setPersonaSearch] = useState('');

  // HookHouse state
  const [useHookHouse, setUseHookHouse] = useState(true);
  const [blend, setBlend] = useState<string[]>([]);
  const [moodStyle, setMoodStyle] = useState<'dark' | 'clean'>('dark');
  const [explicitness, setExplicitness] = useState<'explicit' | 'mature'>('mature');
  const [pov, setPov] = useState('');
  const [setting, setSetting] = useState('');
  const [themesInclude, setThemesInclude] = useState('');
  const [themesAvoid, setThemesAvoid] = useState('');
  const [timeSignature, setTimeSignature] = useState('');
  const [grooveTexture, setGrooveTexture] = useState('');
  const [choirCallResponse, setChoirCallResponse] = useState(false);

  // Fetch personas on mount
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const data = await getPersonas();
        setPersonas(data);
      } catch (error) {
        console.error('Failed to fetch personas:', error);
        // Fallback to empty list if fetch fails
        setPersonas([{ id: '', name: 'None', description: 'No persona - use default settings' }]);
      } finally {
        setPersonasLoading(false);
      }
    };

    fetchPersonas();
  }, []);

  // Get selected persona object
  const selectedPersonaObj = personas.find(p => p.id === selectedPersona);

  // Filter personas based on search
  const filteredPersonas = personaSearch
    ? personas.filter(p =>
        p.name.toLowerCase().includes(personaSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(personaSearch.toLowerCase())
      )
    : personas;

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments(prev =>
      prev.includes(instrument)
        ? prev.filter(i => i !== instrument)
        : [...prev, instrument]
    );
  };

  const handleBlendToggle = (style: string) => {
    setBlend(prev => {
      if (prev.includes(style)) {
        return prev.filter(s => s !== style);
      } else if (prev.length < 3) {
        return [...prev, style];
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate blend selection for HookHouse (2-3 required)
    if (useHookHouse && (blend.length < 2 || blend.length > 3)) {
      alert('Please select 2-3 musical styles for the blend');
      return;
    }

    try {
      const params: any = {
        user_input: description,
        song_name: songTitle || null,
        persona: selectedPersona || null,
        use_local: llmLocation === 'local',
        use_hookhouse: useHookHouse,
      };

      // Add HookHouse parameters if enabled
      if (useHookHouse) {
        params.blend = blend;
        params.mood_style = moodStyle;
        params.explicitness = explicitness;
        params.pov = pov || null;
        params.setting = setting || null;
        params.themes_include = themesInclude ? themesInclude.split(',').map((t: string) => t.trim()) : null;
        params.themes_avoid = themesAvoid ? themesAvoid.split(',').map((t: string) => t.trim()) : null;
        params.bpm = tempo ? parseInt(tempo) : null;
        params.time_signature = timeSignature || null;
        params.key = musicalKey || null;
        params.groove_texture = grooveTexture || null;
        params.choir_call_response = choirCallResponse;
      }

      await startGeneration(params);
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
          <ProgressTracker
            jobId={jobId}
            onComplete={handleGenerationComplete}
            useHookhouse={useHookHouse}
          />
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

          {/* Workflow Mode Toggle */}
          <div className="card p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-50 mb-1">🎤 Workflow Mode</h3>
                <p className="text-slate-400 text-sm">
                  {useHookHouse
                    ? 'HookHouse v2.6.1: Production-ready lyrics with Suno compliance & physiological resonance'
                    : 'Original: Classic song generation workflow'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUseHookHouse(!useHookHouse)}
                className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 ${
                  useHookHouse ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-dark-600'
                }`}
              >
                <span
                  className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform shadow-lg ${
                    useHookHouse ? 'translate-x-11' : 'translate-x-1'
                  }`}
                />
              </button>
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
              {/* Searchable dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPersonaSearchOpen(!personaSearchOpen)}
                  className="w-full p-4 rounded-lg border-2 border-dark-700 hover:border-dark-600 transition-all duration-200 text-left bg-dark-800/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-50 font-semibold">
                        {selectedPersonaObj ? selectedPersonaObj.name : 'None'}
                      </div>
                      {selectedPersonaObj && selectedPersonaObj.id && (
                        <p className="text-slate-400 text-sm mt-1 truncate">
                          {selectedPersonaObj.description.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 ml-4 flex-shrink-0 transition-transform ${personaSearchOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Dropdown menu */}
                {personaSearchOpen && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setPersonaSearchOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute z-50 mt-2 w-full bg-dark-800 border border-dark-700 rounded-lg shadow-2xl overflow-hidden">
                      {/* Search input */}
                      <div className="p-3 border-b border-dark-700 bg-dark-800">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={personaSearch}
                            onChange={(e) => setPersonaSearch(e.target.value)}
                            placeholder="Search personas..."
                            className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-primary"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* Persona list */}
                      <div className="overflow-y-auto max-h-96 bg-dark-800">
                        {personasLoading ? (
                          <div className="p-4 text-center text-slate-500 bg-dark-800">
                            Loading personas...
                          </div>
                        ) : filteredPersonas.length === 0 ? (
                          <div className="p-4 text-center text-slate-500 bg-dark-800">
                            No personas found
                          </div>
                        ) : (
                          filteredPersonas.map((persona) => (
                            <button
                              key={persona.id}
                              type="button"
                              onClick={() => {
                                setSelectedPersona(persona.id);
                                setPersonaSearchOpen(false);
                                setPersonaSearch('');
                              }}
                              className={`w-full p-4 text-left hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-b-0 bg-dark-800 ${
                                selectedPersona === persona.id ? 'bg-primary/20 hover:bg-primary/25' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="text-slate-50 font-semibold">
                                    {persona.name}
                                  </div>
                                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                                    {persona.description}
                                  </p>
                                </div>
                                {selectedPersona === persona.id && (
                                  <Check className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Selected persona description (full text when not in dropdown) */}
              {selectedPersonaObj && selectedPersonaObj.id && (
                <div className="p-4 rounded-lg bg-dark-800/30 border border-dark-700">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Selected Persona</div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {selectedPersonaObj.description}
                  </p>
                </div>
              )}
            </div>

          {/* HookHouse Configuration */}
          {useHookHouse && (
            <div className="card p-6 border-2 border-purple-500/30">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-purple-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-50">HookHouse Configuration</h2>
                  <p className="text-slate-500 text-sm">Fine-tune your HookHouse song generation</p>
                </div>
              </div>

              {/* Musical Blend */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Musical Blend * (Select 2-3 styles)
                  <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                    {blend.length}/3 selected
                  </span>
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {BLEND_OPTIONS.map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => handleBlendToggle(style)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        blend.includes(style)
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                          : 'bg-dark-700 text-slate-300 hover:bg-dark-600 hover:scale-105'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood & Explicitness */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mood Style</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMoodStyle('dark')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        moodStyle === 'dark'
                          ? 'bg-slate-800 text-white border-2 border-slate-600'
                          : 'bg-dark-700 text-slate-400 border-2 border-dark-600'
                      }`}
                    >
                      🌙 Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setMoodStyle('clean')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        moodStyle === 'clean'
                          ? 'bg-blue-600 text-white border-2 border-blue-500'
                          : 'bg-dark-700 text-slate-400 border-2 border-dark-600'
                      }`}
                    >
                      ☀️ Clean
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Explicitness</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setExplicitness('mature')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        explicitness === 'mature'
                          ? 'bg-orange-600 text-white border-2 border-orange-500'
                          : 'bg-dark-700 text-slate-400 border-2 border-dark-600'
                      }`}
                    >
                      Mature
                    </button>
                    <button
                      type="button"
                      onClick={() => setExplicitness('explicit')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        explicitness === 'explicit'
                          ? 'bg-red-600 text-white border-2 border-red-500'
                          : 'bg-dark-700 text-slate-400 border-2 border-dark-600'
                      }`}
                    >
                      ⚠️ Explicit
                    </button>
                  </div>
                </div>
              </div>

              {/* POV & Setting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Point of View (Optional)</label>
                  <select
                    value={pov}
                    onChange={(e) => setPov(e.target.value)}
                    className="select-field"
                  >
                    <option value="">Auto-detect</option>
                    {POV_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Setting (Optional)</label>
                  <input
                    type="text"
                    value={setting}
                    onChange={(e) => setSetting(e.target.value)}
                    placeholder="e.g., '1970s rural South', 'Modern urban'"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Themes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Themes to Include (Optional)</label>
                  <input
                    type="text"
                    value={themesInclude}
                    onChange={(e) => setThemesInclude(e.target.value)}
                    placeholder="redemption, faith, struggle (comma-separated)"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Themes to Avoid (Optional)</label>
                  <input
                    type="text"
                    value={themesAvoid}
                    onChange={(e) => setThemesAvoid(e.target.value)}
                    placeholder="violence, politics (comma-separated)"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Time Signature & Groove */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Time Signature (Optional)</label>
                  <input
                    type="text"
                    value={timeSignature}
                    onChange={(e) => setTimeSignature(e.target.value)}
                    placeholder="4/4"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Groove/Texture (Optional)</label>
                  <input
                    type="text"
                    value={grooveTexture}
                    onChange={(e) => setGrooveTexture(e.target.value)}
                    placeholder="e.g., 'Pocket-oriented, loose feel'"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Choir/Call-Response */}
              <div className="bg-dark-800/50 border border-dark-700 p-4 rounded-lg">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={choirCallResponse}
                      onChange={(e) => setChoirCallResponse(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </div>
                  <span className="text-slate-300 text-sm font-medium">Include choir/call-response elements</span>
                </label>
              </div>
            </div>
          )}

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
