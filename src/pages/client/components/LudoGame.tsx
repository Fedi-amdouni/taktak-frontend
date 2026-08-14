import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Dices, Play, Users, Bot } from 'lucide-react';
import { createGameSocket, gamePlayerId, getStoredGameName, rememberGameName, type GameEvent } from '../../../services/gameSocket';
import boardImage from '../../../assets/ludo-board-reference.png';
import { GameResultBanner } from './GameResultBanner';
import { ConfirmLeaveModal } from './ConfirmLeaveModal';

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
  const stateRef = useRef<GameEvent>({ type: 'ludo_state' });
  const rollingRef = useRef(false);
  const rollIntervalRef = useRef<number | null>(null);
  const rollTimerRef = useRef<number | null>(null);
  const moveTimerRef = useRef<number | null>(null);
  const [name, setName] = useState(getStoredGameName);
  const [gameMode, setGameMode] = useState<'friends' | 'bot'>('friends');
  const [state, setState] = useState<GameEvent>({ type: 'ludo_state' });
  const [isRolling, setIsRolling] = useState(false);
  const [rollingFace, setRollingFace] = useState(1);
  const [displayDice, setDisplayDice] = useState<number | null>(null);
  const [movingTokens, setMovingTokens] = useState<string[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const animateDice = (targetDice?: number | null) => {
    if (rollingRef.current) return;
    rollingRef.current = true;
    setIsRolling(true);
    let face = displayDice || 1;
    setRollingFace(face);
    rollIntervalRef.current = window.setInterval(() => {
      face = (face % 6) + 1;
      setRollingFace(face);
    }, 90);
    rollTimerRef.current = window.setTimeout(() => {
      if (rollIntervalRef.current !== null) window.clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
      rollingRef.current = false;
      setIsRolling(false);
      if (targetDice !== undefined && targetDice !== null) {
        setDisplayDice(targetDice);
      }
    }, 600);
  };

  useEffect(() => {
    const handleEvent = (event: GameEvent) => {
      if (event.type !== 'ludo_state') return;
      const previous = stateRef.current;
      stateRef.current = event;

      const changedTokens: string[] = [];
      Object.entries(event.ludoTokens || {}).forEach(([playerId, tokens]) => {
        const previousTokens = previous.ludoTokens?.[playerId];
        tokens.forEach((progress, tokenIndex) => {
          if (previousTokens && previousTokens[tokenIndex] !== progress) changedTokens.push(`${playerId}-${tokenIndex}`);
        });
      });
      if (changedTokens.length) {
        setMovingTokens(changedTokens);
        if (moveTimerRef.current !== null) window.clearTimeout(moveTimerRef.current);
        moveTimerRef.current = window.setTimeout(() => setMovingTokens([]), 800);
      }
      if (event.ludoDice !== null && event.ludoDice !== undefined) {
        setDisplayDice(event.ludoDice);
        animateDice(event.ludoDice);
      }
      setState(event);
    };

    socket.current = createGameSocket(tableId, handleEvent, () => {
      const savedName = getStoredGameName();
      socket.current?.send('ludo/join', { playerId: gamePlayerId, name: savedName || '' });
    });

    return () => {
      socket.current?.send('ludo/leave', { playerId: gamePlayerId });
      void socket.current?.disconnect();
      if (rollIntervalRef.current !== null) window.clearInterval(rollIntervalRef.current);
      if (rollTimerRef.current !== null) window.clearTimeout(rollTimerRef.current);
      if (moveTimerRef.current !== null) window.clearTimeout(moveTimerRef.current);
    };
  }, [tableId]);

  const players = state.ludoPlayers || [];
  const amIJoined = players.some(player => player.id === gamePlayerId);
  const myTurn = state.ludoTurnId === gamePlayerId;
  const winner = players.find(player => player.id === state.ludoWinner)?.name;

  const hasAnyValidMove = React.useMemo(() => {
    const rolled = state.ludoDice;
    if (!myTurn || state.ludoCanRoll || rolled === null || rolled === undefined) return true;
    const myTokens = state.ludoTokens?.[gamePlayerId] || [];
    return myTokens.some(p => (p === -1 && rolled === 6) || (p >= 0 && p < 57 && p + rolled <= 57));
  }, [myTurn, state.ludoCanRoll, state.ludoDice, state.ludoTokens]);

  useEffect(() => {
    if (myTurn && !state.ludoCanRoll && state.ludoDice !== null && !isRolling && !hasAnyValidMove && !winner) {
      const timer = window.setTimeout(() => {
        socket.current?.send('ludo/pass', { playerId: gamePlayerId });
      }, 1400);
      return () => window.clearTimeout(timer);
    }
  }, [myTurn, state.ludoCanRoll, state.ludoDice, isRolling, hasAnyValidMove, winner]);

  const join = () => {
    const savedName = rememberGameName(name);
    if (savedName) socket.current?.send('ludo/join', { playerId: gamePlayerId, name: savedName });
  };

  const startGame = () => {
    socket.current?.send('ludo/start', { botEnabled: gameMode === 'bot' || players.length < 2 });
  };

  const rollDice = () => {
    animateDice();
    socket.current?.send('ludo/roll', { playerId: gamePlayerId });
  };

  const leaveGame = () => {
    socket.current?.send('ludo/leave', { playerId: gamePlayerId });
    onBack();
  };

  return <section className="mx-auto max-w-md p-4 pb-24 space-y-3">
    <div className="flex items-center justify-between">
      <button onClick={() => { if (state.ludoStarted || amIJoined) setShowLeaveModal(true); else onBack(); }} className="flex items-center gap-1 text-sm font-bold text-gray-300"><ArrowLeft className="h-4 w-4" /> Divertissement</button>
      <button onClick={() => setShowLeaveModal(true)} className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all">🚪 Quitter la table</button>
    </div>
    <div className="rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-900 p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-100">Classique à quatre</p>
      <h2 className="mt-1 text-2xl font-black text-white">Ludo Café</h2>
      <p className="text-xs text-white/70">Sors tes pions, capture tes amis et rentre à la maison.</p>
    </div>

    {!state.ludoStarted ? (
      <div className="space-y-4 rounded-3xl border border-white/10 bg-[#11131d] p-5 shadow-2xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">Rejoindre la table</p>
          <p className="mt-1 text-xs text-gray-400">Saisis ton prénom pour t’installer à la table de Ludo.</p>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && join()}
              placeholder="Votre prénom"
              className="min-w-0 flex-1 rounded-xl bg-black/40 px-3.5 py-3 text-sm text-white outline-none border border-white/10 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
            <button
              onClick={join}
              className={`rounded-xl px-5 py-3 text-xs font-black transition-all ${
                amIJoined ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30' : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
              }`}
            >
              {amIJoined ? 'Mettre à jour' : 'Rejoindre'}
            </button>
          </div>
          {amIJoined && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span>✓</span> Tu as rejoint la table avec succès !
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setGameMode('friends')}
            className={`rounded-2xl border p-3 text-left transition ${
              gameMode === 'friends' ? 'border-cyan-400/70 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs font-black text-white"><Users className="h-4 w-4 text-cyan-300" /> À plusieurs</span>
            <span className="mt-0.5 block text-[10px] text-white/50">2 à 4 joueurs</span>
          </button>
          <button
            onClick={() => setGameMode('bot')}
            className={`rounded-2xl border p-3 text-left transition ${
              gameMode === 'bot' ? 'border-cyan-400/70 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs font-black text-white"><Bot className="h-4 w-4 text-cyan-300" /> Solo vs Bots</span>
            <span className="mt-0.5 block text-[10px] text-white/50">Bots IA auto-remplis</span>
          </button>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-white/50">Joueurs installés ({players.length}/4)</p>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map(index => (
              <div
                key={index}
                className="rounded-2xl p-3 text-center transition-all"
                style={{ backgroundColor: `${colors[index]}22`, border: `1px solid ${colors[index]}66` }}
              >
                <div className="mx-auto h-7 w-7 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: colors[index] }}>
                  {index + 1}
                </div>
                <p className="mt-2 truncate text-[10px] font-black text-white">
                  {players[index]?.name || 'En attente'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          disabled={!amIJoined}
          onClick={startGame}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-300 py-3.5 text-sm font-black text-slate-950 transition hover:bg-yellow-200 disabled:opacity-40 shadow-lg"
        >
          <Play className="h-4 w-4" /> Démarrer la partie {gameMode === 'bot' || players.length < 2 ? '(avec Bots)' : ''}
        </button>
      </div>
    ) : <>
      <div className="relative mx-auto w-full overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[0_24px_55px_rgba(0,0,0,.5)]" style={{ aspectRatio: '259 / 267' }}>
        <img src={boardImage} alt="Plateau Ludo classique" className="absolute inset-0 h-full w-full select-none" draggable={false} />
        {players.flatMap((player, playerIndex) => (state.ludoTokens?.[player.id] || []).map((progress, tokenIndex) => {
          const [row, column] = positionFor(playerIndex, tokenIndex, progress);
          const isMine = player.id === gamePlayerId;
          const movable = isMine && myTurn && !state.ludoCanRoll && !winner && !isRolling && hasAnyValidMove;
          const tokenKey = `${player.id}-${tokenIndex}`;
          return <button key={tokenKey} disabled={!movable} onClick={() => socket.current?.send('ludo/move', { playerId: gamePlayerId, tokenIndex })} aria-label={`Pion ${tokenIndex + 1} de ${player.name}`} className={`absolute z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white shadow-[0_3px_5px_rgba(0,0,0,.5)] transition-[left,top] duration-700 ease-in-out ${movable ? 'h-[7.5%] w-[7.5%] animate-pulse cursor-pointer ring-2 ring-slate-900' : 'h-[6.5%] w-[6.5%]'} ${movingTokens.includes(tokenKey) ? 'animate-token-hop' : ''}`} style={{ left: `${((column + .5) / 15) * 100 + (tokenIndex - 1.5) * .45}%`, top: `${((row + .5) / 15) * 100 + (tokenIndex - 1.5) * .35}%`, backgroundColor: colors[playerIndex] }}><span className="h-2/5 w-2/5 rounded-full bg-white/60" /></button>;
        }))}
        <button
          disabled={!myTurn || !state.ludoCanRoll || isRolling}
          onClick={rollDice}
          aria-label="Lancer le dé"
          className={`absolute left-1/2 top-1/2 z-30 grid h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border-2 border-white/90 bg-slate-900/95 text-3xl text-white shadow-2xl transition-all ${
            myTurn && state.ludoCanRoll && !isRolling
              ? 'cursor-pointer ring-4 ring-yellow-400 shadow-yellow-400/50 animate-bounce hover:scale-110 active:scale-95'
              : 'opacity-90'
          } ${isRolling ? 'animate-dice-roll' : ''}`}
        >
          {isRolling ? diceFace[rollingFace] : displayDice ? diceFace[displayDice] : (state.ludoDice ? diceFace[state.ludoDice] : '🎲')}
        </button>
      </div>

      {isRolling && <p className="animate-pulse text-center text-xs font-black uppercase tracking-[.18em] text-cyan-200">Le dé roule…</p>}
      {myTurn && state.ludoCanRoll && !isRolling && (
        <p className="animate-pulse text-center text-xs font-extrabold uppercase tracking-wider text-yellow-300 bg-yellow-400/10 py-1.5 px-3 rounded-full border border-yellow-400/30">
          👉 Touche le dé 🎲 au centre ou clique en bas pour lancer !
        </p>
      )}
      {myTurn && !state.ludoCanRoll && !isRolling && !hasAnyValidMove && (
        <p className="animate-pulse text-center text-xs font-extrabold uppercase tracking-wider text-amber-300 bg-amber-500/20 py-2 px-3 rounded-full border border-amber-400/40">
          🎲 Tu as obtenu un {state.ludoDice}. Aucun pion ne peut bouger (besoin d'un 6). Passage au joueur suivant dans 1s…
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">{players.map((player, index) => <div key={player.id} className={`rounded-xl border p-2 ${player.id === state.ludoTurnId ? 'bg-white text-slate-950 ring-2 ring-yellow-300' : 'bg-white/5 text-white'}`} style={{ borderColor: colors[index] }}><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index] }} /><span className="truncate text-xs font-black">{player.name}{player.id === gamePlayerId ? ' · vous' : ''}</span></div><p className="mt-1 text-[9px] font-bold uppercase opacity-70">{player.id === state.ludoTurnId ? 'À toi de jouer' : 'En attente'}</p></div>)}</div>
      {winner ? <GameResultBanner winnerName={winner} tone="cyan" actionLabel="Rejouer la partie" onAction={() => socket.current?.send('ludo/start', { botEnabled: gameMode === 'bot' || players.length < 2 })} /> : <div className="rounded-2xl bg-white/5 p-3"><p className="mb-3 text-center text-xs font-black text-yellow-300">{myTurn ? (isRolling ? 'Le dé tourne…' : state.ludoCanRoll ? 'Lance le dé' : hasAnyValidMove ? 'Choisis un pion lumineux' : 'Aucun coup possible') : 'En attente du joueur actif'}</p><button disabled={!myTurn || !state.ludoCanRoll || isRolling} onClick={rollDice} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-300 py-3 font-black text-slate-950 disabled:opacity-40 shadow-lg hover:bg-yellow-200 transition-all"><Dices className="h-5 w-5" /> Lancer le dé</button></div>}
    </>}
    <ConfirmLeaveModal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} onConfirm={leaveGame} />
  </section>;
};
