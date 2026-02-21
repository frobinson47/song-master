import React, { useState } from 'react';
import { useSongGeneration } from '../hooks/useSongGeneration';

interface GenerationFormProps {
  onSubmit: () => void;
}

const BLEND_OPTIONS = [
  'Southern Rock', 'Gospel', 'Soul', 'Metal', 'Boogie', 'Groove',
  'Funk', 'Jam', 'Nashville Country', 'Americana', 'Singer-Songwriter',
  'Blues', 'R&B', 'Jazz', 'Rock'
];

const POV_OPTIONS = [
  'First-person', 'Third-person', 'Second-person', 'Omniscient'
];

export const GenerationForm: React.FC<GenerationFormProps> = ({ onSubmit }) => {
  // Original fields
  const [userInput, setUserInput] = useState('');
  const [songName, setSongName] = useState('');
  const [persona, setPersona] = useState('');
  const [useLocal, setUseLocal] = useState(false);

  // HookHouse toggle
  const [useHookHouse, setUseHookHouse] = useState(true);

  // HookHouse fields
  const [blend, setBlend] = useState<string[]>([]);
  const [moodStyle, setMoodStyle] = useState<'dark' | 'clean'>('dark');
  const [explicitness, setExplicitness] = useState<'explicit' | 'mature'>('mature');
  const [pov, setPov] = useState('');
  const [setting, setSetting] = useState('');
  const [themesInclude, setThemesInclude] = useState('');
  const [themesAvoid, setThemesAvoid] = useState('');
  const [bpm, setBpm] = useState('');
  const [timeSignature, setTimeSignature] = useState('');
  const [musicalKey, setMusicalKey] = useState('');
  const [grooveTexture, setGrooveTexture] = useState('');
  const [choirCallResponse, setChoirCallResponse] = useState(false);

  const { startGeneration, isGenerating, error } = useSongGeneration();

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
        user_input: userInput,
        song_name: songName || null,
        persona: persona || null,
        use_local: useLocal,
        use_hookhouse: useHookHouse,
      };

      // Add HookHouse parameters if enabled
      if (useHookHouse) {
        params.blend = blend;
        params.mood_style = moodStyle;
        params.explicitness = explicitness;
        params.pov = pov || null;
        params.setting = setting || null;
        params.themes_include = themesInclude ? themesInclude.split(',').map(t => t.trim()) : null;
        params.themes_avoid = themesAvoid ? themesAvoid.split(',').map(t => t.trim()) : null;
        params.bpm = bpm ? parseInt(bpm) : null;
        params.time_signature = timeSignature || null;
        params.key = musicalKey || null;
        params.groove_texture = grooveTexture || null;
        params.choir_call_response = choirCallResponse;
      }

      await startGeneration(params);
      onSubmit();
    } catch (err) {
      console.error('Failed to start generation:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto bg-dark-800 border border-dark-700 p-8 rounded-lg">
      {/* Workflow Toggle */}
      <div className="bg-gradient-to-r from-[#F5A623]/10 to-[#FFB84D]/10 p-4 rounded-lg border border-[#F5A623]/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-50">Workflow Mode</h3>
            <p className="text-sm text-slate-400">
              {useHookHouse
                ? 'HookHouse v2.6.1: Production-ready lyrics with Suno compliance & physiological resonance'
                : 'Original: Classic song generation workflow'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUseHookHouse(!useHookHouse)}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
              useHookHouse ? 'bg-[#F5A623]' : 'bg-dark-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                useHookHouse ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Song Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Song Description *
        </label>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          required
          rows={6}
          className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
          placeholder="Describe the song you want to create... (e.g., 'A powerful Southern gospel rock song about redemption and gravel roads')"
        />
      </div>

      {/* Basic Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Song Name (Optional)
          </label>
          <input
            type="text"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            placeholder="My Amazing Song"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Persona (Optional)
          </label>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
          >
            <option value="">None</option>
            <option value="antidote">Antidote</option>
            <option value="bleached_to_perfection">Bleached to Perfection</option>
            <option value="anagram">Anagram</option>
          </select>
        </div>
      </div>

      {/* HookHouse-Specific Fields */}
      {useHookHouse && (
        <div className="space-y-6 border-t border-dark-700 pt-6">
          <h3 className="text-lg font-semibold text-slate-50">HookHouse Configuration</h3>

          {/* Blend Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Musical Blend * (Select 2-3 styles)
              <span className="ml-2 text-xs text-[#F5A623]">
                {blend.length}/3 selected
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BLEND_OPTIONS.map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleBlendToggle(style)}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                    blend.includes(style)
                      ? 'bg-[#F5A623] text-slate-950 border-[#F5A623]'
                      : 'bg-white text-slate-300 border-dark-700 hover:border-[#F5A623]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Mood & Explicitness */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Mood Style
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMoodStyle('dark')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    moodStyle === 'dark'
                      ? 'bg-slate-800 text-white border-slate-600'
                      : 'bg-white text-slate-300 border-dark-700'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setMoodStyle('clean')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    moodStyle === 'clean'
                      ? 'bg-[#F5A623] text-slate-950 border-[#F5A623]'
                      : 'bg-white text-slate-300 border-dark-700'
                  }`}
                >
                  Clean
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Explicitness
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExplicitness('mature')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    explicitness === 'mature'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-slate-300 border-dark-700'
                  }`}
                >
                  Mature
                </button>
                <button
                  type="button"
                  onClick={() => setExplicitness('explicit')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    explicitness === 'explicit'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-slate-300 border-dark-700'
                  }`}
                >
                  Explicit
                </button>
              </div>
            </div>
          </div>

          {/* POV & Setting */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Point of View (Optional)
              </label>
              <select
                value={pov}
                onChange={(e) => setPov(e.target.value)}
                className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              >
                <option value="">Auto-detect</option>
                {POV_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Setting (Optional)
              </label>
              <input
                type="text"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                placeholder="e.g., '1970s rural South', 'Modern urban'"
                className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              />
            </div>
          </div>

          {/* Themes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Themes to Include (Optional)
              </label>
              <input
                type="text"
                value={themesInclude}
                onChange={(e) => setThemesInclude(e.target.value)}
                placeholder="redemption, faith, struggle (comma-separated)"
                className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Themes to Avoid (Optional)
              </label>
              <input
                type="text"
                value={themesAvoid}
                onChange={(e) => setThemesAvoid(e.target.value)}
                placeholder="violence, politics (comma-separated)"
                className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              />
            </div>
          </div>

          {/* Musical Parameters */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                BPM (Optional)
              </label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="120"
                min="40"
                max="200"
                className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Time Signature (Optional)
              </label>
              <input
                type="text"
                value={timeSignature}
                onChange={(e) => setTimeSignature(e.target.value)}
                placeholder="4/4"
                className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Key (Optional)
              </label>
              <input
                type="text"
                value={musicalKey}
                onChange={(e) => setMusicalKey(e.target.value)}
                placeholder="C, Am, Eb"
                className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              />
            </div>
          </div>

          {/* Groove Texture */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Groove/Texture Description (Optional)
            </label>
            <input
              type="text"
              value={grooveTexture}
              onChange={(e) => setGrooveTexture(e.target.value)}
              placeholder="e.g., 'Pocket-oriented, loose feel with Hammond organ swells'"
              className="w-full px-4 py-2 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            />
          </div>

          {/* Choir/Call-Response */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="choirCallResponse"
              checked={choirCallResponse}
              onChange={(e) => setChoirCallResponse(e.target.checked)}
              className="mr-2 h-4 w-4 text-[#F5A623] focus:ring-primary border-dark-700 rounded"
            />
            <label htmlFor="choirCallResponse" className="text-sm text-slate-300">
              Include choir/call-response elements
            </label>
          </div>
        </div>
      )}

      {/* Use Local */}
      <div className="flex items-center border-t border-dark-700 pt-4">
        <input
          type="checkbox"
          id="useLocal"
          checked={useLocal}
          onChange={(e) => setUseLocal(e.target.checked)}
          className="mr-2 h-4 w-4 text-[#F5A623] focus:ring-primary border-dark-700 rounded"
        />
        <label htmlFor="useLocal" className="text-sm text-slate-300">
          Use local LM Studio model (disables album art)
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isGenerating}
        className={`w-full py-3 px-6 rounded-lg transition-colors font-medium ${
          useHookHouse
            ? 'bg-gradient-to-r from-[#F5A623] to-[#FFB84D] hover:from-[#FFB84D] hover:to-[#F5A623] text-white'
            : 'bg-[#F5A623] hover:bg-[#FFB84D] text-white'
        } disabled:bg-dark-600 disabled:cursor-not-allowed`}
      >
        {isGenerating ? 'Starting Generation...' : useHookHouse ? '🎤 Generate with HookHouse' : 'Generate Song'}
      </button>
    </form>
  );
};
