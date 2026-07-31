import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Dices, Play, RotateCcw } from 'lucide-react';
import { createGameSocket, gamePlayerId, type GameEvent } from '../../services/gameSocket';
import boardImage from '../../assets/ludo-board-reference.png';

interface Props { tableId: string; onBack: () => void; }
type Cell = [number, number];

const colors = ['#ff2635', '#1389f4', '#f5a900', '#0fbd0a'];
const diceFace = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const track: Cell[] = [
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0],
];
const homes: Cell[][] = [
  [[2,2],[2,4],[4,2],[4,4]], [[2,10],[2,12],[4,10],[4,12]],
  [[10,10],[10,12],[12,10],[12,12]], [[10,2],[10,4],[12,2],[12,4]],
];
const finishes: Cell[][] = [
  [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]], [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
];
const positionFor = (player: number, token: number, progress: number): Cell => {
  if (progress < 0) return homes[player][token];
  if (progress <= 51) return track[(player * 13 + progress) % 52];
  return finishes[player][Math.min(progress - 52, 5)];
};

export const LudoGame: React.FC<Props> = ({ tableId, onBack }) => {
  const socket = useRef<ReturnType<typeof createGameSocket> | null>(null);
  const [name, setName] = useState(() => localStorage.getItem('taktak_game_name') || '');
  const [state, setState] = useState<GameEvent>({ type: 'ludo_state' });

  useEffect(() => {
    socket.current = createGameSocket(tableId, event => event.type === 'ludo_state' && setState(event));
    return () => { void socket.current?.disconnect(); };
  }, [tableId]);

  const players = state.ludoPlayers || [];
  const myTurn = state.ludoTurnId === gamePlayerId;
  const winner = players.find(player => player.id === state.ludoWinner)?.name;
  const join = () => {
    if (!name.trim()) return;
    localStorage.setItem('taktak_game_name', name.trim());
    socket.current?.send('ludo/join', { playerId: gamePlayerId, name: name.trim() });
  };

  return <section className="mx-auto max-w-md space-y-4 p-4 pb-24">
    <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-gray-300"><ArrowLeft className="h-4 w-4" /> Divertissement</button>
    <div className="rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-900 p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-100">Classique à quatre</p>
      <h2 className="mt-1 text-2xl font-black text-white">Ludo Café</h2>
      <p className="text-xs text-white/70">Sors tes pions, capture tes amis et rentre à la maison.</p>
    </div>

    {!state.ludoStarted ? <div className="space-y-3 rounded-3xl border border-white/10 bg-[#11131d] p-4">
      <input value={name} onChange={event => setName(event.target.value)} placeholder="Votre prénom" className="w-full rounded-xl bg-black/30 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400" />
      <button onClick={join} className="w-full rounded-xl bg-white/10 py-3 text-sm font-bold text-white">Rejoindre</button>
      <div className="grid grid-cols-4 gap-2">{[0,1,2,3].map(index => <div key={index} className="rounded-2xl p-3 text-center" style={{ backgroundColor: `${colors[index]}22`, border: `1px solid ${colors[index]}66` }}><div className="mx-auto h-7 w-7 rounded-full border-2 border-white" style={{ backgroundColor: colors[index] }} /><p className="mt-2 truncate text-[10px] font-black text-white">{players[index]?.name || 'En attente'}</p></div>)}</div>
      <button disabled={players.length < 2} onClick={() => socket.current?.send('ludo/start')} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-300 py-3 font-black text-slate-950 disabled:opacity-40"><Play className="h-4 w-4" /> Démarrer</button>
    </div> : <>
      <div className="relative mx-auto w-full overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[0_24px_55px_rgba(0,0,0,.5)]" style={{ aspectRatio: '259 / 267' }}>
        <img src={boardImage} alt="Plateau Ludo classique" className="absolute inset-0 h-full w-full select-none" draggable={false} />
        {players.flatMap((player, playerIndex) => (state.ludoTokens?.[player.id] || []).map((progress, tokenIndex) => {
          const [row, column] = positionFor(playerIndex, tokenIndex, progress);
          const isMine = player.id === gamePlayerId;
          const movable = isMine && myTurn && !state.ludoCanRoll && !winner;
          return <button key={`${player.id}-${tokenIndex}`} disabled={!movable} onClick={() => socket.current?.send('ludo/move', { playerId: gamePlayerId, tokenIndex })} aria-label={`Pion ${tokenIndex + 1} de ${player.name}`} className={`absolute z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white shadow-[0_3px_5px_rgba(0,0,0,.5)] transition ${movable ? 'h-[7.5%] w-[7.5%] animate-pulse cursor-pointer ring-2 ring-slate-900' : 'h-[6.5%] w-[6.5%]'}`} style={{ left: `${((column + .5) / 15) * 100 + (tokenIndex - 1.5) * .45}%`, top: `${((row + .5) / 15) * 100 + (tokenIndex - 1.5) * .35}%`, backgroundColor: colors[playerIndex] }}><span className="h-2/5 w-2/5 rounded-full bg-white/60" /></button>;
        }))}
        <div className="absolute left-1/2 top-1/2 z-30 grid h-[15%] w-[15%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl border-2 border-white/80 bg-slate-900/90 text-3xl text-white shadow-xl">{state.ludoDice ? diceFace[state.ludoDice] : '🎲'}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">{players.map((player, index) => <div key={player.id} className={`rounded-xl border p-2 ${player.id === state.ludoTurnId ? 'bg-white text-slate-950 ring-2 ring-yellow-300' : 'bg-white/5 text-white'}`} style={{ borderColor: colors[index] }}><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index] }} /><span className="truncate text-xs font-black">{player.name}{player.id === gamePlayerId ? ' · vous' : ''}</span></div><p className="mt-1 text-[9px] font-bold uppercase opacity-70">{player.id === state.ludoTurnId ? 'À toi de jouer' : 'En attente'}</p></div>)}</div>
      <div className="rounded-2xl bg-white/5 p-3">
        <p className="mb-3 text-center text-xs font-black text-yellow-300">{winner ? `${winner} gagne !` : myTurn ? (state.ludoCanRoll ? 'Lance le dé' : 'Choisis un pion lumineux') : 'En attente du joueur actif'}</p>
        {winner ? <button onClick={() => socket.current?.send('ludo/start')} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 py-3 font-bold text-white"><RotateCcw className="h-4 w-4" /> Rejouer</button> : <button disabled={!myTurn || !state.ludoCanRoll} onClick={() => socket.current?.send('ludo/roll', { playerId: gamePlayerId })} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-300 py-3 font-black text-slate-950 disabled:opacity-40"><Dices className="h-5 w-5" /> Lancer le dé</button>}
      </div>
    </>}
  </section>;
};
