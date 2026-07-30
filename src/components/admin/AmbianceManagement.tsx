import React, { useState, useEffect } from 'react';
import { Radio, Plus, RotateCcw, Trophy, Music, Sparkles, Check, Trash2 } from 'lucide-react';
import { AmbianceState } from '../../types';
import { api } from '../../services/api';

interface AmbianceManagementProps {
  cafeSlug: string;
}

export const AmbianceManagement: React.FC<AmbianceManagementProps> = ({ cafeSlug }) => {
  const [state, setState] = useState<AmbianceState | null>(null);
  const [loading, setLoading] = useState(true);

  // New Poll Form
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getActiveAmbiance(cafeSlug);
      setState(data);
    } catch (err) {
      console.error('Erreur chargement ambiance admin', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cafeSlug]);

  const handleAddOptionField = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOptionField = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Veuillez remplir le titre du pronostic');
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      alert('Veuillez spécifier au moins 2 choix possibles');
      return;
    }

    setSubmitting(true);
    try {
      const updatedState = await api.createPoll(cafeSlug, title, validOptions);
      setState(updatedState);
      setTitle('');
      setOptions(['', '']);
      setMsg('Nouveau sondage match publié en direct !');
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      alert('Erreur création du sondage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetMusic = async () => {
    if (confirm('Réinitialiser tous les votes musique pour le nouveau shift ?')) {
      try {
        const updatedState = await api.resetMusicVotes(cafeSlug);
        setState(updatedState);
        setMsg('Compteur de votes musique réinitialisé !');
        setTimeout(() => setMsg(null), 3000);
      } catch (err) {
        alert('Erreur réinitialisation musique');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/25 text-white">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">Gestion Ambiance & Jukebox Live</h2>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Créez des pronostics en direct pour les matchs diffusés et gérez les votes de la playlist musique
            </p>
          </div>
        </div>

        <button
          onClick={handleResetMusic}
          className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-pink-400 border border-pink-500/20 rounded-xl shadow-lg flex items-center space-x-2 text-xs font-extrabold transition-all duration-300 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Réinitialiser Votes Musique</span>
        </button>
      </div>

      {msg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-xs font-bold text-emerald-400 text-center animate-fadeIn">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Launch Match Poll Form */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <Trophy className="w-5 h-5" />
            <h3 className="text-sm font-extrabold text-white">Publier un Pronostic Match</h3>
          </div>

          <form onSubmit={handleCreatePoll} className="space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                Titre de l'événement ou Match
              </label>
              <input
                type="text"
                placeholder="Ex: ⚽ EST vs CA - Qui va gagner le Derby ?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/[0.03] text-gray-100 px-4 py-3 rounded-2xl border border-white/[0.06] focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">
                Choix / Options possibles (2 à 4)
              </label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder={`Choix ${idx + 1} (Ex: Espérance, Nul, CA...)`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 bg-white/[0.03] text-gray-100 px-4 py-2.5 rounded-xl border border-white/[0.06] focus:border-amber-500"
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionField(idx)}
                      className="p-2.5 bg-white/[0.04] text-red-400 hover:bg-red-500/20 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {options.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddOptionField}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une option</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-amber-500/20 transition-all duration-300 flex items-center justify-center space-x-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Lancement...' : 'Diffuser le Sondage en Direct'}</span>
            </button>
          </form>
        </div>

        {/* Current Active Poll & Music State */}
        <div className="space-y-6">
          {/* Active Poll Overview */}
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Sondage Actif en Direct
              </span>
              <span className="text-[10px] text-gray-500 font-bold">
                {state?.activePoll?.totalVotes || 0} votes enregistrés
              </span>
            </div>

            {state?.activePoll ? (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-white">{state.activePoll.title}</h4>
                <div className="space-y-1.5 pt-1">
                  {state.activePoll.options.map((opt) => (
                    <div key={opt.id} className="flex items-center justify-between text-xs bg-white/[0.02] p-2 rounded-xl">
                      <span className="text-gray-300 font-semibold">{opt.optionText}</span>
                      <span className="font-mono font-bold text-amber-300">{opt.percentage}% ({opt.votesCount} votes)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">Aucun pronostic actif pour le moment.</p>
            )}
          </div>

          {/* Music Jukebox Overview */}
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center space-x-1">
                <Music className="w-3.5 h-3.5" />
                <span>Classement Jukebox Live</span>
              </span>
            </div>

            <div className="space-y-2">
              {state?.musicOptions.map((music, idx) => (
                <div key={music.id} className="flex items-center justify-between text-xs bg-white/[0.02] p-2.5 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-amber-400">{idx === 0 ? '🔥' : `#${idx + 1}`}</span>
                    <span className="text-white font-bold">{music.title}</span>
                  </div>
                  <span className="font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20">
                    {music.votesCount} votes
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
