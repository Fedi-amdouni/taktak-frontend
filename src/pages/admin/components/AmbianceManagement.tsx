import React, { useState, useEffect } from 'react';
import { Radio, Plus, RotateCcw, Trophy, Music, Sparkles, Check, Trash2 } from 'lucide-react';
import { AmbianceState } from '../../../types';
import { api } from '../../../services/api';

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

  const handleDeleteMusicOption = async (musicId: string) => {
    if (!confirm('Voulez-vous retirer cette musique de la playlist ?')) return;
    try {
      const updatedState = await api.deleteMusicOption(cafeSlug, musicId);
      setState(updatedState);
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 mb-1">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">Gestion Ambiance & Jukebox</span>
          </div>
          <h2 className="text-xl font-black text-white">Sondages TV Match & Playlist Musique</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Gérez les programmes TV diffusés et contrôlez la file d'attente des musiques suggérées par vos clients.
          </p>
        </div>

        <button
          onClick={handleResetMusic}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 transition-all active:scale-95 flex-shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser la Playlist Musique</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center space-x-2">
          <Sparkles className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TV Match Poll Form (Admin Managed) */}
        <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <Trophy className="w-5 h-5" />
            <h3 className="text-sm font-black uppercase tracking-wider">📺 Créer un Sondage TV / Match en Direct</h3>
          </div>
          <p className="text-xs text-gray-400">
            Proposez à vos clients de voter pour le match ou le programme qu'ils souhaitent regarder sur les écrans du café.
          </p>

          <form onSubmit={handleCreatePoll} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300">Titre du Sondage / Événement *</label>
              <input
                type="text"
                required
                placeholder="Ex: Quel match voulez-vous voir sur le grand écran ?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Options du Match / Chaînes *</label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    required
                    placeholder={`Option ${idx + 1} (Ex: Real Madrid vs Barcelona)`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionField(idx)}
                      className="p-3 text-red-400 hover:text-red-300 bg-red-500/10 rounded-xl transition-all"
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
              <span>{submitting ? 'Lancement...' : 'Diffuser le Sondage TV en Direct'}</span>
            </button>
          </form>
        </div>

        {/* Current Active Poll & Music Jukebox Overview */}
        <div className="space-y-6">
          {/* Active Poll Overview */}
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Sondage TV Actif en Direct
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
              <p className="text-xs text-gray-500 py-4 text-center">Aucun pronostic TV actif pour le moment.</p>
            )}
          </div>

          {/* Music Jukebox Overview */}
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center space-x-1">
                <Music className="w-3.5 h-3.5" />
                <span>Demandes Musiques Clients (Jukebox Live)</span>
              </span>
              <span className="text-[10px] font-bold text-gray-500">
                {state?.musicOptions.length || 0} musiques en attente
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {state?.musicOptions.map((music, idx) => (
                <div key={music.id} className="flex items-center justify-between text-xs bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span className="font-extrabold text-amber-400 flex-shrink-0">{idx === 0 ? '🔥' : `#${idx + 1}`}</span>
                    <div className="min-w-0">
                      <span className="text-white font-bold block truncate">{music.title}</span>
                      <span className="text-[10px] text-gray-500 font-medium">{music.genre}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20">
                      {music.votesCount} votes
                    </span>
                    <button
                      onClick={() => handleDeleteMusicOption(music.id)}
                      title="Retirer cette musique"
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {(!state?.musicOptions || state.musicOptions.length === 0) && (
                <p className="text-xs text-gray-500 py-4 text-center">Aucune suggestion musicale envoyée par les clients.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
