import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Music2, Sparkles, X } from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  description: string;
  songCount: number;
}

const DEFAULT_PERSONAS: Persona[] = [
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
  const [personas, setPersonas] = useState<Persona[]>(() => {
    const stored = localStorage.getItem('personas');
    return stored ? JSON.parse(stored) : DEFAULT_PERSONAS;
  });

  const [showModal, setShowModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const savePersonas = (newPersonas: Persona[]) => {
    setPersonas(newPersonas);
    localStorage.setItem('personas', JSON.stringify(newPersonas));
  };

  const handleNewPersona = () => {
    setEditingPersona(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona);
    setFormData({ name: persona.name, description: persona.description });
    setShowModal(true);
  };

  const handleDeletePersona = (personaId: string) => {
    if (confirm('Are you sure you want to delete this persona?')) {
      const updated = personas.filter(p => p.id !== personaId);
      savePersonas(updated);
    }
  };

  const handleSavePersona = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (editingPersona) {
      // Update existing
      const updated = personas.map(p =>
        p.id === editingPersona.id
          ? { ...p, name: formData.name, description: formData.description }
          : p
      );
      savePersonas(updated);
    } else {
      // Create new
      const newPersona: Persona = {
        id: formData.name.toLowerCase().replace(/\s+/g, '_'),
        name: formData.name,
        description: formData.description,
        songCount: 0,
      };
      savePersonas([...personas, newPersona]);
    }

    setShowModal(false);
  };

  const getPersonaColor = (index: number) => {
    const colors = [
      'from-purple-500/20 to-pink-500/20 border-purple-500/30',
      'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
      'from-green-500/20 to-emerald-500/20 border-green-500/30',
      'from-orange-500/20 to-red-500/20 border-orange-500/30',
      'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-full bg-dark-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-slate-500 text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Settings</span>
            </p>
            <h1 className="text-3xl font-bold text-slate-50 mt-1">Personas</h1>
          </div>
          <button onClick={handleNewPersona} className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Persona</span>
          </button>
        </div>

        {/* Description */}
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/30 rounded-lg p-4 mb-6">
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-primary">Personas</strong> define the style, voice, and characteristics of your generated songs.
            Each persona has a unique set of attributes that influence the lyrics, mood, and musical direction.
          </p>
        </div>

        {/* Personas list */}
        <div className="space-y-4">
          {personas.map((persona, index) => (
            <div
              key={persona.id}
              className={`card p-6 bg-gradient-to-br ${getPersonaColor(index)} border-2 hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <Music2 className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold text-slate-50">{persona.name}</h3>
                    <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                      {persona.songCount} {persona.songCount === 1 ? 'song' : 'songs'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed pl-8">
                    {persona.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEditPersona(persona)}
                    className="p-2 text-slate-400 hover:text-primary transition-colors rounded-md hover:bg-dark-700/50"
                    title="Edit persona"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePersona(persona.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-md hover:bg-dark-700/50"
                    title="Delete persona"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help text */}
        <div className="mt-8 card p-5 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h4 className="text-primary font-semibold text-lg">Persona Tips</h4>
          </div>
          <ul className="text-slate-300 text-sm space-y-2">
            <li className="flex items-start space-x-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Include genre, mood, and vocal characteristics in your persona description</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Specify audio qualities like "Spatial Audio" or "Dolby Atmos" for enhanced output</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Use descriptive terms for vocal style: "power vocals", "breathy", "raspy", etc.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Reference specific instruments or production styles for consistent results</span>
            </li>
          </ul>
        </div>

        {/* Modal for Create/Edit Persona */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-50">
                  {editingPersona ? 'Edit Persona' : 'Create New Persona'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Persona Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-slate-50 focus:outline-none focus:border-primary"
                    placeholder="e.g., Midnight Rocker"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description & Characteristics
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-slate-50 focus:outline-none focus:border-primary h-32 resize-none"
                    placeholder="Describe the genre, mood, vocal style, instruments, production qualities..."
                  />
                  <p className="text-slate-500 text-xs mt-2">
                    Include: genre, mood, vocal characteristics, instruments, and audio qualities
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePersona}
                  className="btn-primary"
                >
                  {editingPersona ? 'Save Changes' : 'Create Persona'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
