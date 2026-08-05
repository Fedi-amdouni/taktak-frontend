import React, { useState, useEffect } from 'react';
import { Music, Trophy, CheckCircle2, Radio, Heart, Sparkles, Plus } from 'lucide-react';
import { AmbianceState } from '../../types';
import { api } from '../../services/api';
import { stompService } from '../../services/stompService';

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
  const [votingMusicOptId, setVotingMusicOptId] = useState<string | null>(null);

  // Client Music Proposal State
  const [isProposing, setIsProposing] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Orientale');
  const [isSubmittingMusic, setIsSubmittingMusic] = useState(false);

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
        userVotedMusicOptionId: prev?.userVotedMusicOptionId || updatedState.userVotedMusicOptionId,
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

  const handleVoteMusic = async (optionId: string) => {
    if (state?.userVotedMusicOptionId || votingMusicOptId) return;
    setVotingMusicOptId(optionId);
    try {
      const res = await api.voteMusic(cafeSlug, optionId, voterSessionId);
      setState(res);
    } catch (err) {
      console.error('Erreur vote musique', err);
    } finally {
      setVotingMusicOptId(null);
    }
  };

  const handleProposeMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || isSubmittingMusic) return;

    setIsSubmittingMusic(true);
    try {
      const res = await api.proposeMusic(cafeSlug, songTitle.trim(), selectedGenre, voterSessionId);
      setState(res);
      setSongTitle('');
      setIsProposing(false);
    } catch (err) {
      alert('Erreur lors de la proposition de musique. Veuillez réessayer.');
    } finally {
      setIsSubmittingMusic(false);
    }
  };

  const hasVotedPoll = !!state?.userVotedPollOptionId;
  const hasVotedMusic = !!state?.userVotedMusicOptionId;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-lg mx-auto px-4">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/30 flex-shrink-0">
            📻
          </div>
          <div>
            <h2 className="text-base font-black text-white">Ambiance & Jukebox Live</h2>
            <p className="text-xs text-gray-400 font-medium">
              Proposez vos musiques préférées & votez pour le programme TV
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: LIVE TV MATCH POLL (ADMIN MANAGED) */}
      {state?.activePoll && (
        <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400">
              <Trophy className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Programme TV & Match en Direct</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.08]">
              {state.activePoll.totalVotes} votes
            </span>
          </div>

          <h3 className="text-sm font-extrabold text-white">{state.activePoll.title}</h3>

          {/* Poll Options Progress */}
          <div className="space-y-3 pt-1">
            {state.activePoll.options.map((option) => {
              const isMyChoice = state?.userVotedPollOptionId === option.id;
              const isSubmitting = votingPollOptId === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => !hasVotedPoll && handleVotePoll(option.id)}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                    isMyChoice
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10'
                      : hasVotedPoll
                      ? 'bg-white/[0.02] border-white/[0.05] cursor-default'
                      : 'bg-white/[0.04] border-white/[0.08] hover:border-amber-500/30 hover:bg-white/[0.06]'
                  }`}
                >
                  {/* Progress Fill Bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-amber-500/10 transition-all duration-700 pointer-events-none"
                    style={{ width: `${option.percentage}%` }}
                  />

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <span className="text-xs font-extrabold text-white truncate">{option.optionText}</span>
                      {isMyChoice && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                          Mon choix
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-xs font-mono font-extrabold text-amber-300">
                        {isSubmitting ? '...' : `${option.percentage}%`}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold">({option.votesCount})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: CLIENT JUKEBOX MUSIC PROPOSAL & VOTING */}
      <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-purple-400">
            <Music className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Jukebox Participatif</span>
          </div>
          <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
            Proposez & Votez
          </span>
        </div>

        <p className="text-xs text-gray-400 font-medium">
          Suggérez une chanson ou un artiste pour l'ambiance du café et votez pour vos sons préférés :
        </p>

        {/* Client Music Proposal Accordion / Card */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/20 border border-purple-500/30 rounded-2xl p-4 space-y-3 shadow-inner">
          <button
            type="button"
            onClick={() => setIsProposing(!isProposing)}
            className="w-full flex items-center justify-between text-left font-extrabold text-xs text-purple-300 hover:text-purple-200 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>➕ Proposer une musique ou un artiste</span>
            </div>
            <Plus className={`w-4 h-4 transition-transform duration-300 ${isProposing ? 'rotate-45 text-pink-400' : 'text-purple-400'}`} />
          </button>

          {isProposing && (
            <form onSubmit={handleProposeMusic} className="space-y-3 pt-2 border-t border-purple-500/20 mt-2">
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">Chanson / Artiste à proposer *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fairouz - Kifak Inta, The Weeknd, Elissa..."
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full bg-black/40 border border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">Genre / Style Musical</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Orientale', 'Pop & Hits', 'Jazz & Lounge', 'Rai & Maghreb', 'Deep House', 'Rap & Urban'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGenre(g)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        selectedGenre === g
                          ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/30'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingMusic || !songTitle.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
              >
                <Music className="w-3.5 h-3.5" />
                <span>{isSubmittingMusic ? 'Ajout en cours...' : '🎶 Soumettre ma musique au Jukebox'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Music Options List */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-gray-400 flex items-center justify-between">
            <span>🔥 Musiques proposées en attente :</span>
            <span className="text-[10px] text-purple-400 font-bold">{state?.musicOptions.length || 0} titres</span>
          </h4>

          {state?.musicOptions.map((music, idx) => {
            const isMyChoice = state?.userVotedMusicOptionId === music.id;
            const isSubmitting = votingMusicOptId === music.id;
            const isTop1 = idx === 0;

            return (
              <div
                key={music.id}
                className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                  isMyChoice
                    ? 'bg-pink-500/10 border-pink-500/40 shadow-lg shadow-pink-500/10'
                    : 'bg-white/[0.03] border-white/[0.06] hover:border-purple-500/30 hover:bg-white/[0.05]'
                }`}
              >
                {/* Info */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isTop1
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25'
                        : 'bg-white/[0.05] text-purple-400 border border-white/[0.08]'
                    }`}
                  >
                    {isTop1 ? '🔥' : '🎵'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-extrabold text-white truncate">{music.title}</h4>
                      {isTop1 && (
                        <span className="text-[9px] font-extrabold bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Top 1
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">{music.genre}</span>
                  </div>
                </div>

                {/* Heart Vote Button */}
                <button
                  onClick={() => !hasVotedMusic && handleVoteMusic(music.id)}
                  disabled={hasVotedMusic}
                  className={`px-3 py-2 rounded-xl font-extrabold text-xs transition-all duration-300 flex items-center space-x-1.5 flex-shrink-0 active:scale-95 ${
                    isMyChoice
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25 border border-pink-400'
                      : hasVotedMusic
                      ? 'bg-white/[0.04] text-gray-500 border border-white/[0.06] cursor-not-allowed'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isMyChoice ? 'fill-white' : ''}`} />
                  <span>{isSubmitting ? '...' : music.votesCount}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
