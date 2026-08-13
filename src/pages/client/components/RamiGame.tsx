import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, BookOpen, Check, GripVertical, Layers3, Play, Sparkles, Trophy, Users } from 'lucide-react';
import { createGameSocket, gamePlayerId, getStoredGameName, rememberGameName, type ChkobbaCard, type GameEvent } from '../../../services/gameSocket';
import woodTableTexture from '../../../assets/chkobba-wood-table.webp';
import { CardBack, CardFace } from './ChkobbaGame';
import { ConfirmLeaveModal } from './ConfirmLeaveModal';

interface Props { tableId: string; onBack: () => void; }

const playerColors = ['#f8b84e', '#67e8f9', '#fb7185', '#a78bfa'];
const suitLabels: Record<ChkobbaCard['suit'], string> = { DINARI: 'carreau', KOPPA: 'cœur', SABRES: 'pique', BASTONI: 'trèfle', JOKER: 'joker' };

const rankIndex = (rank: string, highAce: boolean) => {
  if (rank === 'A') return highAce ? 14 : 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return Number(rank) || 0;
};

const isJoker = (card: ChkobbaCard) => card.rank === 'JKR';
const scoreForRank = (rank: string, highAce: boolean) => rank === 'A' ? (highAce ? 11 : 1) : ['10', 'J', 'Q', 'K'].includes(rank) ? 10 : Number(rank);
const rankForIndex = (index: number) => index === 1 || index === 14 ? 'A' : index <= 10 ? String(index) : index === 11 ? 'J' : index === 12 ? 'Q' : 'K';

const runScore = (cards: ChkobbaCard[], highAce: boolean) => {
  const naturals = cards.filter(card => !isJoker(card));
  const jokers = cards.length - naturals.length;
  if (!naturals.length || jokers > naturals.length || !naturals.every(card => card.suit === naturals[0].suit)) return 0;
  const ranks = naturals.map(card => rankIndex(card.rank, highAce)).sort((a, b) => a - b);
  if (new Set(ranks).size !== ranks.length || ranks.includes(0)) return 0;
  for (let start = 1; start <= 15 - cards.length; start += 1) {
    const interval = Array.from({ length: cards.length }, (_, index) => start + index);
    if (!ranks.every(rank => interval.includes(rank)) || interval.filter(rank => !ranks.includes(rank)).length !== jokers) continue;
    return interval.reduce((score, rank) => score + scoreForRank(rankForIndex(rank), highAce), 0);
  }
  return 0;
};

const calculateMeldScore = (cards: ChkobbaCard[]) => {
  if (cards.length < 3 || cards.length > 13) return 0;
  const naturals = cards.filter(card => !isJoker(card));
  const jokers = cards.length - naturals.length;
  if (!naturals.length) return 0;
  // Allow jokers up to the number of natural cards (wildcards), but ensure at least one natural card exists
  if (jokers > naturals.length) return 0;
  const sameRank = naturals.every(card => card.rank === naturals[0].rank);
  const distinctSuits = new Set(naturals.map(card => card.suit)).size === naturals.length;
  if (cards.length <= 4 && sameRank && distinctSuits && jokers <= 4 - naturals.length) return scoreForRank(naturals[0].rank, true) * cards.length;
  return runScore(cards, false) || runScore(cards, true);
};

const isValidMeld = (cards: ChkobbaCard[]) => calculateMeldScore(cards) > 0;

const splitIntoMelds = (cards: ChkobbaCard[]): ChkobbaCard[][] | null => {
  if (cards.length < 3) return null;
  const visit = (remaining: ChkobbaCard[], resolved: ChkobbaCard[][]): ChkobbaCard[][] | null => {
    if (!remaining.length) return resolved;
    if (remaining.length < 3) return null;
    for (let mask = 1; mask < (1 << remaining.length); mask += 1) {
      if (mask.toString(2).split('1').length - 1 < 3) continue;
      const meld = remaining.filter((_, index) => Boolean(mask & (1 << index)));
      if (!isValidMeld(meld)) continue;
      const result = visit(remaining.filter((_, index) => !(mask & (1 << index))), [...resolved, meld]);
      if (result) return result;
    }
    return null;
  };
  return visit(cards, []);
};

const sortCards = (cards: ChkobbaCard[]) => [...cards].sort((a, b) => a.value - b.value || a.suit.localeCompare(b.suit));
const preserveHandOrder = (previous: ChkobbaCard[], incoming: ChkobbaCard[]) => {
  const incomingById = new Map(incoming.map(card => [card.id, card]));
  const kept = previous.map(card => incomingById.get(card.id)).filter((card): card is ChkobbaCard => Boolean(card));
  const keptIds = new Set(kept.map(card => card.id));
  return [...kept, ...sortCards(incoming.filter(card => !keptIds.has(card.id)))];
};

export const RamiGame: React.FC<Props> = ({ tableId, onBack }) => {
  const socket = useRef<ReturnType<typeof createGameSocket> | null>(null);
  const [name, setName] = useState(getStoredGameName);
  const [gameMode, setGameMode] = useState<'friends' | 'bot'>('friends');
  const [minMeldScoreOption, setMinMeldScoreOption] = useState<number>(74);
  const [state, setState] = useState<GameEvent>({ type: 'rami_state' });
  const [hand, setHand] = useState<ChkobbaCard[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const pointerDragRef = useRef<{ pointerId: number; sourceId: string; startX: number; startY: number; moved: boolean; targetId?: string } | null>(null);
  const suppressCardClickRef = useRef(false);

  useEffect(() => {
    socket.current = createGameSocket(
      tableId,
      event => {
        if (event.type === 'rami_state') {
          setState(event);
          setSelectedIds([]);
        }
        if (event.type === 'rami_hand') setHand(current => preserveHandOrder(current, event.ramiHand || []));
      },
      () => {
        const savedName = getStoredGameName();
        if (savedName) socket.current?.send('rami/join', { playerId: gamePlayerId, name: savedName });
      },
      `/topic/table/${tableId}/game/rami/hand/${gamePlayerId}`,
    );
    return () => { void socket.current?.disconnect(); };
  }, [tableId]);

  const players = state.ramiPlayers || [];
  const started = Boolean(state.ramiStarted);
  const myTurn = state.ramiTurnId === gamePlayerId && !state.ramiWinner;
  const hasDrawn = Boolean(state.ramiHasDrawn);
  const minMeldScore = state.ramiMinMeldScore || 74;
  const hasLaidBefore = Boolean(state.ramiPlayerHasLaid?.[gamePlayerId]);
  const selectedCards = useMemo(() => hand.filter(card => selectedIds.includes(card.id)), [hand, selectedIds]);
  const selectedMelds = useMemo(() => splitIntoMelds(selectedCards), [selectedCards]);
  const validMeld = Boolean(selectedMelds);
  const selectedMeldScore = useMemo(() => selectedMelds?.reduce((score, meld) => score + calculateMeldScore(meld), 0) || 0, [selectedMelds]);

  const canLayMeld = validMeld && (hasLaidBefore || selectedMeldScore >= minMeldScore);

  const winner = players.find(player => player.id === state.ramiWinner);
  const activePlayer = players.find(player => player.id === state.ramiTurnId);
  const amIJoined = players.some(player => player.id === gamePlayerId);

  const join = () => {
    const savedName = rememberGameName(name);
    if (savedName) socket.current?.send('rami/join', { playerId: gamePlayerId, name: savedName });
  };

  const draw = (source: 'deck' | 'discard') => {
    if (myTurn && !hasDrawn) socket.current?.send('rami/draw', { playerId: gamePlayerId, source });
  };

  const toggleCard = (card: ChkobbaCard) => {
    if (!myTurn || !hasDrawn) return;
    setSelectedIds(current => current.includes(card.id) ? current.filter(id => id !== card.id) : [...current, card.id]);
  };

  const moveHandCard = (sourceId: string, targetId?: string) => {
    if (sourceId === targetId) {
      setDragOverCardId(null);
      return;
    }
    setHand(current => {
      const sourceIndex = current.findIndex(card => card.id === sourceId);
      if (sourceIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      const targetIndex = targetId ? next.findIndex(card => card.id === targetId) : next.length;
      next.splice(targetIndex < 0 ? next.length : targetIndex, 0, moved);
      return next;
    });
    setDragOverCardId(null);
  };

  const startTouchCardDrag = (event: React.PointerEvent<HTMLDivElement>, sourceId: string) => {
    if (event.pointerType === 'mouse' || hand.length <= 1) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerDragRef.current = {
      pointerId: event.pointerId,
      sourceId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    suppressCardClickRef.current = false;
  };

  const moveTouchCardDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();

    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 5) {
      drag.moved = true;
      suppressCardClickRef.current = true;
      setDraggedCardId(drag.sourceId);
    }
    if (!drag.moved) return;

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-rami-card-id]');
    const targetId = target?.dataset.ramiCardId;
    drag.targetId = targetId && targetId !== drag.sourceId ? targetId : undefined;
    setDragOverCardId(drag.targetId || null);
  };

  const finishTouchCardDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    if (drag.moved) moveHandCard(drag.sourceId, drag.targetId);
    pointerDragRef.current = null;
    setDraggedCardId(null);
    setDragOverCardId(null);
    if (drag.moved) window.setTimeout(() => { suppressCardClickRef.current = false; }, 0);
  };

  const cancelTouchCardDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    pointerDragRef.current = null;
    suppressCardClickRef.current = false;
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const lay = () => {
    if (myTurn && hasDrawn && canLayMeld) socket.current?.send('rami/lay', { playerId: gamePlayerId, cardIds: selectedIds });
  };

  const discard = () => {
    if (myTurn && hasDrawn && selectedIds.length === 1 && !isJoker(selectedCards[0])) {
      socket.current?.send('rami/discard', { playerId: gamePlayerId, cardId: selectedIds[0] });
    }
  };

  const replaceJoker = (meldIndex: number, jokerId: string) => {
    if (myTurn && hasDrawn && hasLaidBefore && selectedIds.length === 1) socket.current?.send('rami/replace-joker', { playerId: gamePlayerId, meldIndex, jokerId, replacementCardId: selectedIds[0] });
  };

  const extendMeld = (meldIndex: number) => {
    if (myTurn && hasDrawn && hasLaidBefore && selectedIds.length > 0) socket.current?.send('rami/extend-meld', { playerId: gamePlayerId, meldIndex, cardIds: selectedIds });
  };

  const status = state.ramiWinner
    ? `${winner?.name || 'Un joueur'} remporte la manche !`
    : !started ? 'Rejoins la table pour commencer.'
    : !myTurn ? `Tour de ${activePlayer?.name || 'un joueur'}`
    : !hasDrawn ? 'Pioche une carte pour commencer ton tour.'
    : validMeld && !canLayMeld ? `Combinaisons valides (${selectedMeldScore} pts), mais minimum ${minMeldScore} pts requis pour la 1ère pose !`
    : validMeld ? `${selectedMelds?.length || 1} combinaison${(selectedMelds?.length || 1) > 1 ? 's' : ''} valide${(selectedMelds?.length || 1) > 1 ? 's' : ''} (${selectedMeldScore} pts) : pose-les ou défausse une carte.`
    : 'Sélectionne une combinaison valide ou une carte à défausser.';

  const leaveGame = () => {
    socket.current?.send('rami/leave', { playerId: gamePlayerId });
    onBack();
  };

  return (
    <section className="mx-auto max-w-md space-y-4 p-4 pb-24">
      <style>{`
        @keyframes dealCardAnim {
          0% {
            transform: translateY(-130px) scale(0.3) rotate(-20deg);
            opacity: 0;
          }
          60% {
            transform: translateY(8px) scale(1.05) rotate(4deg);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1) rotate(var(--card-rot, 0deg));
            opacity: 1;
          }
        }
        .animate-deal-card {
          animation: dealCardAnim 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
        }
      `}</style>

      <div className="flex items-center justify-between">
        <button onClick={() => { if (started || amIJoined) setShowLeaveModal(true); else onBack(); }} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/55 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Jeux</button>
        <button onClick={() => setShowLeaveModal(true)} className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all">🚪 Quitter la table</button>
      </div>
      <header className="relative overflow-hidden rounded-[28px] border border-[#d8a967]/25 bg-gradient-to-br from-[#17241f] via-[#101713] to-[#302018] p-5 shadow-2xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#d8a967]/15 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f1c777]"><Sparkles className="h-3.5 w-3.5" /> Jeu de cartes</p><h1 className="mt-1 text-3xl font-black text-white">Rami</h1><p className="mt-1 max-w-[270px] text-xs leading-relaxed text-white/55">Pioche, forme des suites ou des brelans (min. {started ? minMeldScore : minMeldScoreOption} pts) et vide tes 14 cartes.</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-2.5 text-[#f1c777]"><Layers3 className="h-7 w-7" /></div>
        </div>
      </header>

      {!started ? (
        <div className="space-y-3 animate-fadeIn">
          <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
            <label className="text-[10px] font-black uppercase tracking-[.18em] text-white/45" htmlFor="rami-name">Ton prénom</label>
            <div className="mt-2 flex gap-2">
              <input id="rami-name" value={name} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') join(); }} placeholder="Ex. Amine" maxLength={32} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#f1c777]/70" />
              <button onClick={join} disabled={!name.trim()} className="rounded-2xl bg-[#f1c777] px-4 text-xs font-black text-[#17201d] transition hover:bg-[#ffe09b] disabled:opacity-35">Rejoindre</button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4 space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-[.18em] text-white/45">Score minimum pour la 1ère pose</span>
            <div className="grid grid-cols-4 gap-2">
              {[30, 51, 74, 100].map(score => (
                <button
                  key={score}
                  onClick={() => setMinMeldScoreOption(score)}
                  className={`py-2 rounded-xl text-xs font-black transition border ${minMeldScoreOption === score ? 'border-[#f1c777] bg-[#f1c777]/20 text-[#f1c777]' : 'border-white/10 bg-black/20 text-white/60 hover:text-white'}`}
                >
                  {score} pts
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setGameMode('friends')} className={`rounded-2xl border p-3 text-left transition ${gameMode === 'friends' ? 'border-[#f1c777]/70 bg-[#f1c777]/10' : 'border-white/10 bg-white/[.035]'}`}><span className="block text-xs font-black text-white">Entre amis</span><span className="mt-1 block text-[10px] text-white/45">2 à 4 joueurs</span></button>
            <button onClick={() => setGameMode('bot')} className={`rounded-2xl border p-3 text-left transition ${gameMode === 'bot' ? 'border-[#f1c777]/70 bg-[#f1c777]/10' : 'border-white/10 bg-white/[.035]'}`}><span className="block text-xs font-black text-white">Solo contre bot</span><span className="mt-1 block text-[10px] text-white/45">Bot Rami</span></button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map(index => { const player = players[index]; return <div key={index} className="rounded-2xl border border-white/10 bg-white/[.035] p-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-black/25 text-xs font-black" style={{ color: playerColors[index] }}>{player ? player.name.charAt(0).toUpperCase() : '+'}</span><span className="min-w-0 truncate text-xs font-bold text-white">{player?.name || 'Place libre'}</span></div></div>; })}
          </div>
          <div className="rounded-2xl border border-[#f1c777]/20 bg-[#f1c777]/[.06] px-4 py-3 text-xs font-bold text-[#ffe8b2]">{amIJoined ? `${players.length}/4 joueurs à la table` : 'Entre ton prénom pour prendre une place.'}</div>
          <button onClick={() => socket.current?.send('rami/start', { botEnabled: gameMode === 'bot', minMeldScore: minMeldScoreOption })} disabled={gameMode === 'bot' ? players.length < 1 : players.length < 2} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f1c777] py-3.5 font-black text-[#17201d] shadow-lg shadow-[#d59b4b]/15 transition hover:bg-[#ffe09b] disabled:cursor-not-allowed disabled:opacity-35"><Play className="h-4 w-4" /> {gameMode === 'bot' ? 'Jouer contre Bot Rami' : 'Lancer le Rami'}</button>
          <p className="text-center text-[10px] font-semibold text-white/35">2 à 4 joueurs · 14 cartes par joueur · Seuil initial : {minMeldScoreOption} pts</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {players.map((player, index) => {
              const active = player.id === state.ramiTurnId;
              const handCount = state.ramiHandCounts?.[player.id] ?? 0;
              const playerHasPosed = Boolean(state.ramiPlayerHasLaid?.[player.id]);
              return (
                <div key={player.id} className={`relative overflow-hidden rounded-2xl border p-3 transition ${active ? 'border-[#f1c777]/80 bg-[#f1c777]/10 shadow-[0_0_24px_rgba(251,191,36,.12)]' : 'border-white/10 bg-white/[.035]'}`}>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: playerColors[index] || playerColors[0], boxShadow: `0 0 12px ${playerColors[index] || playerColors[0]}` }} />
                    <span className="min-w-0 flex-1 truncate text-xs font-black text-white">{player.name}{player.id === gamePlayerId ? ' · toi' : ''}</span>
                    <span className="text-sm font-black text-[#f1c777]">{handCount}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
                    <span>cartes en main</span>
                    {playerHasPosed ? (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-0.5"><Check className="h-3 w-3" /> Posé</span>
                    ) : (
                      <span className="text-amber-400/80 font-normal">{minMeldScore} pts requ.</span>
                    )}
                  </div>
                  {state.ramiWinner && <div className="mt-1 text-[9px] font-bold text-rose-200/80">Pénalité manche : {state.ramiScores?.[player.id] || 0} pts</div>}
                  {active && !state.ramiWinner && <span className="absolute bottom-0 left-0 h-0.5 w-full animate-pulse bg-[#f1c777]" />}
                </div>
              );
            })}
          </div>

          <div className="relative overflow-hidden rounded-[32px] border-[4px] border-[#6b3d25] bg-cover bg-center p-4 shadow-[0_28px_60px_rgba(12,6,2,.52)]" style={{ backgroundImage: `url(${woodTableTexture})` }}>
            <div className="pointer-events-none absolute inset-2 rounded-[24px] border border-[#f4d6a5]/25" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#21130d]/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-[#f7dfb4]">La table</span>
                <span className="rounded-full bg-[#21130d]/75 px-3 py-1.5 text-[10px] font-black text-amber-300 border border-amber-400/20">Seuil : {minMeldScore} pts</span>
              </div>
              <div className="mt-4 grid min-h-[184px] grid-cols-[82px_1fr] items-center gap-3">
                <div className="flex flex-col items-center gap-2"><button onClick={() => draw('deck')} disabled={!myTurn || hasDrawn || !state.ramiDeckRemaining} aria-label="Piocher dans le talon" className="relative transition hover:-translate-y-1 disabled:cursor-default disabled:opacity-70"><CardBack small /><span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#21130d]/90 px-2 py-1 text-[9px] font-black text-[#f7dfb4]">{state.ramiDeckRemaining || 0}</span></button><span className="text-center text-[9px] font-black uppercase tracking-wider text-[#fff0cd]/65">Pioche</span></div>
                <div className="flex min-h-[145px] flex-wrap items-center justify-center gap-3 rounded-2xl bg-[#21130d]/20 p-2">
                  {state.ramiDiscardTop ? <CardFace card={state.ramiDiscardTop} small disabled={!myTurn || hasDrawn} onClick={() => draw('discard')} /> : <div className="grid place-items-center rounded-2xl bg-[#21130d]/45 px-5 py-5 text-center text-[#f7dfb4]"><Layers3 className="h-7 w-7" /><span className="mt-2 text-[10px] font-black uppercase tracking-widest">Défausse vide</span></div>}
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#fff0cd]/55">Défausse</span>
                </div>
              </div>
              <div role="status" aria-live="polite" className={`rounded-2xl border px-4 py-3 text-center text-sm font-black shadow-sm transition ${myTurn ? 'border-[#f1c777]/70 bg-[#24140d]/88 text-[#fff1cf]' : 'border-white/15 bg-[#24140d]/75 text-white'}`}>{status}</div>
              {state.ramiMelds && state.ramiMelds.length > 0 && <div className="mt-4 rounded-2xl bg-[#21130d]/45 p-3"><div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-[#fff0cd]/70"><Layers3 className="h-3.5 w-3.5" /> Combinaisons posées</div><p className="mb-2 text-[10px] text-[#fff0cd]/55">Après ton ouverture, sélectionne la carte exacte puis touche un Joker pour le récupérer, ou ajoute tes cartes à une combinaison.</p><div className="space-y-2">{state.ramiMelds.map((meld, index) => <div key={`${meld.type}-${index}`} className="flex items-center gap-2"><span className="w-10 text-[9px] font-black uppercase text-[#f7dfb4]/55">{meld.type === 'run' ? 'Suite' : 'Brelan'}</span><div className="flex -space-x-2">{meld.cards.map(card => { const recoverable = card.rank === 'JKR' && myTurn && hasDrawn && hasLaidBefore && selectedIds.length === 1; return <CardFace key={card.id} card={card} small disabled={!recoverable} onClick={recoverable ? () => replaceJoker(index, card.id) : undefined} />; })}</div><button disabled={!myTurn || !hasDrawn || !hasLaidBefore || selectedIds.length === 0} onClick={() => extendMeld(index)} className="rounded-lg border border-[#f1c777]/30 bg-[#f1c777]/10 px-2 py-1 text-[9px] font-black text-[#ffe8b2] disabled:opacity-35">Ajouter</button></div>)}</div></div>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[.18em] text-white/75"><Users className="h-3 w-3" /> Ta main (14 cartes)</p>
                <p className="mt-1 text-xs font-semibold text-white/45">Glisse une carte pour l’insérer à la place voulue. {myTurn ? hasDrawn ? 'Touche-la aussi pour la sélectionner.' : 'Touche le talon ou la défausse.' : 'Tu peux tout de même ranger ta main.'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/15 px-2.5 py-1.5 text-[10px] font-black text-white/55"><GripVertical className="h-3 w-3" /> Glisser</span>
                <span className="rounded-full bg-[#f1c777]/15 px-2.5 py-1 text-[10px] font-black text-[#f1c777]">{hand.length} cartes</span>
              </div>
            </div>

            <div className="relative mx-auto mt-5 h-[176px] max-w-[348px] touch-pan-y" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const sourceId = draggedCardId || event.dataTransfer.getData('text/plain'); if (sourceId) moveHandCard(sourceId); setDraggedCardId(null); }}>
              {hand.map((card, index) => (
                <div
                  key={card.id}
                  data-rami-card-id={card.id}
                  draggable={hand.length > 1}
                  onPointerDown={event => startTouchCardDrag(event, card.id)}
                  onPointerMove={moveTouchCardDrag}
                  onPointerUp={finishTouchCardDrag}
                  onPointerCancel={cancelTouchCardDrag}
                  onContextMenu={event => event.preventDefault()}
                  onDragStart={event => { setDraggedCardId(card.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', card.id); }}
                  onDragOver={event => { event.preventDefault(); event.stopPropagation(); if (draggedCardId !== card.id) setDragOverCardId(card.id); }}
                  onDrop={event => { event.preventDefault(); event.stopPropagation(); const sourceId = draggedCardId || event.dataTransfer.getData('text/plain'); if (sourceId) moveHandCard(sourceId, card.id); setDraggedCardId(null); }}
                  onDragEnd={() => { setDraggedCardId(null); setDragOverCardId(null); }}
                  className={`absolute bottom-0 left-1/2 touch-none select-none cursor-grab rounded-xl transition duration-200 active:cursor-grabbing animate-card-deal ${draggedCardId === card.id ? 'opacity-45' : ''} ${dragOverCardId === card.id ? 'z-30 -translate-y-5 ring-2 ring-[#f1c777] ring-offset-2 ring-offset-[#17201d]' : ''}`}
                  style={{
                    zIndex: draggedCardId === card.id ? 40 : index + 1,
                    animationDelay: `${index * 80}ms`,
                    transform: `translateX(calc(-50% + ${(index - (hand.length - 1) / 2) * Math.max(16, Math.min(30, 248 / Math.max(1, hand.length - 1)))}px)) translateY(${Math.abs(index - (hand.length - 1) / 2) * 1.05}px) rotate(${(index - (hand.length - 1) / 2) * Math.max(-3.1, Math.min(3.1, 29 / Math.max(1, hand.length - 1)))}deg)`,
                  } as React.CSSProperties}
                >
                  <CardFace card={card} selected={selectedIds.includes(card.id)} disabled={!myTurn || !hasDrawn} onClick={myTurn && hasDrawn ? () => {
                    if (suppressCardClickRef.current) {
                      suppressCardClickRef.current = false;
                      return;
                    }
                    toggleCard(card);
                  } : undefined} />
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-col items-center justify-center gap-2">
              {validMeld && (
                !hasDrawn ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-bold text-sky-200">
                    <AlertCircle className="h-4 w-4" /> Pioche une carte avant de poser tes combinaisons.
                  </div>
                ) : canLayMeld ? (
                  <button onClick={lay} className="inline-flex items-center gap-2 rounded-xl bg-[#f1c777] px-4 py-2.5 text-xs font-black text-[#17201d] shadow-lg shadow-amber-400/20 transition hover:bg-[#ffe09b]">
                    <Check className="h-4 w-4" /> Poser {selectedMelds && selectedMelds.length > 1 ? `${selectedMelds.length} combinaisons` : 'la combinaison'} ({selectedMeldScore} pts)
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300">
                    <AlertCircle className="h-4 w-4" /> Score : {selectedMeldScore} / {minMeldScore} pts requis pour poser
                  </div>
                )
              )}
              {hasDrawn && selectedIds.length === 1 && !isJoker(selectedCards[0]) && (
                <button onClick={discard} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-[11px] font-black text-white transition hover:bg-black/30">
                  Jeter cette carte
                </button>
              )}
            </div>
          </div>

          {state.ramiWinner && <div className="animate-fadeIn rounded-3xl border border-[#f1c777]/45 bg-gradient-to-br from-[#f1c777]/20 to-emerald-400/10 p-5 text-center shadow-xl"><Trophy className="mx-auto h-8 w-8 text-[#f1c777]" /><p className="mt-2 text-xl font-black text-white">{winner?.name || 'Un joueur'} gagne !</p><p className="mt-1 text-xs font-semibold text-white/60">La manche est terminée.</p><button onClick={() => socket.current?.send('rami/replay', { botEnabled: Boolean(state.ramiBotEnabled), minMeldScore: minMeldScoreOption })} className="mt-4 rounded-xl bg-[#f1c777] px-4 py-2.5 text-xs font-black text-[#17201d]">Rejouer</button></div>}

          <details className="group rounded-2xl border border-white/10 bg-white/[.035] p-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black text-white"><BookOpen className="h-4 w-4 text-[#f1c777]" /> Réglement du Rami (14 cartes)<span className="ml-auto text-white/40 transition group-open:rotate-180">⌄</span></summary><div className="mt-3 space-y-2 text-[11px] leading-relaxed text-white/55"><p><strong className="text-white/80">Main de départ :</strong> 14 cartes distribuées au début de la manche.</p><p><strong className="text-white/80">Première pose :</strong> exige un total d'au moins {minMeldScore} points pour être autorisée.</p><p><strong className="text-white/80">Piocher & Jeter :</strong> pioche une carte au talon ou défausse, pose si possible, puis défausse 1 carte pour finir ton tour.</p></div></details>
        </>
      )}
      <ConfirmLeaveModal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} onConfirm={leaveGame} />
    </section>
  );
};
