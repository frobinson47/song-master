import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const PERSONAS = [
  {
    id: 'anagram',
    name: 'Anagram',
    description: 'alt pop rock, modern rock, stadium anthem, male lead, energetic, half-spoken verses, soaring chorus, group chants, stomps, claps, bass synth, electric guitar bursts, big drums, Spatial Audio, Dolby ATMOS',
    songCount: 3,
  },
  {
    id: 'antidote',
    name: 'Antidote',
    description: '80s hair metal, glam rock, arena rock, party anthem, high-energy, explosive guitar riffs, pounding drums, melodic hooks, gang vocals, power ballad dynamics, rock and roll lifestyle, catchy chorus, guitar solo, anthemic, festive, passionate, raw energy, stadium rock, glam metal swagger, Spatial Audio, Dolby Atmos mix, high-fidelity',
    songCount: 5,
  },
  {
    id: 'bleached_to_perfection',
    name: 'Bleached To Perfection',
    description: 'Modern Soulful Electronic, Powerful Cynth-Rock, Hard Rock String Bending Guitar Riffs, Mezzo-soprano-heavy, female rock singer, power vocals, expressive vibrato, emotional delivery, dynamic range, rock attitude, smoky timbre, soulful grit, intense presence, Spatial Audio, Dolby Atmos mix, high-fidelity',
    songCount: 12,
  },
];

export const Personas: React.FC = () => {
  return (
    <div className="min-h-full bg-dark-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-500 text-sm">Settings</p>
            <h1 className="text-2xl font-bold text-slate-50">Personas</h1>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Persona</span>
          </button>
        </div>

        {/* Description */}
        <p className="text-slate-400 mb-6">
          Personas define the style, voice, and characteristics of your generated songs.
          Each persona has a unique set of attributes that influence the lyrics, mood, and musical direction.
        </p>

        {/* Personas list */}
        <div className="space-y-4">
          {PERSONAS.map((persona) => (
            <div key={persona.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-slate-50">{persona.name}</h3>
                    <span className="tag text-xs">
                      {persona.songCount} songs
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {persona.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-md hover:bg-dark-700">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-md hover:bg-dark-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help text */}
        <div className="mt-8 card p-4 border-primary/30">
          <h4 className="text-primary font-medium mb-2">Persona Tips</h4>
          <ul className="text-slate-400 text-sm space-y-1">
            <li>• Include genre, mood, and vocal characteristics in your persona description</li>
            <li>• Specify audio qualities like "Spatial Audio" or "Dolby Atmos" for enhanced output</li>
            <li>• Use descriptive terms for vocal style: "power vocals", "breathy", "raspy", etc.</li>
            <li>• Reference specific instruments or production styles for consistent results</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
