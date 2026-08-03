import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { createGameSocket, gamePlayerId, getStoredGameName, rememberGameName, type GameEvent } from '../../services/gameSocket';
import { GameResultBanner } from './GameResultBanner';

const emptyBoard = () => Array.from({ length: 6 }, () => Array(7).fill(0));
interface Props { tableId: string; onBack: () => void; }

export const ConnectFourGame: React.FC<Props> = ({ tableId, onBack }) => {
  const socket = useRef<ReturnType<typeof createGameSocket> | null>(null);
  const [name, setName] = useState(getStoredGameName);
  const [board, setBoard] = useState<number[][]>(emptyBoard());
  const [red, setRed] = useState<GameEvent['redPlayer']>(null);
  const [yellow, setYellow] = useState<GameEvent['yellowPlayer']>(null);
  const [turn, setTurn] = useState<'RED' | 'YELLOW'>('RED');
  const [winner, setWinner] = useState<'RED' | 'YELLOW' | null>(null);
  const [draw, setDraw] = useState(false);

  useEffect(() => {
    const apply = (event: GameEvent) => {
      if (event.type !== 'connect_four_state') return;
      setBoard(event.board || emptyBoard()); setRed(event.redPlayer || null); setYellow(event.yellowPlayer || null);
      setTurn(event.turn || 'RED'); setWinner(event.winner || null); setDraw(Boolean(event.draw));
    };
    socket.current = createGameSocket(tableId, apply, () => {
      const savedName = getStoredGameName();
      if (savedName) socket.current?.send('connect-four/join', { playerId: gamePlayerId, name: savedName });
    });
    return () => { socket.current?.disconnect(); socket.current = null; };
  }, [tableId]);

  const join = () => { const savedName = rememberGameName(name); if (savedName) socket.current?.send('connect-four/join', { playerId: gamePlayerId, name: savedName }); };
  const myColor = red?.id === gamePlayerId ? 'RED' : yellow?.id === gamePlayerId ? 'YELLOW' : null;
  const canPlay = Boolean(myColor && myColor === turn && !winner && !draw);
  const status = winner ? `${winner === 'RED' ? red?.name : yellow?.name} gagne !` : draw ? 'Match nul !' : !red || !yellow ? 'En attente de deux joueurs…' : `Tour de ${turn === 'RED' ? red.name : yellow.name}`;

  const leaveGame = () => {
    socket.current?.send('connect-four/leave', { playerId: gamePlayerId });
    onBack();
  };

  return <section className="mx-auto max-w-md p-4 pb-24 space-y-4">
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-gray-300"><ArrowLeft className="h-4 w-4"/> Divertissement</button>
      <button onClick={leaveGame} className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all">🚪 Quitter la table</button>
    </div>
    <div className="rounded-[30px] border border-blue-400/20 bg-gradient-to-br from-[#141827] to-[#0b1020] p-5 shadow-xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-300">Duel en direct</p><h2 className="text-2xl font-black text-white">Puissance 4</h2><p className="mt-1 text-xs text-gray-400">Alignez quatre jetons pour gagner.</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-yellow-300/10"><Trophy className="h-6 w-6 text-amber-300" /></div></div>
      <div className="mt-4 flex gap-2"><input value={name} onChange={e => setName(e.target.value)} placeholder="Votre prénom" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" /><button onClick={join} className="rounded-xl bg-amber-400 px-3 text-xs font-black text-gray-950">Jouer</button></div>
      <div className="mt-4 grid grid-cols-2 gap-3"><div className={`rounded-2xl border p-3 ${turn==='RED'?'border-red-400 bg-red-500/15':'border-white/10 bg-white/5'}`}><p className="text-[9px] font-bold uppercase text-red-300">Joueur rouge</p><p className="truncate text-sm font-black text-white">{red?.name || 'En attente…'}</p></div><div className={`rounded-2xl border p-3 ${turn==='YELLOW'?'border-yellow-300 bg-yellow-300/15':'border-white/10 bg-white/5'}`}><p className="text-[9px] font-bold uppercase text-yellow-300">Joueur jaune</p><p className="truncate text-sm font-black text-white">{yellow?.name || 'En attente…'}</p></div></div></div>
    <div className="rounded-[28px] border-b-8 border-blue-950 bg-gradient-to-b from-blue-500 to-blue-800 p-3 shadow-[0_24px_45px_rgba(17,50,150,.35)]"><div className="mb-2 grid grid-cols-7 gap-1">{Array.from({length:7},(_,c)=><button key={c} disabled={!canPlay||board[0][c]!==0} onClick={()=>socket.current?.send('connect-four/move',{playerId:gamePlayerId,column:c})} className="text-center text-sm text-blue-100 disabled:opacity-20">▼</button>)}</div><div className="grid grid-cols-7 gap-1.5">{board.flatMap((row, r) => row.map((cell, c) => <button key={`${r}-${c}`} disabled={!canPlay || board[0][c] !== 0} onClick={() => socket.current?.send('connect-four/move', { playerId: gamePlayerId, column: c })} className="aspect-square rounded-full bg-blue-950/90 p-1 disabled:cursor-default"><span className={`block h-full w-full rounded-full transition-all ${cell === 1 ? 'scale-100 bg-gradient-to-br from-red-300 to-red-600 shadow-[inset_0_-5px_0_rgba(0,0,0,.22)]' : cell === 2 ? 'scale-100 bg-gradient-to-br from-yellow-100 to-yellow-400 shadow-[inset_0_-5px_0_rgba(0,0,0,.18)]' : 'scale-90 bg-[#080d20] shadow-inner'}`} /></button>))}</div></div>
    {winner || draw ? <GameResultBanner winnerName={winner === 'RED' ? red?.name : yellow?.name} draw={draw} tone="red" actionLabel="Rejouer la partie" onAction={() => socket.current?.send('connect-four/replay')} /> : <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white"><Users className="mr-1 inline h-4 w-4 text-gray-400" />{status}</div>}
  </section>;
};
