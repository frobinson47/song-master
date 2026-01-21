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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      {/* Workflow Toggle */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Workflow Mode</h3>
            <p className="text-sm text-gray-600">
              {useHookHouse
                ? 'HookHouse v2.6.1: Production-ready lyrics with Suno compliance & physiological resonance'
                : 'Original: Classic song generation workflow'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUseHookHouse(!useHookHouse)}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
              useHookHouse ? 'bg-purple-600' : 'bg-gray-300'
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Song Description *
        </label>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          required
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe the song you want to create... (e.g., 'A powerful Southern gospel rock song about redemption and gravel roads')"
        />
      </div>

      {/* Basic Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Song Name (Optional)
          </label>
          <input
            type="text"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="My Amazing Song"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Persona (Optional)
          </label>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="space-y-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800">HookHouse Configuration</h3>

          {/* Blend Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Musical Blend * (Select 2-3 styles)
              <span className="ml-2 text-xs text-purple-600">
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
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mood Style
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMoodStyle('dark')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    moodStyle === 'dark'
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setMoodStyle('clean')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    moodStyle === 'clean'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  Clean
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explicitness
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExplicitness('mature')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    explicitness === 'mature'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-300'
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
                      : 'bg-white text-gray-700 border-gray-300'
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Point of View (Optional)
              </label>
              <select
                value={pov}
                onChange={(e) => setPov(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Auto-detect</option>
                {POV_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setting (Optional)
              </label>
              <input
                type="text"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                placeholder="e.g., '1970s rural South', 'Modern urban'"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Themes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Themes to Include (Optional)
              </label>
              <input
                type="text"
                value={themesInclude}
                onChange={(e) => setThemesInclude(e.target.value)}
                placeholder="redemption, faith, struggle (comma-separated)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Themes to Avoid (Optional)
              </label>
              <input
                type="text"
                value={themesAvoid}
                onChange={(e) => setThemesAvoid(e.target.value)}
                placeholder="violence, politics (comma-separated)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Musical Parameters */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BPM (Optional)
              </label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="120"
                min="40"
                max="200"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Signature (Optional)
              </label>
              <input
                type="text"
                value={timeSignature}
                onChange={(e) => setTimeSignature(e.target.value)}
                placeholder="4/4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key (Optional)
              </label>
              <input
                type="text"
                value={musicalKey}
                onChange={(e) => setMusicalKey(e.target.value)}
                placeholder="C, Am, Eb"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Groove Texture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Groove/Texture Description (Optional)
            </label>
            <input
              type="text"
              value={grooveTexture}
              onChange={(e) => setGrooveTexture(e.target.value)}
              placeholder="e.g., 'Pocket-oriented, loose feel with Hammond organ swells'"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Choir/Call-Response */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="choirCallResponse"
              checked={choirCallResponse}
              onChange={(e) => setChoirCallResponse(e.target.checked)}
              className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="choirCallResponse" className="text-sm text-gray-700">
              Include choir/call-response elements
            </label>
          </div>
        </div>
      )}

      {/* Use Local */}
      <div className="flex items-center border-t border-gray-200 pt-4">
        <input
          type="checkbox"
          id="useLocal"
          checked={useLocal}
          onChange={(e) => setUseLocal(e.target.checked)}
          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="useLocal" className="text-sm text-gray-700">
          Use local LM Studio model (disables album art)
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isGenerating}
        className={`w-full py-3 px-6 rounded-lg transition-colors font-medium ${
          useHookHouse
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } disabled:bg-gray-400 disabled:cursor-not-allowed`}
      >
        {isGenerating ? 'Starting Generation...' : useHookHouse ? '🎤 Generate with HookHouse' : 'Generate Song'}
      </button>
    </form>
  );
};
