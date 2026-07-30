import React, { useState, useEffect } from 'react';
import { Music, Trophy, CheckCircle2, Radio, Heart, Sparkles } from 'lucide-react';
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
    });

    return () => {
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
      console.error('Erreur vote match', err);
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

  if (loading) {
    return (
      <div className="text-center py-16 max-w-md mx-auto px-4">
        <Sparkles className="w-10 h-10 text-orange-400 mx-auto animate-pulse mb-3" />
        <p className="text-xs text-gray-400 font-semibold">Chargement de l'ambiance du lounge...</p>
      </div>
    );
  }

  const poll = state?.activePoll;
  const hasVotedPoll = !!state?.userVotedPollOptionId;
  const hasVotedMusic = !!state?.userVotedMusicOptionId;

  return (
    <div className="pb-28 max-w-md mx-auto px-4 pt-4 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-4 rounded-3xl border border-white/[0.08] relative overflow-hidden flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/25 text-white">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 block">
              Direct Café Lounge
            </span>
            <h2 className="text-sm font-black text-white tracking-tight">Espace Ambiance & Live</h2>
          </div>
        </div>

        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>En Direct</span>
        </span>
      </div>

      {/* SECTION 1: MATCH POLL */}
      {poll && (
        <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400">
              <Trophy className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Pronostic Match écran</span>
            </div>
            <span className="text-[10px] font-extrabold text-gray-500 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
              {poll.totalVotes} votes
            </span>
          </div>

          <h3 className="text-sm font-black text-white leading-snug">{poll.title}</h3>

          {/* Options Grid */}
          <div className="space-y-2.5">
            {poll.options.map((opt) => {
              const isMyChoice = state?.userVotedPollOptionId === opt.id;
              const isSubmitting = votingPollOptId === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => !hasVotedPoll && handleVotePoll(opt.id)}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    hasVotedPoll
                      ? isMyChoice
                        ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : 'border-white/[0.06] bg-white/[0.02]'
                      : 'border-white/[0.08] bg-white/[0.04] hover:border-amber-500/40 hover:bg-white/[0.07] cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  {/* Progress bar background fill if voted */}
                  {hasVotedPoll && (
                    <div
                      className={`absolute top-0 left-0 bottom-0 transition-all duration-700 ease-out opacity-20 ${
                        isMyChoice ? 'bg-amber-400' : 'bg-white'
                      }`}
                      style={{ width: `${Math.max(opt.percentage, 4)}%` }}
                    />
                  )}

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-2">
                      {isMyChoice && <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                      <span>{opt.optionText}</span>
                    </span>

                    {hasVotedPoll ? (
                      <span className="text-xs font-black text-amber-300 font-mono">
                        {opt.percentage}% <span className="text-[10px] text-gray-500 font-normal">({opt.votesCount})</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-[11px] font-extrabold border border-amber-500/20 transition-all">
                        {isSubmitting ? 'Vote...' : 'Voter'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {hasVotedPoll && (
            <p className="text-[10px] text-emerald-400 font-bold text-center pt-1 flex items-center justify-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Vote enregistré ! Les résultats se mettent à jour en temps réel.</span>
            </p>
          )}
        </div>
      )}

      {/* SECTION 2: JUKEBOX MUSIC */}
      <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-purple-400">
            <Music className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Jukebox & Musique Lounge</span>
          </div>
          <span className="text-[10px] font-bold text-gray-500">Choisissez la vibe</span>
        </div>

        <p className="text-xs text-gray-400 font-medium">
          Votez pour le style musical que vous souhaitez entendre dans le café pour le prochain morceau :
        </p>

        {/* Music Options List */}
        <div className="space-y-3">
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
