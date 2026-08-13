import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, MessageCircle, Play, RotateCcw, Sparkles, Heart, Users, Compass, Rocket, HelpCircle } from 'lucide-react';
import { createGameSocket, gamePlayerId, getStoredGameName, rememberGameName, type GameEvent } from '../../../services/gameSocket';
import { RoundGameTable } from './RoundGameTable';

interface Props {
  tableId: string;
  mode: 'quiz' | 'truth' | 'words';
  onBack: () => void;
}

const meta = {
  quiz: { title: 'Quiz & Débat', emoji: '🇹🇳', gradient: 'from-red-600 via-red-500 to-amber-700' },
  truth: { title: 'Action ou Vérité', emoji: '🎭', gradient: 'from-purple-600 via-fuchsia-600 to-indigo-800' },
  words: { title: 'Klem fi Klem', emoji: '💬', gradient: 'from-emerald-600 via-teal-600 to-cyan-800' },
};

const THEMES = [
  { id: 'intimate', name: 'Intime', emoji: '💖', icon: Heart, desc: 'Confidences, sentiments et secrets d’amour', color: 'from-rose-500 to-pink-700' },
  { id: 'social', name: 'Social', emoji: '👥', icon: Users, desc: 'Deep talk, société et philosophie de vie', color: 'from-blue-500 to-indigo-700' },
  { id: 'friends', name: 'Amis', emoji: '🎉', icon: Compass, desc: 'Anecdotes gênantes, fous rires et défis', color: 'from-amber-500 to-orange-700' },
  { id: 'future', name: 'Avenir', emoji: '🚀', icon: Rocket, desc: 'Projets de vie, ambitions et rêves', color: 'from-violet-500 to-purple-800' },
];

export const PartyGame: React.FC<Props> = ({ tableId, mode, onBack }) => {
  const socket = useRef<ReturnType<typeof createGameSocket> | null>(null);
  const [name, setName] = useState(getStoredGameName);
  const [selectedTheme, setSelectedTheme] = useState<'intimate' | 'social' | 'friends' | 'future'>('social');
  const [state, setState] = useState<GameEvent>({ type: 'party_state' });

  useEffect(() => {
    socket.current = createGameSocket(tableId, event => {
      if (event.type === 'party_state' && (event.partyMode === mode || !event.partyStarted)) {
        setState(event);
      }
    }, () => {
      const savedName = getStoredGameName();
      if (savedName) {
        socket.current?.send('party/join', { mode, playerId: gamePlayerId, name: savedName });
      }
    });
    return () => { void socket.current?.disconnect(); };
  }, [tableId, mode]);

  const players = state.partyPlayers || [];
  const active = players.find(player => player.id === state.partyTurnId);
  const myTurn = state.partyTurnId === gamePlayerId;
  const isJoined = players.some(p => p.id === gamePlayerId);

  const join = () => {
    if (!name.trim()) return;
    const savedName = rememberGameName(name);
    if (savedName) {
      socket.current?.send('party/join', { mode, playerId: gamePlayerId, name: savedName });
    }
  };

  const start = () => {
    socket.current?.send('party/start', { mode, theme: selectedTheme });
  };

  const chooseOption = (choice: 'truth' | 'action') => {
    socket.current?.send('party/choice', { playerId: gamePlayerId, choice });
  };

  const resetGame = () => {
    socket.current?.send('party/reset', {});
  };

  const leaveGame = () => {
    socket.current?.send('party/leave', { playerId: gamePlayerId });
    onBack();
  };

  return (
    <section className="mx-auto max-w-md p-4 pb-24">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-gray-300 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Divertissement
        </button>
        <button onClick={leaveGame} className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all">
          🚪 Quitter la table
        </button>
      </div>

      <div className={`rounded-3xl bg-gradient-to-br ${meta[mode].gradient} p-5 shadow-2xl relative overflow-hidden border border-white/10`}>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-4xl drop-shadow-md">{meta[mode].emoji}</span>
            <h2 className="mt-2 text-2xl font-black text-white tracking-tight">{meta[mode].title}</h2>
            <p className="text-xs text-white/80 font-medium">1 à 6 joueurs · Ambiance & Confidences</p>
          </div>
          {state.partyStarted && (
            <button onClick={resetGame} title="Réinitialiser la partie" className="rounded-full bg-black/30 p-2 text-white/80 hover:bg-black/50 hover:text-white transition-all">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lobby / Join view */}
      {!state.partyStarted ? (
        <div className="mt-4 space-y-4 rounded-3xl border border-white/10 bg-[#11131d] p-5 shadow-xl">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Votre Pseudonyme</label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Entrez votre prénom..."
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={join}
                className={`rounded-2xl px-5 text-sm font-bold transition-all shadow-md shrink-0 ${
                  isJoined ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:brightness-110'
                }`}
              >
                {isJoined ? '✓ Inscrit' : 'Rejoindre'}
              </button>
            </div>
          </div>

          {/* Theme Selector for Action / Vérité */}
          {mode === 'truth' && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Thème de la soirée
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map(theme => {
                  const Icon = theme.icon;
                  const selected = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id as any)}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                        selected
                          ? `bg-gradient-to-br ${theme.color} border-white/40 shadow-lg scale-[1.02]`
                          : 'bg-black/30 border-white/10 text-gray-300 hover:bg-black/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                        <span>{theme.emoji}</span>
                        <span>{theme.name}</span>
                      </div>
                      <span className="text-[10px] text-white/70 mt-1 line-clamp-2">{theme.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Round Table visualization */}
          <div className="pt-2">
            <RoundGameTable players={players}>
              <span className="text-4xl">{meta[mode].emoji}</span>
            </RoundGameTable>
          </div>

          {/* Start button */}
          <button
            disabled={players.length < 1}
            onClick={start}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 font-black text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 disabled:opacity-40"
          >
            <Play className="h-5 w-5 fill-slate-950" /> Démarrer la partie
          </button>
        </div>
      ) : (
        /* Active Game View */
        <div className="mt-4 space-y-4">
          <RoundGameTable players={players} turnId={state.partyTurnId}>
            <div className="max-w-56 rounded-2xl bg-white p-4 text-center text-sm font-black leading-relaxed text-slate-900 shadow-2xl border border-white/20 space-y-1">
              {mode === 'truth' && state.partyChoice && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 tracking-wider">
                  {state.partyChoice === 'truth' ? '💬 VÉRITÉ' : '⚡ ACTION'}
                </span>
              )}
              <p className="pt-0.5">
                {state.partyPrompt || (mode === 'truth' ? 'Choisissez Action ⚡ ou Vérité 💬' : 'Chargement du défi...')}
              </p>
            </div>
          </RoundGameTable>

          {/* Turn indicator */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              🎯 Tour de <span className="underline">{active?.name || 'Joueur'}</span>
            </span>
          </div>

          {/* Choice Selection Phase for Truth or Dare */}
          {mode === 'truth' && !state.partyChoice && (
            <div className="rounded-3xl border border-purple-500/30 bg-purple-950/40 p-5 backdrop-blur-md shadow-2xl space-y-3">
              {myTurn ? (
                <>
                  <p className="text-center font-black text-lg text-white flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" /> C'est votre tour ! Choisissez :
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => chooseOption('truth')}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-black text-base shadow-lg hover:scale-105 transition-all border border-indigo-400/30"
                    >
                      <span className="text-3xl">💬</span>
                      <span>VÉRITÉ</span>
                      <span className="text-[10px] font-normal text-purple-200">Question à révéler</span>
                    </button>
                    <button
                      onClick={() => chooseOption('action')}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white font-black text-base shadow-lg hover:scale-105 transition-all border border-amber-400/30"
                    >
                      <span className="text-3xl">⚡</span>
                      <span>ACTION</span>
                      <span className="text-[10px] font-normal text-amber-200">Défi à réaliser</span>
                    </button>
                  </div>
                  <button
                    onClick={() => socket.current?.send('party/next', { playerId: gamePlayerId })}
                    className="w-full mt-2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300 transition-all border border-white/10"
                  >
                    ⏭️ Passer mon tour (Joueur suivant)
                  </button>
                </>
              ) : (
                <div className="text-center py-3 space-y-2">
                  <p className="text-purple-200 font-medium text-sm animate-pulse">
                    ⏳ En attente que <span className="font-bold text-amber-300">{active?.name}</span> choisisse entre <span className="font-bold">Action ⚡</span> et <span className="font-bold">Vérité 💬</span>...
                  </p>
                  <button
                    onClick={() => socket.current?.send('party/next', { playerId: gamePlayerId })}
                    className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-gray-400 transition-all border border-white/5"
                  >
                    Passer au joueur suivant ⏭️
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quiz reveal section */}
          {mode === 'quiz' && state.partyRevealed && (
            <div className="space-y-3 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Réponse Officielle</p>
                <p className="mt-1 text-sm font-bold text-white">{state.partyAnswer}</p>
              </div>
              <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4">
                <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-sky-300">
                  <MessageCircle className="h-3.5 w-3.5" /> Sujet de Débat
                </p>
                <p className="mt-1 text-sm font-bold text-white">{state.partyDiscussion}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            {myTurn && mode === 'quiz' && !state.partyRevealed && (
              <button
                onClick={() => socket.current?.send('party/reveal', { playerId: gamePlayerId })}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-3.5 font-black text-slate-950 shadow-lg shadow-emerald-400/20 hover:bg-emerald-300 transition-all"
              >
                <Eye className="h-5 w-5" /> Afficher la réponse
              </button>
            )}

            {(mode === 'truth' ? !!state.partyChoice : state.partyRevealed) && (
              <button
                onClick={() => socket.current?.send('party/next', { playerId: gamePlayerId })}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 font-black text-slate-950 shadow-lg shadow-amber-400/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <span>Passer au joueur suivant</span> <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
