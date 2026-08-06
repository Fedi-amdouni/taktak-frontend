import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Ban, Palette, Play, Plus, Repeat2 } from 'lucide-react';
import { createGameSocket, gamePlayerId, getStoredGameName, rememberGameName, type GameEvent } from '../../services/gameSocket';
import { GameResultBanner } from './GameResultBanner';
import { RoundGameTable } from './RoundGameTable';

interface Props { tableId: string; onBack: () => void; }

type UnoColor = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW' | 'WILD';

const colorClass = (card?: string) => ({
  RED: 'from-red-500 to-red-700',
  BLUE: 'from-blue-500 to-indigo-700',
  GREEN: 'from-emerald-500 to-teal-700',
  YELLOW: 'from-yellow-300 to-amber-500 text-slate-950',
  WILD: 'from-slate-700 via-slate-950 to-purple-800',
}[card?.split(':')[0] || 'WILD']);

const colorName: Record<UnoColor, string> = {
  RED: 'Rouge',
  BLUE: 'Bleu',
  GREEN: 'Vert',
  YELLOW: 'Jaune',
  WILD: 'Joker',
};

const cardValue = (card?: string) => card?.split(':')[1] || '?';
const cardColor = (card?: string) => (card?.split(':')[0] || 'WILD') as UnoColor;
const cardLabel = (card?: string) => ({ SKIP: 'PASSE', REVERSE: 'INVERSE', DRAW2: '+2', DRAW4: '+4', WILD: 'JOKER' }[cardValue(card)] || cardValue(card));

const CardSymbol: React.FC<{ value: string }> = ({ value }) => {
  if (value === 'SKIP') return <Ban aria-hidden className="h-9 w-9" />;
  if (value === 'REVERSE') return <Repeat2 aria-hidden className="h-9 w-9" />;
  if (value === 'WILD') return <Palette aria-hidden className="h-9 w-9" />;
  if (value === 'DRAW2' || value === 'DRAW4') return <span className="text-3xl font-black">{value === 'DRAW2' ? '+2' : '+4'}</span>;
  return <span className="text-5xl font-black leading-none">{value}</span>;
};

interface UnoCardFaceProps {
  card?: string;
  activeColor?: string;
}

const UnoCardFace: React.FC<UnoCardFaceProps> = ({ card, activeColor }) => {
  const baseColor = cardColor(card);
  const value = cardValue(card);
  const wild = baseColor === 'WILD';

  const effectiveColor: UnoColor =
    wild && activeColor && activeColor !== 'WILD' ? (activeColor as UnoColor) : baseColor;

  const displayLabel =
    wild && activeColor && activeColor !== 'WILD'
      ? `${cardLabel(card)} (${colorName[activeColor as UnoColor] || activeColor})`
      : cardLabel(card);

  return (
    <div
      className={`relative grid h-32 w-[84px] place-items-center overflow-hidden rounded-2xl border-4 border-white/90 bg-gradient-to-br ${colorClass(
        `${effectiveColor}:0`
      )} text-white shadow-xl transition-all duration-300`}
    >
      <span className="absolute left-1.5 top-1 z-10 text-[9px] font-black tracking-tight leading-none max-w-[72px] truncate">
        {displayLabel}
      </span>
      <div
        className={`grid h-20 w-14 -rotate-12 place-items-center rounded-[50%] ${
          wild ? 'bg-slate-950 text-white ring-2 ring-amber-300' : 'bg-white/95 text-slate-900'
        } shadow-inner`}
      >
        <CardSymbol value={value} />
      </div>
      <span className="absolute bottom-1 right-1.5 z-10 rotate-180 text-[9px] font-black tracking-tight leading-none max-w-[72px] truncate">
        {displayLabel}
      </span>
    </div>
  );
};

export const UnoGame: React.FC<Props> = ({ tableId, onBack }) => {
  const socket = useRef<ReturnType<typeof createGameSocket> | null>(null);
  const [name, setName] = useState(getStoredGameName);
  const [state, setState] = useState<GameEvent>({ type: 'uno_state' });
  const [hand, setHand] = useState<string[]>([]);
  const [wild, setWild] = useState<string | null>(null);

  useEffect(() => {
    socket.current = createGameSocket(
      tableId,
      event => {
        if (event.type === 'uno_state') setState(event);
        if (event.type === 'uno_hand') setHand(event.unoHand || []);
      },
      () => {
        const savedName = getStoredGameName();
        if (savedName) socket.current?.send('uno/join', { playerId: gamePlayerId, name: savedName });
      },
      `/topic/table/${tableId}/game/uno/hand/${gamePlayerId}`,
    );

    return () => { void socket.current?.disconnect(); };
  }, [tableId]);

  const join = () => {
    const savedName = rememberGameName(name);
    if (savedName) socket.current?.send('uno/join', { playerId: gamePlayerId, name: savedName });
  };

  const players = state.unoPlayers || [];
  const myTurn = state.unoTurnId === gamePlayerId;
  const winner = players.find(player => player.id === state.unoWinner)?.name;
  const activeColor = state.unoActiveColor || (state.unoTopCard ? cardColor(state.unoTopCard) : undefined);
  const play = (card: string, color?: string) => socket.current?.send('uno/play', { playerId: gamePlayerId, card, color });

  const isCardPlayable = (card: string) => {
    if (!myTurn) return false;
    if (card.startsWith('WILD:')) return true;
    const cColor = cardColor(card);
    const cVal = cardValue(card);
    const topVal = cardValue(state.unoTopCard);

    if (activeColor && cColor === activeColor) return true;
    if (topVal && cVal === topVal) return true;
    return false;
  };

  const leaveGame = () => {
    socket.current?.send('uno/leave', { playerId: gamePlayerId });
    onBack();
  };

  return <section className="mx-auto max-w-md space-y-3 p-4 pb-24">
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-gray-300"><ArrowLeft className="h-4 w-4" /> Divertissement</button>
      <button onClick={leaveGame} className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all">🚪 Quitter la table</button>
    </div>
    <div className="rounded-[30px] border border-white/10 bg-[#10131d] p-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-black tracking-tight text-white">UNO <span className="text-yellow-300">TABLE</span></h2><p className="text-xs text-gray-400">{players.length}/4 joueurs</p></div>
        {!state.unoStarted && <button onClick={join} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white">Rejoindre</button>}
      </div>

      {!state.unoStarted ? <div className="mt-4 space-y-3">
        <input value={name} onChange={event => setName(event.target.value)} placeholder="Votre prénom" className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none" />
        <RoundGameTable players={players}><span className="text-4xl font-black text-white">UNO</span></RoundGameTable>
        <button onClick={() => socket.current?.send('uno/start')} disabled={players.length < 2} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 py-3 font-black text-white disabled:opacity-40"><Play className="h-4 w-4" /> Démarrer</button>
      </div> : <div className="mt-4 space-y-4">
        <RoundGameTable players={players} turnId={state.unoTurnId} counts={state.unoHandCounts}>
          <div className="flex items-center gap-4">
            <button disabled={!myTurn || !!winner} onClick={() => socket.current?.send('uno/draw', { playerId: gamePlayerId })} className="grid h-24 w-16 place-items-center rounded-xl border-2 border-white/30 bg-slate-900 text-[10px] font-black text-white shadow-xl disabled:opacity-50">PIOCHE<Plus className="h-4 w-4" /></button>
            <div className="rotate-3"><UnoCardFace card={state.unoTopCard} activeColor={activeColor} /></div>
          </div>
        </RoundGameTable>

        {activeColor && (
          <div
            aria-live="polite"
            className={`flex items-center justify-between rounded-2xl border-2 border-white/30 bg-gradient-to-r ${colorClass(
              `${activeColor}:0`
            )} px-4 py-3 shadow-xl animate-pulse`}
          >
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white drop-shadow">
              Couleur active à jouer
            </span>
            <span className="rounded-full bg-black/40 border border-white/20 px-3.5 py-1 text-sm font-black text-white shadow-md">
              {colorName[activeColor as UnoColor] || activeColor}
            </span>
          </div>
        )}

        {winner ? <GameResultBanner winnerName={winner} tone="rainbow" actionLabel="Rejouer la partie" onAction={() => socket.current?.send('uno/start')} /> : <>
          <p className="text-center text-xs font-black text-yellow-300">{myTurn ? 'À vous de jouer' : 'En attente du joueur actif'}</p>
          <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-3 pt-2">
            {hand.map((card, index) => {
              const playable = isCardPlayable(card);
              return (
                <button
                  key={`${card}-${index}`}
                  aria-label={`Jouer ${cardLabel(card)}`}
                  disabled={!myTurn || !playable}
                  onClick={() => (card.startsWith('WILD:') ? setWild(card) : play(card))}
                  className={`shrink-0 rounded-2xl transition duration-200 ${
                    playable
                      ? 'hover:-translate-y-3 focus:outline-none focus:ring-2 focus:ring-yellow-300 cursor-pointer shadow-lg'
                      : 'opacity-40 cursor-not-allowed grayscale-[40%]'
                  }`}
                >
                  <UnoCardFace card={card} />
                </button>
              );
            })}
          </div>
        </>}
      </div>}
    </div>

    {wild && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-6"><div className="w-full max-w-xs rounded-3xl bg-[#151923] p-5 text-center"><p className="font-black text-white">Choisis une couleur</p><div className="mt-4 grid grid-cols-2 gap-3">{['RED', 'BLUE', 'GREEN', 'YELLOW'].map(color => <button key={color} onClick={() => { play(wild, color); setWild(null); }} className={`rounded-2xl bg-gradient-to-br ${colorClass(`${color}:0`)} py-5 font-black text-white`}>{color}</button>)}</div></div></div>}
  </section>;
};

