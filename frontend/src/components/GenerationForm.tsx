import React, { useState } from 'react';
import { useSongGeneration } from '../hooks/useSongGeneration';

interface GenerationFormProps {
  onSubmit: () => void;
}

export const GenerationForm: React.FC<GenerationFormProps> = ({ onSubmit }) => {
  const [userInput, setUserInput] = useState('');
  const [songName, setSongName] = useState('');
  const [persona, setPersona] = useState('');
  const [useLocal, setUseLocal] = useState(false);

  const { startGeneration, isGenerating, error } = useSongGeneration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await startGeneration({
        user_input: userInput,
        song_name: songName || null,
        persona: persona || null,
        use_local: useLocal,
      });

      onSubmit();
    } catch (err) {
      console.error('Failed to start generation:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
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
          placeholder="Describe the song you want to create... (e.g., 'A powerful 80s hair metal anthem about testing ideas')"
        />
      </div>

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
          </select>
        </div>
      </div>

      <div className="flex items-center">
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isGenerating}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isGenerating ? 'Starting Generation...' : 'Generate Song'}
      </button>
    </form>
  );
};
