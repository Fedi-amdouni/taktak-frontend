import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, MessageCircle, Play } from 'lucide-react';
import { createGameSocket, gamePlayerId, type GameEvent } from '../../services/gameSocket';
import { RoundGameTable } from './RoundGameTable';

interface Props { tableId: string; mode: 'quiz' | 'truth' | 'words'; onBack: () => void; }
const meta = {
  quiz: { title: 'Quiz & Débat', emoji: '🇹🇳', gradient: 'from-red-500 to-red-800' },
  truth: { title: 'Action ou Vérité', emoji: '🎭', gradient: 'from-purple-500 to-fuchsia-800' },
  words: { title: 'Klem fi Klem', emoji: '💬', gradient: 'from-emerald-500 to-teal-800' },
};

export const PartyGame: React.FC<Props> = ({ tableId, mode, onBack }) => {
  const socket = useRef<ReturnType<typeof createGameSocket> | null>(null);
  const [name, setName] = useState(() => localStorage.getItem('taktak_game_name') || '');
  const [state, setState] = useState<GameEvent>({ type: 'party_state' });

  useEffect(() => {
    socket.current = createGameSocket(tableId, event => event.type === 'party_state' && event.partyMode === mode && setState(event));
    return () => { void socket.current?.disconnect(); };
  }, [tableId, mode]);

  const players = state.partyPlayers || [];
  const active = players.find(player => player.id === state.partyTurnId);
  const myTurn = state.partyTurnId === gamePlayerId;
  const join = () => {
    if (!name.trim()) return;
    localStorage.setItem('taktak_game_name', name.trim());
    socket.current?.send('party/join', { mode, playerId: gamePlayerId, name: name.trim() });
  };

  return <section className="mx-auto max-w-md p-4 pb-24">
    <button onClick={onBack} className="mb-3 flex items-center gap-1 text-sm font-bold text-gray-300"><ArrowLeft className="h-4 w-4" /> Divertissement</button>
    <div className={`rounded-3xl bg-gradient-to-br ${meta[mode].gradient} p-5 shadow-xl`}>
      <p className="text-3xl">{meta[mode].emoji}</p><h2 className="text-2xl font-black text-white">{meta[mode].title}</h2>
      <p className="text-xs text-white/70">2 à 4 joueurs · question, réponse, puis débat</p>
    </div>

    {!state.partyStarted ? <div className="mt-4 space-y-3 rounded-3xl border border-white/10 bg-[#11131d] p-4">
      <input value={name} onChange={event => setName(event.target.value)} placeholder="Votre prénom" className="w-full rounded-xl bg-black/30 px-3 py-3 text-sm text-white" />
      <button onClick={join} className="w-full rounded-xl bg-white/10 py-3 text-sm font-bold text-white">Rejoindre le lobby</button>
      <RoundGameTable players={players}><span className="text-4xl">{meta[mode].emoji}</span></RoundGameTable>
      <button disabled={players.length < 2} onClick={() => socket.current?.send('party/start', { mode })} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-300 py-3 font-black text-slate-950 disabled:opacity-40"><Play className="h-4 w-4" /> Démarrer</button>
    </div> : <div className="mt-4 space-y-3">
      <RoundGameTable players={players} turnId={state.partyTurnId}><div className="max-w-48 rounded-2xl bg-white p-4 text-center text-sm font-black leading-snug text-slate-900 shadow-2xl">{state.partyPrompt}</div></RoundGameTable>
      <div className="text-center text-xs font-bold text-yellow-300">Tour de {active?.name}</div>

      {mode === 'quiz' && state.partyRevealed && <div className="space-y-3 animate-fadeIn">
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Réponse</p><p className="mt-1 text-sm font-bold text-white">{state.partyAnswer}</p></div>
        <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4"><p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-sky-300"><MessageCircle className="h-3.5 w-3.5" /> Discussion</p><p className="mt-1 text-sm font-bold text-white">{state.partyDiscussion}</p></div>
      </div>}

      {myTurn && mode === 'quiz' && !state.partyRevealed && <button onClick={() => socket.current?.send('party/reveal', { playerId: gamePlayerId })} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-3 font-black text-slate-950"><Eye className="h-4 w-4" /> Afficher la réponse</button>}
      {myTurn && (mode !== 'quiz' || state.partyRevealed) && <button onClick={() => socket.current?.send('party/next', { playerId: gamePlayerId })} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-300 py-3 font-black text-slate-950">Question suivante <ArrowRight className="h-4 w-4" /></button>}
    </div>}
  </section>;
};
