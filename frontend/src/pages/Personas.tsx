import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Music2, Sparkles, X } from 'lucide-react';
import { Persona, getPersonas, createPersona, updatePersona, deletePersona } from '../api/personas';

export const Personas: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Fetch personas on mount
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setLoading(true);
        const data = await getPersonas();
        setPersonas(data);
      } catch (err) {
        console.error('Failed to fetch personas:', err);
        setError('Failed to load personas. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchPersonas();
  }, []);

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

  const handleDeletePersona = async (personaId: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) {
      return;
    }

    try {
      await deletePersona(personaId);
      // Remove from local state
      setPersonas(personas.filter(p => p.id !== personaId));
    } catch (err) {
      console.error('Failed to delete persona:', err);
      alert('Failed to delete persona. Please try again.');
    }
  };

  const handleSavePersona = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (editingPersona) {
        // Update existing
        const updated = await updatePersona(editingPersona.id, {
          name: formData.name,
          description: formData.description,
        });
        setPersonas(personas.map(p => (p.id === editingPersona.id ? updated : p)));
      } else {
        // Create new
        const newPersona = await createPersona({
          name: formData.name,
          description: formData.description,
        });
        setPersonas([...personas, newPersona]);
      }

      setShowModal(false);
    } catch (err: any) {
      console.error('Failed to save persona:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to save persona. Please try again.';
      alert(errorMessage);
    }
  };

  const getPersonaColor = (index: number) => {
    const colors = [
      'from-[#F5A623]/20 to-[#FFB84D]/20 border-[#F5A623]/30',
      'from-[#F5A623]/15 to-[#D48A0A]/20 border-[#F5A623]/25',
      'from-[#FFB84D]/20 to-[#F5A623]/20 border-[#FFB84D]/30',
      'from-[#D48A0A]/20 to-[#F5A623]/20 border-[#D48A0A]/30',
      'from-[#F5A623]/20 to-[#FFB84D]/15 border-[#F5A623]/30',
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
        <div className="bg-gradient-to-r from-primary/10 to-[#FFB84D]/10 border border-primary/30 rounded-lg p-4 mb-6">
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-primary">Personas</strong> define the style, voice, and characteristics of your generated songs.
            Each persona has a unique set of attributes that influence the lyrics, mood, and musical direction.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Personas list */}
        {!loading && !error && (
          <div className="space-y-4">
            {personas.length === 0 ? (
              <div className="card p-8 text-center">
                <Music2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No personas yet. Create your first one!</p>
              </div>
            ) : (
              personas.map((persona, index) => (
                <div
                  key={persona.id}
                  className={`card p-6 bg-gradient-to-br ${getPersonaColor(index)} border-2 hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Music2 className="w-5 h-5 text-primary" />
                        <h3 className="text-xl font-bold text-slate-50">{persona.name}</h3>
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
              ))
            )}
          </div>
        )}

        {/* Help text */}
        <div className="mt-8 card p-5 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-[#FFB84D]/5">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="glass-card max-w-2xl w-full p-6 animate-scaleIn">
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
