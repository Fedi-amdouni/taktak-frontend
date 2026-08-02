import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowLeftRight, BookOpen, Check, Layers3, Play, Sparkles, Trophy, Users } from 'lucide-react';
import { createGameSocket, gamePlayerId, getStoredGameName, rememberGameName, type ChkobbaCard, type GameEvent } from '../../services/gameSocket';
import woodTableTexture from '../../assets/chkobba-wood-table.webp';
import { CardBack, CardFace } from './ChkobbaGame';

interface Props { tableId: string; onBack: () => void; }

const playerColors = ['#f8b84e', '#67e8f9', '#fb7185', '#a78bfa'];
const suitLabels: Record<ChkobbaCard['suit'], string> = { DINARI: 'carreau', KOPPA: 'cœur', SABRES: 'pique', BASTONI: 'trèfle' };
const isValidMeld = (cards: ChkobbaCard[]) => {
  if (cards.length < 3 || cards.length > 4) return false;
  const sameValue = new Set(cards.map(card => card.value)).size === 1;
  const differentSuits = new Set(cards.map(card => card.suit)).size === cards.length;
  if (sameValue && differentSuits) return true;
  const values = cards.map(card => card.value).sort((a, b) => a - b);
  return new Set(cards.map(card => card.suit)).size === 1
    && new Set(values).size === values.length
    && values[values.length - 1] - values[0] === values.length - 1;
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
  const [state, setState] = useState<GameEvent>({ type: 'rami_state' });
  const [hand, setHand] = useState<ChkobbaCard[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [organizeMode, setOrganizeMode] = useState(false);
  const [reorderSourceId, setReorderSourceId] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

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
  const selectedCards = useMemo(() => hand.filter(card => selectedIds.includes(card.id)), [hand, selectedIds]);
  const validMeld = isValidMeld(selectedCards);
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

  const swapHandCards = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      setReorderSourceId(null);
      setDragOverCardId(null);
      return;
    }
    setHand(current => {
      const sourceIndex = current.findIndex(card => card.id === sourceId);
      const targetIndex = current.findIndex(card => card.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
      return next;
    });
    setReorderSourceId(null);
    setDragOverCardId(null);
  };

  const handleHandCardClick = (card: ChkobbaCard) => {
    if (organizeMode) {
      if (reorderSourceId) swapHandCards(reorderSourceId, card.id);
      else setReorderSourceId(card.id);
      return;
    }
    if (myTurn && hasDrawn) toggleCard(card);
  };

  const lay = () => {
    if (myTurn && hasDrawn && validMeld) socket.current?.send('rami/lay', { playerId: gamePlayerId, cardIds: selectedIds });
  };

  const discard = () => {
    if (myTurn && hasDrawn && selectedIds.length === 1) socket.current?.send('rami/discard', { playerId: gamePlayerId, cardId: selectedIds[0] });
  };

  const status = state.ramiWinner
    ? `${winner?.name || 'Un joueur'} remporte la manche !`
    : !started ? 'Rejoins la table pour commencer.'
    : !myTurn ? `Tour de ${activePlayer?.name || 'un joueur'}`
    : !hasDrawn ? 'Pioche une carte pour commencer ton tour.'
    : validMeld ? 'Belle combinaison : pose-la ou choisis une carte à défausser.'
    : 'Sélectionne une combinaison valide ou une carte à défausser.';

  return (
    <section className="mx-auto max-w-md space-y-4 p-4 pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/55 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Jeux</button>
      <header className="relative overflow-hidden rounded-[28px] border border-[#d8a967]/25 bg-gradient-to-br from-[#17241f] via-[#101713] to-[#302018] p-5 shadow-2xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#d8a967]/15 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f1c777]"><Sparkles className="h-3.5 w-3.5" /> Jeu de cartes</p><h1 className="mt-1 text-3xl font-black text-white">Rami</h1><p className="mt-1 max-w-[270px] text-xs leading-relaxed text-white/55">Pioche, forme des suites ou des brelans, puis vide ta main avant les autres.</p></div>
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
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setGameMode('friends')} className={`rounded-2xl border p-3 text-left transition ${gameMode === 'friends' ? 'border-[#f1c777]/70 bg-[#f1c777]/10' : 'border-white/10 bg-white/[.035]'}`}><span className="block text-xs font-black text-white">Entre amis</span><span className="mt-1 block text-[10px] text-white/45">2 à 4 joueurs</span></button>
            <button onClick={() => setGameMode('bot')} className={`rounded-2xl border p-3 text-left transition ${gameMode === 'bot' ? 'border-[#f1c777]/70 bg-[#f1c777]/10' : 'border-white/10 bg-white/[.035]'}`}><span className="block text-xs font-black text-white">Solo contre bot</span><span className="mt-1 block text-[10px] text-white/45">Bot Rami</span></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map(index => { const player = players[index]; return <div key={index} className="rounded-2xl border border-white/10 bg-white/[.035] p-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-black/25 text-xs font-black" style={{ color: playerColors[index] }}>{player ? player.name.charAt(0).toUpperCase() : '+'}</span><span className="min-w-0 truncate text-xs font-bold text-white">{player?.name || 'Place libre'}</span></div></div>; })}
          </div>
          <div className="rounded-2xl border border-[#f1c777]/20 bg-[#f1c777]/[.06] px-4 py-3 text-xs font-bold text-[#ffe8b2]">{amIJoined ? `${players.length}/4 joueurs à la table` : 'Entre ton prénom pour prendre une place.'}</div>
          <button onClick={() => socket.current?.send('rami/start', { botEnabled: gameMode === 'bot' })} disabled={gameMode === 'bot' ? players.length < 1 : players.length < 2} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f1c777] py-3.5 font-black text-[#17201d] shadow-lg shadow-[#d59b4b]/15 transition hover:bg-[#ffe09b] disabled:cursor-not-allowed disabled:opacity-35"><Play className="h-4 w-4" /> {gameMode === 'bot' ? 'Jouer contre Bot Rami' : 'Lancer le Rami'}</button>
          <p className="text-center text-[10px] font-semibold text-white/35">2 à 4 joueurs · 10 cartes chacun · suites et brelans</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {players.map((player, index) => { const active = player.id === state.ramiTurnId; const handCount = state.ramiHandCounts?.[player.id] ?? 0; return <div key={player.id} className={`relative overflow-hidden rounded-2xl border p-3 transition ${active ? 'border-[#f1c777]/80 bg-[#f1c777]/10 shadow-[0_0_24px_rgba(251,191,36,.12)]' : 'border-white/10 bg-white/[.035]'}`}><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: playerColors[index] || playerColors[0], boxShadow: `0 0 12px ${playerColors[index] || playerColors[0]}` }} /><span className="min-w-0 flex-1 truncate text-xs font-black text-white">{player.name}{player.id === gamePlayerId ? ' · toi' : ''}</span><span className="text-sm font-black text-[#f1c777]">{handCount}</span></div><div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/40">cartes en main</div>{active && !state.ramiWinner && <span className="absolute bottom-0 left-0 h-0.5 w-full animate-pulse bg-[#f1c777]" />}</div>; })}
          </div>

          <div className="relative overflow-hidden rounded-[32px] border-[4px] border-[#6b3d25] bg-cover bg-center p-4 shadow-[0_28px_60px_rgba(12,6,2,.52)]" style={{ backgroundImage: `url(${woodTableTexture})` }}>
            <div className="pointer-events-none absolute inset-2 rounded-[24px] border border-[#f4d6a5]/25" />
            <div className="relative">
              <div className="flex items-center justify-between"><span className="rounded-full bg-[#21130d]/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-[#f7dfb4]">La table</span><span className="rounded-full bg-[#21130d]/75 px-3 py-1.5 text-[10px] font-black text-white/80">Manche {state.ramiRound || 1}</span></div>
              <div className="mt-4 grid min-h-[184px] grid-cols-[82px_1fr] items-center gap-3">
                <div className="flex flex-col items-center gap-2"><button onClick={() => draw('deck')} disabled={!myTurn || hasDrawn || !state.ramiDeckRemaining} aria-label="Piocher dans le talon" className="relative transition hover:-translate-y-1 disabled:cursor-default disabled:opacity-70"><CardBack small /><span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#21130d]/90 px-2 py-1 text-[9px] font-black text-[#f7dfb4]">{state.ramiDeckRemaining || 0}</span></button><span className="text-center text-[9px] font-black uppercase tracking-wider text-[#fff0cd]/65">Pioche</span></div>
                <div className="flex min-h-[145px] flex-wrap items-center justify-center gap-3 rounded-2xl bg-[#21130d]/20 p-2">
                  {state.ramiDiscardTop ? <CardFace card={state.ramiDiscardTop} small disabled={!myTurn || hasDrawn} onClick={() => draw('discard')} /> : <div className="grid place-items-center rounded-2xl bg-[#21130d]/45 px-5 py-5 text-center text-[#f7dfb4]"><Layers3 className="h-7 w-7" /><span className="mt-2 text-[10px] font-black uppercase tracking-widest">Défausse vide</span></div>}
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#fff0cd]/55">Défausse</span>
                </div>
              </div>
              <div role="status" aria-live="polite" className={`rounded-2xl border px-4 py-3 text-center text-sm font-black shadow-sm transition ${myTurn ? 'border-[#f1c777]/70 bg-[#24140d]/88 text-[#fff1cf]' : 'border-white/15 bg-[#24140d]/75 text-white'}`}>{status}</div>
              {state.ramiMelds && state.ramiMelds.length > 0 && <div className="mt-4 rounded-2xl bg-[#21130d]/45 p-3"><div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-[#fff0cd]/70"><Layers3 className="h-3.5 w-3.5" /> Combinaisons posées</div><div className="space-y-2">{state.ramiMelds.map((meld, index) => <div key={`${meld.type}-${index}`} className="flex items-center gap-2"><span className="w-10 text-[9px] font-black uppercase text-[#f7dfb4]/55">{meld.type === 'run' ? 'Suite' : 'Brelan'}</span><div className="flex -space-x-2">{meld.cards.map(card => <CardFace key={card.id} card={card} small disabled />)}</div></div>)}</div></div>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center justify-between gap-2"><div><p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[.18em] text-white/75"><Users className="h-3 w-3" /> Ta main</p><p className="mt-1 text-xs font-semibold text-white/45">{organizeMode ? 'Touche une carte puis une autre pour échanger.' : myTurn ? hasDrawn ? 'Sélectionne une combinaison ou une carte à jeter.' : 'Touche le talon ou la défausse.' : 'En attente de ton tour.'}</p></div><div className="flex items-center gap-2"><button onClick={() => { setOrganizeMode(current => !current); setReorderSourceId(null); }} aria-pressed={organizeMode} className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[10px] font-black transition ${organizeMode ? 'border-[#f1c777]/70 bg-[#f1c777]/15 text-[#ffe8b2]' : 'border-white/10 bg-black/15 text-white/55 hover:text-white'}`}><ArrowLeftRight className="h-3 w-3" /> {organizeMode ? 'Terminer' : 'Ranger'}</button><span className="rounded-full bg-[#f1c777]/15 px-2.5 py-1 text-[10px] font-black text-[#f1c777]">{hand.length} cartes</span></div></div><div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-3 pt-3">{hand.map((card, index) => <div key={card.id} draggable={hand.length > 1} onDragStart={event => { setDraggedCardId(card.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', card.id); }} onDragOver={event => { event.preventDefault(); if (draggedCardId !== card.id) setDragOverCardId(card.id); }} onDrop={event => { event.preventDefault(); const sourceId = draggedCardId || event.dataTransfer.getData('text/plain'); if (sourceId) swapHandCards(sourceId, card.id); setDraggedCardId(null); }} onDragEnd={() => { setDraggedCardId(null); setDragOverCardId(null); }} className={`animate-card-deal shrink-0 cursor-grab rounded-xl transition active:cursor-grabbing ${draggedCardId === card.id ? 'opacity-45' : ''} ${dragOverCardId === card.id ? 'ring-2 ring-[#f1c777] ring-offset-2 ring-offset-[#17201d]' : ''}`} style={{ transform: `rotate(${[-3, 1, 3, -1][index % 4]}deg)` }}><CardFace card={card} selected={reorderSourceId === card.id || selectedIds.includes(card.id)} disabled={!organizeMode && (!myTurn || !hasDrawn)} onClick={organizeMode || (myTurn && hasDrawn) ? () => handleHandCardClick(card) : undefined} /></div>)}</div><div className="mt-2 flex min-h-10 items-center justify-center gap-2">{validMeld && <button onClick={lay} className="inline-flex items-center gap-2 rounded-xl bg-[#f1c777] px-3 py-2 text-[11px] font-black text-[#17201d] transition hover:bg-[#ffe09b]"><Check className="h-3.5 w-3.5" /> Poser la combinaison</button>}{hasDrawn && selectedIds.length === 1 && <button onClick={discard} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-[11px] font-black text-white transition hover:bg-black/30">Jeter cette carte</button>}</div></div>

          {state.ramiWinner && <div className="animate-fadeIn rounded-3xl border border-[#f1c777]/45 bg-gradient-to-br from-[#f1c777]/20 to-emerald-400/10 p-5 text-center shadow-xl"><Trophy className="mx-auto h-8 w-8 text-[#f1c777]" /><p className="mt-2 text-xl font-black text-white">{winner?.name || 'Un joueur'} gagne !</p><p className="mt-1 text-xs font-semibold text-white/60">La manche est terminée.</p><button onClick={() => socket.current?.send('rami/replay', { botEnabled: Boolean(state.ramiBotEnabled) })} className="mt-4 rounded-xl bg-[#f1c777] px-4 py-2.5 text-xs font-black text-[#17201d]">Rejouer</button></div>}

          <details className="group rounded-2xl border border-white/10 bg-white/[.035] p-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black text-white"><BookOpen className="h-4 w-4 text-[#f1c777]" /> Comment jouer ?<span className="ml-auto text-white/40 transition group-open:rotate-180">⌄</span></summary><div className="mt-3 space-y-2 text-[11px] leading-relaxed text-white/55"><p><strong className="text-white/80">Piocher :</strong> prends la carte du talon ou la dernière carte de la défausse.</p><p><strong className="text-white/80">Poser :</strong> sélectionne 3 ou 4 cartes pour former une suite de même couleur ou un brelan de même valeur.</p><p><strong className="text-white/80">Finir le tour :</strong> après la pioche, pose une combinaison si tu en as une puis défausse une carte.</p></div></details>
        </>
      )}
    </section>
  );
};
