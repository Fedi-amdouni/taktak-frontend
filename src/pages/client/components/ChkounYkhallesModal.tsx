import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Dices, Users, X, Sparkles } from 'lucide-react';
import { createGameSocket, gamePlayerId, getStoredGameName, rememberGameName, type GameEvent } from '../../../services/gameSocket';
import { GameResultBanner } from './GameResultBanner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
}

const SLICE_COLORS = [
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#eab308', // Amber/Yellow
  '#3b82f6', // Blue
  '#ec4899', // Pink
];

export const formatPlayerName = (fullName: string): string => {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return trimmed;

  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  const firstInitial = firstName.charAt(0).toUpperCase();
  return `${lastName}.${firstInitial}`;
};

export const ChkounYkhallesModal: React.FC<Props> = ({ isOpen, onClose, tableId }) => {
  const [socket, setSocket] = useState<ReturnType<typeof createGameSocket> | null>(null);
  const [name, setName] = useState(getStoredGameName);
  const [players, setPlayers] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [loser, setLoser] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);

  const playersRef = useRef<string[]>([]);
  playersRef.current = players;
  const rotationRef = useRef<number>(0);
  rotationRef.current = rotation;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let activeSocket: ReturnType<typeof createGameSocket> | null = null;
    const handleEvent = (event: GameEvent) => {
      if (event.type === 'roulette_players') {
        setPlayers(event.players || []);
      }
      if (event.type === 'roulette_spin') {
        setLoser(null);
        const delay = Math.max(0, (event.startsAt || Date.now()) - Date.now());

        window.setTimeout(() => {
          setSpinning(true);
          const currentPlayers = playersRef.current;
          if (event.loser && currentPlayers.length > 0) {
            const count = currentPlayers.length;
            const loserIndex = currentPlayers.findIndex((p) => p === event.loser);
            if (loserIndex !== -1) {
              const sliceAngle = 360 / count;
              const sliceCenterAngle = (loserIndex + 0.5) * sliceAngle;
              const stopAngle = (360 - sliceCenterAngle) % 360;

              const currentRotation = rotationRef.current;
              const currentMod = currentRotation % 360;
              const forwardDegrees = (stopAngle - currentMod + 360) % 360;
              const totalSpin = 360 * 8 + forwardDegrees;

              const newRotation = currentRotation + totalSpin;
              setRotation(newRotation);
            }
          }
        }, delay);

        window.setTimeout(() => {
          setSpinning(false);
          setLoser(event.loser || null);
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.65 },
            colors: ['#fb923c', '#facc15', '#a855f7', '#ffffff'],
          });
        }, delay + 3200);
      }
    };

    activeSocket = createGameSocket(tableId, handleEvent, () => {
      const savedName = getStoredGameName();
      if (savedName) activeSocket?.send('roulette/join', { playerId: gamePlayerId, name: savedName });
    });
    setSocket(activeSocket);
    return () => {
      void activeSocket?.disconnect();
      setSocket(null);
    };
  }, [tableId, isOpen]);

  const join = () => {
    const savedName = rememberGameName(name);
    if (savedName) socket?.send('roulette/join', { playerId: gamePlayerId, name: savedName });
  };

  if (!isOpen) return null;

  const renderWheelSvg = () => {
    const count = players.length;
    if (count === 0) {
      return (
        <svg viewBox="0 0 300 300" className="w-full h-full">
          <circle cx="150" cy="150" r="140" fill="#1e293b" stroke="#334155" strokeWidth="6" />
          <text x="150" y="155" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="bold">
            En attente de joueurs...
          </text>
        </svg>
      );
    }

    const sliceAngle = 360 / count;

    return (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {/* Slices */}
        {players.map((player, i) => {
          const startAngle = i * sliceAngle;
          const endAngle = (i + 1) * sliceAngle;
          const midAngle = startAngle + sliceAngle / 2;

          // Subtract 90 degrees so 0 degrees starts at top (12 o'clock)
          const radStart = ((startAngle - 90) * Math.PI) / 180;
          const radEnd = ((endAngle - 90) * Math.PI) / 180;
          const radMid = ((midAngle - 90) * Math.PI) / 180;

          const cx = 150;
          const cy = 150;
          const r = 138;

          const x1 = cx + r * Math.cos(radStart);
          const y1 = cy + r * Math.sin(radStart);
          const x2 = cx + r * Math.cos(radEnd);
          const y2 = cy + r * Math.sin(radEnd);

          const largeArc = sliceAngle > 180 ? 1 : 0;
          const pathData =
            count === 1
              ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
              : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          const color = SLICE_COLORS[i % SLICE_COLORS.length];
          const formattedName = formatPlayerName(player);

          // Text position
          const textRadius = count === 1 ? 0 : r * 0.62;
          const tx = cx + textRadius * Math.cos(radMid);
          const ty = cy + textRadius * Math.sin(radMid);

          // Font size adaptation
          const fontSize = count > 8 ? 10 : count > 5 ? 11 : 12;

          return (
            <g key={`${player}-${i}`}>
              <path d={pathData} fill={color} stroke="#0d0f18" strokeWidth="3" strokeLinejoin="round" />
              {formattedName && (
                <text
                  x={tx}
                  y={ty}
                  fill="#ffffff"
                  fontSize={fontSize}
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={count > 1 ? `rotate(${midAngle}, ${tx}, ${ty})` : undefined}
                  style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.9)' }}
                >
                  {formattedName}
                </text>
              )}
            </g>
          );
        })}

        {/* Outer Golden Rim */}
        <circle cx="150" cy="150" r="138" fill="none" stroke="#f59e0b" strokeWidth="5" />

        {/* Outer Bulbs */}
        {Array.from({ length: 12 }).map((_, idx) => {
          const bulbAngle = (idx * 30 - 90) * (Math.PI / 180);
          const bx = 150 + 138 * Math.cos(bulbAngle);
          const by = 150 + 138 * Math.sin(bulbAngle);
          return <circle key={idx} cx={bx} cy={by} r="3" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" />;
        })}

        {/* Center Cap */}
        <circle cx="150" cy="150" r="28" fill="#0f172a" stroke="#f59e0b" strokeWidth="3" />
        <circle cx="150" cy="150" r="22" fill="#1e293b" />
        <text x="150" y="155" textAnchor="middle" fill="#ffffff" fontSize="16">
          🎯
        </text>
      </svg>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[32px] border border-orange-400/30 bg-[#0d0f18] shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-base font-extrabold text-white">Chkoun ykhalles ?</p>
              <p className="text-xs text-gray-400">Le hasard décide pour la table</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/5 p-2 text-gray-400 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Roulette Wheel Section */}
        <div className="mx-5 my-4 rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent p-5 text-center relative overflow-hidden">
          {/* Pointer Arrow at Top (12 o'clock) */}
          <div className="relative z-20 flex justify-center -mb-3">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]" />
          </div>

          {/* SVG Wheel Container with Rotational Transition */}
          <div className="relative mx-auto h-52 w-52 overflow-visible">
            <div
              className="h-full w-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 3.2s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none',
              }}
            >
              {renderWheelSvg()}
            </div>
          </div>

          {/* Status / Result Display */}
          <div className="mt-4">
            {spinning ? (
              <p className="animate-pulse text-lg font-black text-amber-300">La roue tourne…</p>
            ) : loser ? (
              <GameResultBanner
                winnerName={loser}
                label="Résultat du tirage"
                detail={`C'est ${loser} qui paie la note !`}
                tone="amber"
              />
            ) : (
              <p className="text-xs font-semibold text-gray-400">Rejoignez puis lancez la roulette.</p>
            )}
          </div>
        </div>

        {/* Player Join & Actions Section */}
        <div className="space-y-3 p-5 pt-0">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && join()}
              placeholder="Votre prénom"
              maxLength={32}
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-400 transition-all"
            />
            <button
              onClick={join}
              className="rounded-2xl bg-white/10 px-4 text-xs font-extrabold text-white hover:bg-white/20 transition-all"
            >
              Rejoindre
            </button>
          </div>

          {/* Lobby list */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-300">
              <Users className="h-4 w-4 text-orange-400" /> Lobby · {players.length} joueur
              {players.length !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {players.length ? (
                players.map((player, index) => (
                  <span
                    key={`${player}-${index}`}
                    className="rounded-full bg-white/10 border border-white/10 px-2.5 py-1 text-xs text-white font-medium"
                  >
                    {player} {player === name.trim() ? '(vous)' : ''}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">En attente des joueurs…</span>
              )}
            </div>
          </div>

          {/* Start Spin Button */}
          <button
            disabled={players.length === 0 || spinning}
            onClick={() => socket?.send('roulette/start')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Dices className="h-5 w-5" /> Lancer la roulette
          </button>
        </div>
      </div>
    </div>
  );
};
