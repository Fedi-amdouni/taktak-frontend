import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Bot, Club, Coins, Diamond, Heart, Layers3, Play, Sparkles, Spade, Target, Trophy, Users, Zap } from 'lucide-react';
import { createGameSocket, gamePlayerId, getStoredGameName, rememberGameName, type ChkobbaCard, type GameEvent } from '../../services/gameSocket';
import { GameResultBanner } from './GameResultBanner';
import { ConfirmLeaveModal } from './ConfirmLeaveModal';
import woodTableTexture from '../../assets/chkobba-wood-table.webp';
import cardBackTexture from '../../assets/chkobba-card-back.webp';
import jackFemme from '../../assets/chkobba-jack-femme.png';
import queenPrince from '../../assets/chkobba-queen-prince.png';
import kingArtwork from '../../assets/chkobba-king.png';
import ramiJoker from '../../assets/rami-joker.png';

interface Props { tableId: string; onBack: () => void; }

const suitMeta = {
  DINARI: { Icon: Diamond, label: 'carreau', ink: 'text-[#c92636]', red: true },
  KOPPA: { Icon: Heart, label: 'cœur', ink: 'text-[#c92636]', red: true },
  SABRES: { Icon: Spade, label: 'pique', ink: 'text-[#171717]', red: false },
  BASTONI: { Icon: Club, label: 'trèfle', ink: 'text-[#171717]', red: false },
  JOKER: { Icon: Sparkles, label: 'joker', ink: 'text-[#171717]', red: false },
};

const playerColors = ['#f8b84e', '#67e8f9', '#fb7185', '#a78bfa'];
const teamLabel = (teamId?: string) => teamId === 'TEAM_A' ? 'Équipe A' : teamId === 'TEAM_B' ? 'Équipe B' : 'Équipe';

const cardLabel = (card: ChkobbaCard) => {
  if (card.rank === 'JKR') return 'Joker';
  if (card.rank === 'A') return 'As';
  if (card.rank === 'J') return 'Femme';
  if (card.rank === 'Q') return 'Prince';
  if (card.rank === 'K') return 'Roi';
  return card.rank;
};

const faceArtwork: Partial<Record<'J' | 'Q' | 'K', string>> = {
  J: jackFemme,
  Q: queenPrince,
  K: kingArtwork,
};

const getCaptureOptions = (played: ChkobbaCard | null, table: ChkobbaCard[]) => {
  if (!played) return [];
  const exact = table.filter(card => card.value === played.value).map(card => [card.id]);
  if (exact.length > 0) return exact;

  const options: string[][] = [];
  for (let mask = 1; mask < (1 << table.length); mask += 1) {
    const ids: string[] = [];
    let sum = 0;
    table.forEach((card, index) => {
      if (mask & (1 << index)) {
        ids.push(card.id);
        sum += card.value;
      }
    });
    if (sum === played.value) options.push(ids);
  }
  return options;
};

const sameIds = (left: string[], right: string[]) => left.length === right.length && [...left].sort().join('|') === [...right].sort().join('|');

const pipLayouts: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[50, 24], [50, 76]],
  3: [[50, 22], [50, 50], [50, 78]],
  4: [[30, 25], [70, 25], [30, 75], [70, 75]],
  5: [[30, 23], [70, 23], [50, 50], [30, 77], [70, 77]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
  7: [[30, 18], [70, 18], [50, 35], [30, 50], [70, 50], [30, 80], [70, 80]],
};

export const CardFace: React.FC<{
  card: ChkobbaCard;
  small?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ card, small = false, selected = false, disabled = false, onClick }) => {
  const meta = suitMeta[card.suit] || suitMeta.BASTONI;
  const SuitIcon = meta.Icon;
  const numericRank = card.rank === 'A' ? 1 : Number(card.rank);
  const pips = pipLayouts[numericRank] || [];
  const isFaceCard = ['J', 'Q', 'K'].includes(card.rank);
  const isJoker = card.rank === 'JKR';
  const artwork = faceArtwork[card.rank as 'J' | 'Q' | 'K'];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${cardLabel(card)} de ${meta.label}`}
      className={`group relative overflow-hidden rounded-[9px] border bg-[#fffdf8] text-left shadow-[0_7px_14px_rgba(24,12,5,.34)] transition duration-300 ${small ? 'h-[98px] w-[68px]' : 'h-[142px] min-w-[96px]'} ${selected ? 'z-10 -translate-y-3 border-[#e4b65f] ring-4 ring-[#f1c777]/45' : 'border-white/80 hover:-translate-y-2'} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {!isJoker && <span className={`absolute left-1.5 top-1.5 flex flex-col items-center font-serif font-black leading-none ${meta.ink}`}>
        <span className={small ? 'text-sm' : 'text-lg'}>{card.rank}</span>
        <SuitIcon className={small ? 'mt-0.5 h-2.5 w-2.5 fill-current' : 'mt-0.5 h-3.5 w-3.5 fill-current'} strokeWidth={1.6} />
      </span>}
      {isJoker ? <span className="absolute inset-[8%] overflow-hidden"><img src={ramiJoker} alt="" draggable={false} className="h-full w-full object-contain mix-blend-multiply" /></span> : isFaceCard ? (
        <span className={`absolute inset-x-[14%] inset-y-[13%] overflow-hidden border-y-2 ${meta.red ? 'border-[#c92636]/30 bg-[#c92636]/[.055]' : 'border-black/20 bg-black/[.035]'}`}>
          {artwork && <img src={artwork} alt="" draggable={false} className="h-full w-full object-contain mix-blend-multiply" />}
        </span>
      ) : pips.map(([left, top], index) => (
        <SuitIcon key={`${left}-${top}-${index}`} className={`absolute fill-current ${small ? 'h-3.5 w-3.5' : 'h-5 w-5'} ${meta.ink}`} style={{ left: `${left}%`, top: `${top}%`, transform: `translate(-50%, -50%)${top > 50 ? ' rotate(180deg)' : ''}` }} strokeWidth={1.4} />
      ))}
      {!isJoker && <span className={`absolute bottom-1.5 right-1.5 flex rotate-180 flex-col items-center font-serif font-black leading-none ${meta.ink}`}>
        <span className={small ? 'text-sm' : 'text-lg'}>{card.rank}</span>
        <SuitIcon className={small ? 'mt-0.5 h-2.5 w-2.5 fill-current' : 'mt-0.5 h-3.5 w-3.5 fill-current'} strokeWidth={1.6} />
      </span>}
    </button>
  );
};

export const CardBack: React.FC<{ small?: boolean }> = ({ small = false }) => (
  <div className={`rounded-[9px] border-[3px] border-[#fff8e8] bg-[#fff8e8] shadow-[0_8px_16px_rgba(30,13,4,.35)] ${small ? 'h-[86px] w-[58px]' : 'h-[108px] w-[74px]'}`}>
    <div className="h-full w-full rounded-[5px] bg-cover bg-center" style={{ backgroundImage: `url(${cardBackTexture})` }} />
  </div>
);

export const ChkobbaGame: React.FC<Props> = ({ tableId, onBack }) => {
  const socket = useRef<ReturnType<typeof createGameSocket> | null>(null);
  const [name, setName] = useState(getStoredGameName);
  const [targetScore, setTargetScore] = useState<11 | 21>(11);
  const [gameMode, setGameMode] = useState<'individual' | 'teams' | 'bot'>('individual');
  const [botPartnerId, setBotPartnerId] = useState<string | null>(null);
  const [state, setState] = useState<GameEvent>({ type: 'chkobba_state' });
  const [hand, setHand] = useState<ChkobbaCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ChkobbaCard | null>(null);
  const [selectedCaptureIds, setSelectedCaptureIds] = useState<string[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const draggedCard = useRef<ChkobbaCard | null>(null);

  useEffect(() => {
    socket.current = createGameSocket(
      tableId,
      event => {
        if (event.type === 'chkobba_state') {
          setState(event);
          if (event.chkobbaStarted && event.chkobbaTargetScore) setTargetScore(event.chkobbaTargetScore);
          setSelectedCard(null);
          setSelectedCaptureIds([]);
        }
        if (event.type === 'chkobba_hand') setHand(event.chkobbaHand || []);
      },
      () => {
        const savedName = getStoredGameName();
        if (savedName) socket.current?.send('chkobba/join', { playerId: gamePlayerId, name: savedName });
      },
      `/topic/table/${tableId}/game/chkobba/hand/${gamePlayerId}`,
    );
    return () => {
      void socket.current?.disconnect();
    };
  }, [tableId]);

  const players = state.chkobbaPlayers || [];
  const table = state.chkobbaTable || [];
  const started = Boolean(state.chkobbaStarted);
  const winner = players.find(player => player.id === state.chkobbaWinner);
  const activePlayer = players.find(player => player.id === state.chkobbaTurnId);
  const amIJoined = players.some(player => player.id === gamePlayerId);
  const myTurn = state.chkobbaTurnId === gamePlayerId && !state.chkobbaWinner;
  const captureOptions = useMemo(() => getCaptureOptions(selectedCard, table), [selectedCard, table]);
  const lastRoundWinner = players.find(player => player.id === state.chkobbaLastRoundWinner);
  const teamMode = started ? Boolean(state.chkobbaTeamMode) : gameMode === 'teams';

  const join = () => {
    const savedName = rememberGameName(name);
    if (savedName) socket.current?.send('chkobba/join', { playerId: gamePlayerId, name: savedName });
  };

  const startGame = () => {
    if (gameMode === 'bot') {
      socket.current?.send('chkobba/start', { targetScore, botEnabled: true, teamMode: false });
    } else {
      const needsBot = gameMode === 'teams' && players.length === 3;
      socket.current?.send('chkobba/start', { targetScore, botEnabled: needsBot, teamMode: gameMode === 'teams', botPartnerId: needsBot ? botPartnerId : null });
    }
  };

  const playMove = (card: ChkobbaCard, captureIds: string[]) => {
    socket.current?.send('chkobba/play', { playerId: gamePlayerId, cardId: card.id, captureIds });
    setSelectedCard(null);
    setSelectedCaptureIds([]);
  };

  const selectCard = (card: ChkobbaCard) => {
    if (!myTurn) return;
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      setSelectedCaptureIds([]);
      return;
    }
    const options = getCaptureOptions(card, table);
    if (options.length === 0) {
      playMove(card, []);
      return;
    }
    setSelectedCard(card);
    setSelectedCaptureIds([]);
  };

  const chooseCaptureCard = (cardId: string, sourceCard = selectedCard) => {
    if (!sourceCard) return;
    const options = getCaptureOptions(sourceCard, table);
    if (!options.some(option => option.includes(cardId))) return;
    let nextIds = selectedCaptureIds.includes(cardId)
      ? selectedCaptureIds.filter(id => id !== cardId)
      : [...selectedCaptureIds, cardId];
    if (nextIds.length > 0 && !options.some(option => nextIds.every(id => option.includes(id)))) nextIds = [cardId];
    const completedOption = options.find(option => sameIds(option, nextIds));
    if (completedOption) playMove(sourceCard, completedOption);
    else {
      setSelectedCard(sourceCard);
      setSelectedCaptureIds(nextIds);
    }
  };

  const startCardDrag = (event: React.DragEvent<HTMLDivElement>, card: ChkobbaCard) => {
    if (!myTurn) return;
    draggedCard.current = card;
    setSelectedCard(card);
    setSelectedCaptureIds([]);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', card.id);
  };

  const dropOnCaptureCard = (event: React.DragEvent<HTMLDivElement>, cardId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceCard = draggedCard.current;
    draggedCard.current = null;
    if (sourceCard) chooseCaptureCard(cardId, sourceCard);
  };

  const dropOnTable = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const sourceCard = draggedCard.current;
    draggedCard.current = null;
    if (sourceCard && getCaptureOptions(sourceCard, table).length === 0) playMove(sourceCard, []);
  };

  const status = state.chkobbaWinner
    ? `${winner?.name || 'Un joueur'} remporte la Chkobba !`
      : !started
      ? gameMode === 'teams' ? `${players.length}/4 joueurs · format 2v2` : `${players.length}/4 joueurs à la table`
      : !amIJoined
        ? 'Entre ton prénom pour rejoindre la partie'
        : myTurn
          ? selectedCard
            ? 'Touche la ou les cartes à ramasser'
            : 'À toi de jouer'
          : `Tour de ${activePlayer?.name || 'un joueur'}`;

  const leaveGame = () => {
    socket.current?.send('chkobba/leave', { playerId: gamePlayerId });
    onBack();
  };

  return (
    <section className="mx-auto max-w-md space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <button onClick={() => { if (started || amIJoined) setShowLeaveModal(true); else onBack(); }} className="flex items-center gap-1 text-sm font-bold text-gray-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Divertissement</button>
        <button onClick={() => setShowLeaveModal(true)} className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all">🚪 Quitter la table</button>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-[#f1c777]/25 bg-[linear-gradient(135deg,#182321,#101617)] p-5 shadow-[0_22px_55px_rgba(0,0,0,.26)]">
        <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-[#d59b4b]/15 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[.22em] text-[#f1c777]"><Sparkles className="h-3 w-3" /> Jeu de cartes tunisien</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-white">Chkobba</h2>
              <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-white/60">Prends juste, vide la mida et atteins l’objectif avant les autres.</p>
            </div>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#f1c777]/20 bg-[#f1c777]/10 text-[#f1c777] shadow-inner">
              <Layers3 className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white/50">
            <span className="rounded-full bg-white/10 px-2.5 py-1">Manche {state.chkobbaRound || 1}</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1">{state.chkobbaDeckRemaining || 0} cartes à distribuer</span>
            <span className="ml-auto flex items-center gap-1 text-[#f1c777]"><Zap className="h-3 w-3" /> {state.chkobbaTargetScore || targetScore} pts</span>
          </div>
        </div>
      </div>

      {!started ? (
        <div className="animate-fadeIn space-y-4 rounded-[28px] border border-[#f1c777]/20 bg-[#151b1b] p-4 shadow-xl">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#f1c777]">Choisis ton format</p>
            <p className="mt-1 text-sm text-gray-400">Une partie rapide entre amis ou un duel solo contre le bot.</p>
          </div>
          <div className="flex gap-2">
            <input value={name} onChange={event => setName(event.target.value)} onKeyDown={event => event.key === 'Enter' && join()} placeholder="Ton prénom" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm text-white outline-none" />
            <button onClick={join} className="rounded-xl bg-[#f1c777] px-4 text-xs font-black text-[#17201d] transition hover:bg-[#ffe09b]">Rejoindre</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setGameMode('individual')} className={`rounded-2xl border p-2.5 text-left transition ${gameMode === 'individual' ? 'border-[#f1c777]/70 bg-[#f1c777]/12' : 'border-white/10 bg-white/[.035] hover:border-white/20'}`}>
              <span className="flex items-center gap-1.5 text-xs font-black text-white"><Users className="h-3.5 w-3.5 text-[#f1c777]" /> Amis</span>
              <span className="mt-0.5 block text-[9px] text-white/45">2 à 4 joueurs</span>
            </button>
            <button onClick={() => setGameMode('bot')} className={`rounded-2xl border p-2.5 text-left transition ${gameMode === 'bot' ? 'border-[#f1c777]/70 bg-[#f1c777]/12' : 'border-white/10 bg-white/[.035] hover:border-white/20'}`}>
              <span className="flex items-center gap-1.5 text-xs font-black text-white"><Bot className="h-3.5 w-3.5 text-[#f1c777]" /> Solo Bot</span>
              <span className="mt-0.5 block text-[9px] text-white/45">1v1 vs Bot</span>
            </button>
            <button onClick={() => setGameMode('teams')} className={`rounded-2xl border p-2.5 text-left transition ${gameMode === 'teams' ? 'border-[#f1c777]/70 bg-[#f1c777]/12' : 'border-white/10 bg-white/[.035] hover:border-white/20'}`}>
              <span className="flex items-center gap-1.5 text-xs font-black text-white"><Sparkles className="h-3.5 w-3.5 text-[#f1c777]" /> 2v2</span>
              <span className="mt-0.5 block text-[9px] text-white/45">Par équipes</span>
            </button>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-3 py-2.5">
            <span className="flex items-center gap-2 text-xs font-black text-white"><Target className="h-4 w-4 text-[#f1c777]" /> Objectif</span>
            <div className="flex gap-1.5">
              {[11, 21].map(score => <button key={score} onClick={() => setTargetScore(score as 11 | 21)} className={`rounded-xl px-3 py-1.5 text-[10px] font-black transition ${targetScore === score ? 'bg-[#f1c777] text-[#17201d]' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}>{score} pts</button>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map(index => {
              const player = players[index];
              return <div key={index} className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-black/20 text-xs font-black" style={{ color: playerColors[index] }}>{player ? player.name.charAt(0).toUpperCase() : '+'}</span>
                  <span className="min-w-0 truncate text-xs font-bold text-white">{player?.name || 'Place libre'}</span>
                </div>
              </div>;
            })}
          </div>
          {gameMode === 'teams' && players.length === 3 && <div className="rounded-2xl border border-[#f1c777]/25 bg-[#f1c777]/[.07] p-3">
            <p className="text-xs font-black text-[#ffe8b2]">Choisis le partenaire du bot</p>
            <p className="mt-1 text-[10px] text-white/50">Le bot complète la quatrième place et joue dans l’équipe de la personne choisie.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">{players.map(player => <button key={player.id} onClick={() => setBotPartnerId(player.id)} className={`rounded-xl border px-2 py-2 text-[10px] font-black transition ${botPartnerId === player.id ? 'border-[#f1c777] bg-[#f1c777] text-[#17201d]' : 'border-white/10 bg-black/20 text-white/70'}`}>{player.name}</button>)}</div>
          </div>}
          {gameMode === 'teams' && <p className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-center text-[10px] font-semibold text-white/55">Il faut quatre places : 4 joueurs, ou 3 joueurs + Bot Sirocco.</p>}
          <button onClick={startGame} disabled={gameMode === 'bot' ? players.length < 1 : gameMode === 'teams' ? !(players.length === 4 || (players.length === 3 && Boolean(botPartnerId))) : players.length < 2} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f1c777] py-3.5 font-black text-[#17201d] shadow-lg shadow-[#d59b4b]/15 transition hover:bg-[#ffe09b] disabled:cursor-not-allowed disabled:opacity-35"><Play className="h-4 w-4" /> {gameMode === 'bot' ? 'Lancer en solo vs Bot' : gameMode === 'teams' ? players.length === 3 ? 'Ajouter le bot et lancer' : 'Lancer le 2v2' : 'Lancer la partie'}</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {players.map((player, index) => {
              const isActive = player.id === state.chkobbaTurnId;
              const isWinner = player.id === state.chkobbaWinner;
              const playerTeam = state.chkobbaTeamByPlayerId?.[player.id];
              const displayedScore = teamMode && playerTeam ? state.chkobbaTeamScores?.[playerTeam] || 0 : state.chkobbaScores?.[player.id] || 0;
              return <div key={player.id} className={`relative overflow-hidden rounded-2xl border p-3 transition ${isActive ? 'border-amber-300/80 bg-amber-300/10 shadow-[0_0_24px_rgba(251,191,36,.13)]' : 'border-white/10 bg-white/[.035]'} ${isWinner ? 'ring-2 ring-emerald-300/70' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: playerColors[index] || playerColors[0], boxShadow: `0 0 12px ${playerColors[index] || playerColors[0]}` }} />
                  <span className="min-w-0 flex-1 truncate text-xs font-black text-white">{player.name}{player.id === gamePlayerId ? ' · toi' : ''}</span>
                  <span className="text-xl font-black text-amber-200">{displayedScore}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-white/45">
                  <span>{state.chkobbaCapturedCounts?.[player.id] || 0} cartes</span>
                  <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> {teamMode && playerTeam ? teamLabel(playerTeam) : `${state.chkobbaScopaCounts?.[player.id] || 0} scopa`}</span>
                </div>
                {isActive && !state.chkobbaWinner && <span className="absolute bottom-0 left-0 h-0.5 w-full animate-pulse bg-amber-300" />}
              </div>;
            })}
          </div>

          <div className="relative overflow-hidden rounded-[32px] border-[4px] border-[#6b3d25] bg-cover bg-center p-4 shadow-[0_28px_60px_rgba(12,6,2,.52)]" style={{ backgroundImage: `url(${woodTableTexture})` }}>
            <div className="pointer-events-none absolute inset-2 rounded-[24px] border border-[#f4d6a5]/25" />
            <div className="relative">
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#f1c777]/30 bg-[#1e110b]/85 px-3.5 py-2 backdrop-blur-md shadow-md">
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#f1c777]">Score :</span>
                  {players.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-1 shrink-0 text-xs font-bold text-white">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: playerColors[idx] || '#f8b84e' }} />
                      <span className="text-white/80">{p.name}:</span>
                      <span className="font-black text-[#f1c777]">{teamMode && state.chkobbaTeamByPlayerId?.[p.id] ? state.chkobbaTeamScores?.[state.chkobbaTeamByPlayerId[p.id]] || 0 : state.chkobbaScores?.[p.id] || 0}</span>
                    </div>
                  ))}
                </div>
                <span className="ml-2 shrink-0 rounded-full bg-[#f1c777]/15 px-2 py-0.5 text-[9px] font-black uppercase text-[#f1c777]">Obj: {state.chkobbaTargetScore || targetScore} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#21130d]/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-[#f7dfb4] shadow-sm">Sur la table</span>
                <span className="rounded-full bg-[#21130d]/75 px-3 py-1.5 text-[10px] font-black text-white/80">{table.length ? `${table.length} cartes` : 'Table vide'}</span>
              </div>

              <div className="mt-4 grid min-h-[170px] grid-cols-[62px_1fr] items-center gap-3">
                <div className="relative flex h-[126px] items-center justify-center" aria-label={`${state.chkobbaDeckRemaining || 0} cartes dans le talon`}>
                  {state.chkobbaDeckRemaining ? (
                    <>
                      <div className="absolute translate-x-1.5 translate-y-1.5 rotate-2 opacity-65"><CardBack small /></div>
                      <div className="relative -rotate-2"><CardBack small /></div>
                      <span className="absolute -bottom-1 rounded-full bg-[#21130d]/85 px-2 py-1 text-[9px] font-black text-[#f7dfb4]">{state.chkobbaDeckRemaining}</span>
                    </>
                  ) : <span className="text-center text-[9px] font-black uppercase tracking-wider text-white/55">Talon vide</span>}
                </div>
                <div className="flex min-h-[140px] flex-wrap items-center justify-center gap-x-1 gap-y-3 rounded-2xl py-2" onDragOver={event => event.preventDefault()} onDrop={dropOnTable}>
                  {table.length ? table.map((card, index) => {
                    const selectable = Boolean(selectedCard && captureOptions.length > 0 && captureOptions.flat().includes(card.id));
                    const selected = selectedCaptureIds.includes(card.id);
                    const rotations = [-5, 3, -2, 5, -4, 2, 4, -3];
                    return <div key={card.id} onDragOver={selectable ? event => event.preventDefault() : undefined} onDrop={selectable ? event => dropOnCaptureCard(event, card.id) : undefined} className={`${selected ? 'animate-float' : ''} ${selectable ? 'rounded-xl ring-2 ring-[#f1c777]/70 ring-offset-2 ring-offset-transparent' : ''}`} style={{ transform: `rotate(${rotations[index % rotations.length]}deg)` }}><CardFace card={card} small selected={selected} disabled={!selectable} onClick={selectable ? () => chooseCaptureCard(card.id) : undefined} /></div>;
                  }) : <div className="grid place-items-center rounded-2xl bg-[#21130d]/45 px-6 py-5 text-center text-[#f7dfb4]"><Layers3 className="h-7 w-7" /><span className="mt-2 text-[10px] font-black uppercase tracking-widest">Mida fergha</span></div>}
                </div>
              </div>

              {state.chkobbaLastScopa && <div className="pointer-events-none absolute inset-x-0 top-24 z-20 grid place-items-center"><div className="animate-scopa-pop rounded-full border border-[#fff3cf] bg-[#f1c777] px-5 py-2 text-sm font-black uppercase tracking-[.18em] text-[#27160e] shadow-[0_8px_25px_rgba(48,22,8,.35)]">Chkobba !</div></div>}

              <div role="status" aria-live="polite" className={`mt-3 rounded-2xl border px-4 py-3 text-center text-sm font-black shadow-sm transition ${myTurn ? 'border-[#f1c777]/70 bg-[#24140d]/88 text-[#fff1cf]' : 'border-white/15 bg-[#24140d]/75 text-white'}`}>
                {status}
                {state.chkobbaLastCaptureCount ? <span className="ml-1 text-xs font-bold text-[#ffd98f]">· {state.chkobbaLastCaptureCount} prise{state.chkobbaLastCaptureCount > 1 ? 's' : ''}</span> : null}
              </div>

              {selectedCard && myTurn && captureOptions.length > 0 && (
                <div className="mt-3 animate-fadeIn rounded-2xl border border-[#f1c777]/45 bg-[#24140d]/88 px-3 py-2.5 text-center text-[11px] font-bold text-[#f7dfb4]">
                  Les prises possibles brillent : touche ou glisse vers {captureOptions.some(option => option.length > 1) ? 'les cartes à ramasser' : 'la carte à ramasser'}.
                </div>
              )}

              <div className="mt-5 border-t border-[#f7dfb4]/30 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[.18em] text-[#fff1cf]"><Users className="h-3 w-3" /> Tes cartes</p>
                    <p className="mt-1 text-xs font-semibold text-white/70">{myTurn ? selectedCard ? 'Touche la prise éclairée' : 'Touche une carte ou glisse-la sur la table' : 'En attendant ton tour'}</p>
                  </div>
                  <span className="rounded-full bg-[#21130d]/75 px-2.5 py-1 text-[10px] font-black text-[#f7dfb4]">{hand.length} cartes</span>
                </div>
                <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-4 pt-3">
                  {hand.map((card, index) => <div key={card.id} draggable={myTurn} onDragStart={event => startCardDrag(event, card)} onDragEnd={() => { draggedCard.current = null; }} className="animate-card-deal cursor-grab active:cursor-grabbing" style={{ transform: `rotate(${[-3, 1, 3, -1][index % 4]}deg)`, animationDelay: `${index * 120}ms` }}><CardFace card={card} selected={selectedCard?.id === card.id} disabled={!myTurn} onClick={myTurn ? () => selectCard(card) : undefined} /></div>)}
                  {hand.length === 0 && <p className="w-full rounded-2xl bg-[#21130d]/45 py-8 text-center text-xs font-bold text-white/65">{started && !winner ? 'En attente de la prochaine donne…' : 'Ta main apparaîtra ici.'}</p>}
                </div>
              </div>
            </div>
          </div>

          {state.chkobbaWinner ? <GameResultBanner winnerName={teamMode ? teamLabel(state.chkobbaWinnerTeam) : winner?.name} label="Chkobba finale" detail={`${teamMode ? teamLabel(state.chkobbaWinnerTeam) : winner?.name || 'Un joueur'} atteint ${teamMode ? state.chkobbaTeamScores?.[state.chkobbaWinnerTeam || ''] : state.chkobbaScores?.[state.chkobbaWinner]} points`} tone="amber" actionLabel="Rejouer la partie" onAction={() => socket.current?.send('chkobba/replay', { targetScore: state.chkobbaTargetScore || targetScore, botEnabled: Boolean(state.chkobbaBotEnabled), teamMode: Boolean(state.chkobbaTeamMode), botPartnerId: state.chkobbaBotPartnerId })} /> : state.chkobbaLastRoundScores && Object.keys(state.chkobbaLastRoundScores).length > 0 && lastRoundWinner ? (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/[.08] px-4 py-3 text-center text-xs font-bold text-emerald-100 animate-fadeIn">
              <Trophy className="mr-1 inline h-4 w-4 text-amber-300" /> Manche gagnée par {lastRoundWinner.name} · +{state.chkobbaLastRoundScores[lastRoundWinner.id] || 0} point{(state.chkobbaLastRoundScores[lastRoundWinner.id] || 0) > 1 ? 's' : ''}
            </div>
          ) : null}

          <details className="group rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black text-white"><BookOpen className="h-4 w-4 text-amber-300" /> Comment jouer ?<span className="ml-auto text-white/40 transition group-open:rotate-180">⌄</span></summary>
            <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-white/55">
              <p><strong className="text-white/80">Prendre :</strong> joue une carte de même valeur, sinon une combinaison dont la somme correspond.</p>
              <p><strong className="text-white/80">Scopa :</strong> vide complètement la mida en une prise. Le 7 de deniers vaut aussi un point.</p>
              <p><strong className="text-white/80">Score :</strong> cartes, deniers et septs majoritaires valent un point. La partie se joue à {state.chkobbaTargetScore || targetScore}.</p>
            </div>
          </details>
        </>
      )}
      <ConfirmLeaveModal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} onConfirm={leaveGame} />
    </section>
  );
};
