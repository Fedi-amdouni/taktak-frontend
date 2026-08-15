import React, { useState, useEffect } from 'react';
import { Trophy, Tv, CheckCircle2, Sparkles, Flame, Calendar, Clock, Award } from 'lucide-react';
import { AmbianceState } from '../../../types';
import { api } from '../../../services/api';
import { stompService } from '../../../services/stompService';

interface AmbianceViewProps {
  cafeSlug: string;
}

export const AmbianceView: React.FC<AmbianceViewProps> = ({ cafeSlug }) => {
  // Get or generate persistent voterSessionId from localStorage
  const [voterSessionId] = useState<string>(() => {
    let id = localStorage.getItem('taktak_voter_session_id');
    if (!id) {
      id = 'voter-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
      localStorage.setItem('taktak_voter_session_id', id);
    }
    return id;
  });

  const [state, setState] = useState<AmbianceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingPollOptId, setVotingPollOptId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await api.getActiveAmbiance(cafeSlug, voterSessionId);
      setState(data);
    } catch (err) {
      console.error('Erreur chargement ambiance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to STOMP WebSockets for live votes updates
    const unsubscribe = stompService.subscribeAmbiance(cafeSlug, (updatedState) => {
      setState((prev) => ({
        ...updatedState,
        userVotedPollOptionId: prev?.userVotedPollOptionId || updatedState.userVotedPollOptionId,
      }));
    }, () => void loadData());

    const reconciliationTimer = window.setInterval(() => void loadData(), 15000);

    return () => {
      window.clearInterval(reconciliationTimer);
      unsubscribe();
    };
  }, [cafeSlug, voterSessionId]);

  const handleVotePoll = async (optionId: string) => {
    if (state?.userVotedPollOptionId || votingPollOptId) return;
    setVotingPollOptId(optionId);
    try {
      const res = await api.votePoll(cafeSlug, optionId, voterSessionId);
      setState(res);
    } catch (err) {
      console.error('Erreur vote poll', err);
    } finally {
      setVotingPollOptId(null);
    }
  };

  const hasVotedPoll = !!state?.userVotedPollOptionId;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-lg mx-auto px-4 pt-2">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/30 flex-shrink-0">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">Matchs & Soirées TV</h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Pronostics en direct, programmation sportive & ambiance
            </p>
          </div>
        </div>
      </div>

      {/* LIVE TV MATCH POLL (ADMIN MANAGED) */}
      {state?.activePoll ? (
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 shadow-2xl space-y-4 relative bg-gradient-to-b from-amber-500/[0.06] to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400">
              <Trophy className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Pronostic du Jour en Salle</span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.08] flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>{state.activePoll.totalVotes} votes</span>
            </span>
          </div>

          <div>
            <h3 className="text-base font-black text-white tracking-tight">{state.activePoll.title}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {hasVotedPoll
                ? '✅ Votre vote a été enregistré ! Résultats en temps réel sur les écrans du café :'
                : 'Sélectionnez votre choix pour voter en direct dans le café :'}
            </p>
          </div>

          {/* Poll Options Progress */}
          <div className="space-y-2.5 pt-1">
            {state.activePoll.options.map((option) => {
              const isMyChoice = state?.userVotedPollOptionId === option.id;
              const isSubmitting = votingPollOptId === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => !hasVotedPoll && handleVotePoll(option.id)}
                  className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    isMyChoice
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/15 scale-[1.01]'
                      : hasVotedPoll
                      ? 'bg-white/[0.03] border-white/[0.06] cursor-default'
                      : 'bg-white/[0.04] border-white/[0.08] hover:border-amber-500/40 hover:bg-white/[0.07] cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  {/* Visual Vote Percentage Fill Bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500/20 to-orange-500/15 transition-all duration-700 pointer-events-none"
                    style={{ width: `${option.percentage}%` }}
                  />

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <span className="text-xs font-black text-white truncate">{option.optionText}</span>
                      {isMyChoice && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/30 px-2 py-0.5 rounded-full flex-shrink-0 border border-amber-400/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-amber-300" />
                          <span>Mon pronostic</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-xs font-mono font-black text-amber-300">
                        {isSubmitting ? '...' : `${option.percentage}%`}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold">({option.votesCount})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] text-center space-y-2">
          <Trophy className="w-10 h-10 text-amber-400/50 mx-auto" />
          <h3 className="text-sm font-bold text-white">Aucun vote de match en cours</h3>
          <p className="text-xs text-gray-400">Le prochain grand match sera affiché ici dès son ouverture par le staff.</p>
        </div>
      )}

      {/* Lounges Programme TV & Événements Schedule */}
      <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center space-x-2 text-orange-400">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">Programme TV du Café</span>
          </div>
          <span className="text-[10px] text-gray-400 font-bold bg-white/[0.04] px-2.5 py-1 rounded-xl">
            Écrans HD Lounge
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-black text-sm">
                ⚽
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Champions League & Ligue 1</h4>
                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-gray-500" /> Tous les soirs de match à 20h00
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
              En direct
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-sm">
                🏆
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Soirées Tournois Chkobba & Rami</h4>
                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-gray-500" /> Vendredi & Samedi dès 21h00
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
              Inscription
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
