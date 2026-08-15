import React, { useState, useEffect } from 'react';
import { Plus, Trophy, Tv, Sparkles, Check, Trash2, Flame, CheckCircle2, RefreshCw } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-orange-500/20 text-white">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">Matchs & Événements TV</h2>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Créez des pronostics en direct pour engager vos clients en salle</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="p-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white rounded-xl border border-white/[0.06] transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {msg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CREATE POLL FORM */}
        <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-5">
          <div className="flex items-center space-x-2.5 text-amber-400">
            <Trophy className="w-5 h-5" />
            <h3 className="text-sm font-extrabold text-white">Lancer un Nouveau Pronostic TV</h3>
          </div>

          <form onSubmit={handleCreatePoll} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1.5 uppercase tracking-wider">
                Titre de l'Événement ou du Match *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Real Madrid vs FC Barcelone - Qui va gagner ?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-400 transition-all"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">
                Choix Possibles (2 à 4) *
              </label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="w-6 text-center text-xs font-black text-amber-400">{idx + 1}.</span>
                  <input
                    type="text"
                    required
                    placeholder={`Choix ${idx + 1} (Ex: ${idx === 0 ? 'Victoire Real Madrid' : idx === 1 ? 'Victoire Barça' : 'Match Nul'})`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-400"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionField(idx)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
                  className="mt-1 flex items-center space-x-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une option (ex. Match Nul)</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Publication en direct…' : '⚽ Publier le Sondage aux Clients'}
            </button>
          </form>
        </div>

        {/* ACTIVE POLL PREVIEW & REAL-TIME STATS */}
        <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
              <div className="flex items-center space-x-2 text-orange-400">
                <Flame className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-wider">Sondage Actif en Salle</h3>
              </div>
              {state?.activePoll && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  En Direct
                </span>
              )}
            </div>

            {state?.activePoll ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-black text-white">{state.activePoll.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">{state.activePoll.totalVotes} votes enregistrés</p>
                </div>

                <div className="space-y-2.5">
                  {state.activePoll.options.map((option) => (
                    <div
                      key={option.id}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] relative overflow-hidden"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-amber-500/20 transition-all duration-700 pointer-events-none"
                        style={{ width: `${option.percentage}%` }}
                      />
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{option.optionText}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-black text-amber-300">{option.percentage}%</span>
                          <span className="text-[10px] text-gray-500 font-semibold">({option.votesCount})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-2">
                <Trophy className="w-10 h-10 text-gray-700 mx-auto" />
                <p className="text-xs font-bold text-gray-400">Aucun pronostic actif</p>
                <p className="text-[11px] text-gray-600">Publiez un sondage ci-contre pour animer vos tables.</p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[10px] text-gray-500">
            💡 <strong className="text-gray-400">Conseil Pro :</strong> Lancez un sondage 30 minutes avant les matchs de Champions League pour stimuler les commandes de boissons et tapas.
          </div>
        </div>
      </div>
    </div>
  );
};
