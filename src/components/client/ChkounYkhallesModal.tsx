import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Dices, Users, X } from 'lucide-react';
import { createGameSocket, gamePlayerId, type GameEvent } from '../../services/gameSocket';

interface Props { isOpen: boolean; onClose: () => void; tableId: string; }

export const ChkounYkhallesModal: React.FC<Props> = ({ isOpen, onClose, tableId }) => {
  const socket = useRef<ReturnType<typeof createGameSocket> | null>(null);
  const [name, setName] = useState(() => localStorage.getItem('taktak_game_name') || '');
  const [players, setPlayers] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [loser, setLoser] = useState<string | null>(null);
  const wheel = players.length ? `conic-gradient(${players.map((_, index) => `${['#f97316','#fbbf24','#fb7185','#a78bfa','#38bdf8','#34d399'][index % 6]} ${(index / players.length) * 100}% ${((index + 1) / players.length) * 100}%`).join(',')})` : 'conic-gradient(#334155 0 100%)';

  useEffect(() => {
    const handleEvent = (event: GameEvent) => {
      if (event.type === 'roulette_players') setPlayers(event.players || []);
      if (event.type === 'roulette_spin') {
        setLoser(null);
        const delay = Math.max(0, (event.startsAt || Date.now()) - Date.now());
        window.setTimeout(() => setSpinning(true), delay);
        window.setTimeout(() => {
          setSpinning(false);
          setLoser(event.loser || null);
          confetti({ particleCount: 180, spread: 100, origin: { y: 0.65 }, colors: ['#fb923c', '#facc15', '#ffffff'] });
        }, delay + 2800);
      }
    };
    socket.current = createGameSocket(tableId, handleEvent);
    return () => { socket.current?.disconnect(); socket.current = null; };
  }, [tableId]);

  const join = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem('taktak_game_name', trimmed);
    socket.current?.send('roulette/join', { playerId: gamePlayerId, name: trimmed });
  };

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
    <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-orange-400/30 bg-[#10111b] shadow-2xl">
      <div className="flex items-center justify-between p-5">
        <div><p className="text-lg font-black text-white">Chkoun ykhalles ?</p><p className="text-xs text-gray-400">Le hasard décide pour la table.</p></div>
        <button onClick={onClose} className="rounded-xl bg-white/5 p-2 text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
      </div>
      <div className="mx-5 rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/20 to-amber-400/5 p-6 text-center">
        <div className="mx-auto mb-2 text-amber-200">▼</div><div style={{ background: wheel }} className={`mx-auto mb-4 flex h-40 w-40 items-center justify-center rounded-full border-8 border-white/80 text-4xl shadow-xl shadow-orange-500/30 ${spinning ? 'animate-spin' : ''}`}>🎯</div>
        {spinning ? <p className="text-xl font-black text-amber-200 animate-pulse">La roue tourne…</p> : loser ? <p className="text-xl font-black text-white">C'est <span className="text-amber-300">{loser}</span> qui paie la note !</p> : <p className="text-sm font-semibold text-gray-300">Rejoignez puis lancez le tirage.</p>}
      </div>
      <div className="p-5 space-y-3">
        <div className="flex gap-2"><input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && join()} placeholder="Votre prénom" maxLength={32} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400" /><button onClick={join} className="rounded-xl bg-white/10 px-3 text-xs font-bold text-white">Rejoindre</button></div>
        <div className="rounded-2xl bg-white/5 p-3"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-300"><Users className="h-4 w-4" /> Lobby · {players.length} joueur{players.length !== 1 ? 's' : ''}</div><div className="flex flex-wrap gap-2">{players.length ? players.map((player,index)=><span key={`${player}-${index}`} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white">{player} {player===name.trim()?'(vous)':''}</span>) : <span className="text-xs text-gray-500">En attente des joueurs…</span>}</div></div>
        <button disabled={players.length === 0 || spinning} onClick={() => socket.current?.send('roulette/start')} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-extrabold text-white disabled:opacity-50"><Dices className="h-5 w-5" /> Lancer la roulette</button>
      </div>
    </div>
  </div>;
};
