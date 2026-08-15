import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Dices,
  Users,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Plus,
  Crown,
  Coffee,
  Wine,
  Cake,
  Music,
  Flame,
  UserPlus
} from 'lucide-react';
import {
  createGameSocket,
  gamePlayerId,
  getStoredGameName,
  rememberGameName,
  type GameEvent,
} from '../../../services/gameSocket';
import { rouletteAudio } from '../../../utils/rouletteAudio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
}

interface StakeMode {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  stakeTitle: string;
  desc: string;
}

const STAKE_MODES: StakeMode[] = [
  { id: 'addition', label: 'Addition', icon: Coffee, stakeTitle: "L'addition complète", desc: 'Le perdant paie toute la note de la table !' },
  { id: 'tournee', label: 'Tournée', icon: Wine, stakeTitle: 'La prochaine tournée', desc: 'Le perdant régale toute la table en boissons !' },
  { id: 'dessert', label: 'Dessert/Chicha', icon: Cake, stakeTitle: 'Le dessert ou la chicha', desc: 'Gourmandise ou chicha offerte par le perdant !' },
  { id: 'dj', label: 'DJ de la Table', icon: Music, stakeTitle: 'Le choix de la musique', desc: 'Le vainqueur choisit la prochaine ambiance !' },
  { id: 'gage', label: 'Gage Café', icon: Flame, stakeTitle: 'Le défi de la table', desc: 'Un gage ou une vérité pour le perdant !' },
];

const SLICE_COLORS = [
  { fill: '#f97316', text: '#ffffff' }, // Vibrant Orange
  { fill: '#0284c7', text: '#ffffff' }, // Vibrant Sky Blue
  { fill: '#9333ea', text: '#ffffff' }, // Purple
  { fill: '#059669', text: '#ffffff' }, // Emerald
  { fill: '#e11d48', text: '#ffffff' }, // Rose
  { fill: '#d97706', text: '#ffffff' }, // Amber
  { fill: '#4f46e5', text: '#ffffff' }, // Indigo
  { fill: '#db2777', text: '#ffffff' }, // Pink
  { fill: '#0d9488', text: '#ffffff' }, // Teal
  { fill: '#ea580c', text: '#ffffff' }, // Deep Orange
];

const AVATAR_EMOJIS = ['😎', '☕', '🥐', '🦁', '👑', '🎯', '🚀', '💎', '🔥', '🎲', '🍹', '🍕'];

const TUNISIAN_ROASTS = [
  "Ya m3allem khallas 3lina w rassi marfou3 ! ☕",
  "Mabrouk ! C'est toi le généreux de la table aujourd'hui 👑",
  "Tire la carte bancaire sans trembler ! 💳",
  "Lyoum 3lik inta, sa77a w bechfe l'el jme3a ! ✨",
  "Rabi yehdik, el 7seb lkol 3lik ! 💸",
  "Tu as perdu avec honneur, paye avec le sourire ! 🎯"
];

export const cleanDisplayName = (fullName: string): string => {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  if (trimmed.length <= 11) return trimmed;
  return trimmed.slice(0, 10) + '…';
};

export const ChkounYkhallesModal: React.FC<Props> = ({ isOpen, onClose, tableId }) => {
  const [socket, setSocket] = useState<ReturnType<typeof createGameSocket> | null>(null);
  const [name, setName] = useState(getStoredGameName);
  const [guestName, setGuestName] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [loser, setLoser] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [activeStake, setActiveStake] = useState<StakeMode>(STAKE_MODES[0]);
  const [isMuted, setIsMuted] = useState(rouletteAudio.getMuted());
  const [pointerTicking, setPointerTicking] = useState(false);
  const [roastQuote, setRoastQuote] = useState('');

  const playersRef = useRef<string[]>([]);
  playersRef.current = players;
  const rotationRef = useRef<number>(0);
  rotationRef.current = rotation;
  const tickingIntervalRef = useRef<number | null>(null);

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
        setRoastQuote('');
        const delay = Math.max(0, (event.startsAt || Date.now()) - Date.now());

        // Prepare ticking audio loop
        let tickSpeed = 70;
        let tickCount = 0;
        const startTickingAudio = () => {
          if (tickingIntervalRef.current) clearInterval(tickingIntervalRef.current);

          const tick = () => {
            tickCount++;
            const factor = Math.max(0.15, 1 - tickCount / 38);
            rouletteAudio.playClick(factor);
            setPointerTicking(true);
            setTimeout(() => setPointerTicking(false), 60);

            if (tickCount > 20) {
              tickSpeed += 22;
            }
            if (tickCount < 42) {
              tickingIntervalRef.current = window.setTimeout(tick, tickSpeed);
            }
          };
          tickingIntervalRef.current = window.setTimeout(tick, tickSpeed);
        };

        window.setTimeout(() => {
          setSpinning(true);
          startTickingAudio();

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
          if (tickingIntervalRef.current) clearTimeout(tickingIntervalRef.current);
          setSpinning(false);
          setLoser(event.loser || null);

          const randomRoast = TUNISIAN_ROASTS[Math.floor(Math.random() * TUNISIAN_ROASTS.length)];
          setRoastQuote(randomRoast);

          // Audio Fanfare + Confetti
          rouletteAudio.playFanfare();
          confetti({
            particleCount: 160,
            spread: 90,
            origin: { y: 0.62 },
            colors: ['#f97316', '#fbbf24', '#a855f7', '#38bdf8', '#ffffff'],
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
      if (tickingIntervalRef.current) clearTimeout(tickingIntervalRef.current);
      void activeSocket?.disconnect();
      setSocket(null);
    };
  }, [tableId, isOpen]);

  const join = () => {
    const savedName = rememberGameName(name);
    if (savedName) socket?.send('roulette/join', { playerId: gamePlayerId, name: savedName });
  };

  const addGuest = (customGuestName?: string) => {
    const targetName = (customGuestName || guestName).trim();
    if (!targetName) return;
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    socket?.send('roulette/join', { playerId: guestId, name: targetName });
    if (!customGuestName) setGuestName('');
  };

  const toggleSound = () => {
    const newMuted = rouletteAudio.toggleMute();
    setIsMuted(newMuted);
  };

  if (!isOpen) return null;

  const renderWheelSvg = () => {
    const count = players.length;
    if (count === 0) {
      return (
        <svg viewBox="0 0 320 320" className="w-full h-full">
          <defs>
            <radialGradient id="emptyWheelBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <circle cx="160" cy="160" r="148" fill="url(#emptyWheelBg)" stroke="#334155" strokeWidth="4" />
          <circle cx="160" cy="160" r="40" fill="#0b0f19" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
          <text x="160" y="154" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="900">
            AJOUTEZ DES JOUEURS
          </text>
          <text x="160" y="174" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="700">
            pour lancer la roulette
          </text>
        </svg>
      );
    }

    const sliceAngle = 360 / count;

    return (
      <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-2xl">
        <defs>
          <radialGradient id="goldHubGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="85%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>
          <linearGradient id="sliceBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
          </linearGradient>
        </defs>

        {/* Outer Base Shadow Ring */}
        <circle cx="160" cy="160" r="156" fill="#080b12" />

        {/* Slices Paths */}
        {players.map((player, i) => {
          const startAngle = i * sliceAngle;
          const endAngle = (i + 1) * sliceAngle;

          const radStart = ((startAngle - 90) * Math.PI) / 180;
          const radEnd = ((endAngle - 90) * Math.PI) / 180;

          const cx = 160;
          const cy = 160;
          const r = 146;

          const x1 = cx + r * Math.cos(radStart);
          const y1 = cy + r * Math.sin(radStart);
          const x2 = cx + r * Math.cos(radEnd);
          const y2 = cy + r * Math.sin(radEnd);

          const largeArc = sliceAngle > 180 ? 1 : 0;
          const pathData =
            count === 1
              ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
              : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          const colorConfig = SLICE_COLORS[i % SLICE_COLORS.length];

          return (
            <g key={`slice-${player}-${i}`}>
              <path
                d={pathData}
                fill={colorConfig.fill}
                stroke="#090d16"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d={pathData}
                fill="none"
                stroke="url(#sliceBorderGrad)"
                strokeWidth="1"
                opacity="0.35"
              />
            </g>
          );
        })}

        {/* Text & Emoji Overlays inside dedicated slice-centered radial groups */}
        {players.map((player, i) => {
          const midAngle = (i + 0.5) * sliceAngle;
          const displayName = cleanDisplayName(player);
          const emoji = AVATAR_EMOJIS[i % AVATAR_EMOJIS.length];

          if (count === 1) {
            return (
              <g key={`text-${player}-${i}`}>
                <text
                  x="160"
                  y="100"
                  fontSize="28"
                  textAnchor="middle"
                >
                  {emoji}
                </text>
                <text
                  x="160"
                  y="135"
                  fill="#ffffff"
                  fontSize="16"
                  fontWeight="900"
                  textAnchor="middle"
                  stroke="#080d1a"
                  strokeWidth="3.5"
                  paintOrder="stroke fill"
                  letterSpacing="0.05em"
                >
                  {displayName}
                </text>
              </g>
            );
          }

          // Font size adjusted for slice count
          const fontSize = count <= 3 ? 14 : count <= 6 ? 12 : count <= 8 ? 10.5 : 9.5;
          const isRadialText = count >= 5;

          return (
            <g
              key={`text-${player}-${i}`}
              transform={`rotate(${midAngle} 160 160)`}
            >
              {/* Avatar Icon */}
              <text
                x="160"
                y={count <= 4 ? '52' : '38'}
                fontSize={count <= 4 ? '15' : '12'}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {emoji}
              </text>

              {/* Player Name */}
              {isRadialText ? (
                // For 5+ players: orient text along the radial spoke for maximum width & perfect legibility!
                <text
                  x="160"
                  y="88"
                  transform="rotate(90 160 88)"
                  fill="#ffffff"
                  fontSize={fontSize}
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="central"
                  stroke="#080d1a"
                  strokeWidth="3.5"
                  paintOrder="stroke fill"
                  letterSpacing="0.04em"
                  style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                >
                  {displayName}
                </text>
              ) : (
                // For 2-4 players: horizontal bold text
                <text
                  x="160"
                  y="84"
                  fill="#ffffff"
                  fontSize={fontSize}
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="central"
                  stroke="#080d1a"
                  strokeWidth="3.5"
                  paintOrder="stroke fill"
                  letterSpacing="0.04em"
                  style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                >
                  {displayName}
                </text>
              )}
            </g>
          );
        })}

        {/* Outer Golden Chassis Rim */}
        <circle cx="160" cy="160" r="146" fill="none" stroke="url(#goldHubGrad)" strokeWidth="6" />
        <circle cx="160" cy="160" r="150" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />

        {/* 16 Dynamic LED Lights around the Bezel */}
        {Array.from({ length: 16 }).map((_, idx) => {
          const bulbAngle = (idx * 22.5 - 90) * (Math.PI / 180);
          const bx = 160 + 146 * Math.cos(bulbAngle);
          const by = 160 + 146 * Math.sin(bulbAngle);
          const isEven = idx % 2 === 0;
          return (
            <circle
              key={idx}
              cx={bx}
              cy={by}
              r="3.5"
              fill={spinning ? (isEven ? '#ffffff' : '#f59e0b') : '#fef08a'}
              stroke="#78350f"
              strokeWidth="1"
              style={{
                filter: 'drop-shadow(0 0 3px #f59e0b)',
                transition: 'fill 0.15s ease',
              }}
            />
          );
        })}

        {/* 3D Center Hub / Casino Spindle */}
        <circle cx="160" cy="160" r="30" fill="#0b0f19" stroke="url(#goldHubGrad)" strokeWidth="4" />
        <circle cx="160" cy="160" r="22" fill="url(#goldHubGrad)" />
        <circle cx="160" cy="160" r="16" fill="#0f172a" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
        <text x="160" y="165" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="black">
          🎯
        </text>
      </svg>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/85 p-0 sm:p-4 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[95vh] overflow-y-auto no-scrollbar rounded-t-[32px] sm:rounded-[32px] border border-orange-500/30 bg-[#0a0d16] shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle on Mobile */}
        <div className="w-12 h-1.5 bg-white/25 rounded-full mx-auto my-2.5 sm:hidden cursor-pointer" onClick={onClose} />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-base font-black text-white tracking-tight">Chkoun ykhalles ?</h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Table
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">{activeStake.stakeTitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all ${
                isMuted
                  ? 'bg-white/5 border-white/10 text-gray-500'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/5 p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Stake Mode Selection Tabs */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {STAKE_MODES.map((mode) => {
              const Icon = mode.icon;
              const isActive = activeStake.id === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveStake(mode)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
                      : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-gray-200 border border-white/[0.05]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Roulette Wheel Stage */}
        <div className="mx-4 my-3 rounded-3xl border border-orange-500/20 bg-gradient-to-b from-[#111624] via-[#0d101b] to-[#0a0d16] p-4 text-center relative overflow-hidden shadow-inner">
          {/* Glowing Ambient Backdrop */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Realistic Pointer Arrow at Top (12 o'clock) with dynamic recoil */}
          <div className="relative z-30 flex justify-center -mb-4">
            <div
              className={`transition-transform duration-75 ${
                pointerTicking ? 'animate-pointer-tick scale-110' : ''
              }`}
            >
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" />
              <div className="w-2.5 h-2.5 bg-white rounded-full mx-auto -mt-6 shadow-sm shadow-amber-300" />
            </div>
          </div>

          {/* SVG Wheel Container with Rotational Transition */}
          <div className="relative mx-auto h-60 w-60 sm:h-64 sm:w-64 overflow-visible mt-2">
            <div
              className="h-full w-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 3.2s cubic-bezier(0.12, 0.9, 0.12, 1)' : 'none',
              }}
            >
              {renderWheelSvg()}
            </div>
          </div>

          {/* Status / Reveal Announcement */}
          <div className="mt-3 min-h-[58px] flex items-center justify-center">
            {spinning ? (
              <div className="space-y-1 animate-pulse">
                <p className="text-base font-black text-amber-300 tracking-wide flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  La roulette tourne…
                </p>
                <p className="text-[11px] font-semibold text-gray-400">Suspense à la table !</p>
              </div>
            ) : loser ? (
              <div className="w-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/15 border border-amber-400/40 rounded-2xl p-3 shadow-lg shadow-amber-500/10 animate-scaleUp">
                <div className="flex items-center justify-center space-x-2 text-amber-300">
                  <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-wider">Le Destin a Choisi</span>
                </div>
                <h3 className="text-lg font-black text-white mt-0.5 truncate">{loser}</h3>
                <p className="text-xs font-bold text-amber-200 mt-0.5 italic">
                  {roastQuote || `C'est ${loser} qui régale pour ${activeStake.stakeTitle.toLowerCase()} !`}
                </p>
              </div>
            ) : (
              <div className="text-center space-y-0.5">
                <p className="text-xs font-bold text-gray-300">
                  {players.length === 0
                    ? 'Ajoutez les personnes autour de votre table'
                    : `${players.length} joueur${players.length > 1 ? 's' : ''} prêt${players.length > 1 ? 's' : ''} à défier la roue`}
                </p>
                <p className="text-[11px] text-gray-500">{activeStake.desc}</p>
              </div>
            )}
          </div>
        </div>

        {/* Players & Lobby Management */}
        <div className="space-y-3 px-4 pb-5">
          {/* Quick Add Form */}
          <div className="flex gap-2">
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGuest()}
              placeholder="Ajouter un ami (Ex: Youssef, Sarra...)"
              maxLength={24}
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-orange-400 transition-all"
            />
            <button
              onClick={() => addGuest()}
              className="rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 px-3.5 text-xs font-bold text-white flex items-center gap-1 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Ajouter</span>
            </button>
          </div>

          {/* Quick Suggestion Chips for Fast Table Population */}
          {players.length < 3 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <UserPlus className="w-3 h-3" /> Rapide:
              </span>
              {['Moi', 'Ami 1', 'Ami 2', 'Ami 3'].map((sample) => (
                <button
                  key={sample}
                  onClick={() => addGuest(sample === 'Moi' && name ? name : sample)}
                  className="text-[10px] font-bold bg-white/[0.04] hover:bg-amber-500/20 text-gray-300 hover:text-amber-200 border border-white/[0.06] hover:border-amber-500/30 px-2 py-0.5 rounded-lg transition-all"
                >
                  +{sample}
                </button>
              ))}
            </div>
          )}

          {/* Lobby list with Avatars */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-300">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-orange-400" />
                <span>Joueurs sur la roue ({players.length})</span>
              </div>
              {players.length > 0 && !players.includes(name.trim()) && name.trim() && (
                <button
                  onClick={join}
                  className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline"
                >
                  M&apos;ajouter ({name})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
              {players.length ? (
                players.map((player, index) => {
                  const isMe = player === name.trim();
                  const color = SLICE_COLORS[index % SLICE_COLORS.length];
                  return (
                    <span
                      key={`${player}-${index}`}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition-all"
                      style={{
                        backgroundColor: `${color.fill}22`,
                        borderColor: `${color.fill}55`,
                        color: '#ffffff',
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color.fill }} />
                      <span className="truncate max-w-[120px] font-black">{player}</span>
                      {isMe && <span className="text-[9px] text-amber-300 font-black">(vous)</span>}
                    </span>
                  );
                })
              ) : (
                <div className="text-center w-full py-2">
                  <p className="text-xs text-gray-500 italic">Aucun joueur pour le moment.</p>
                  <p className="text-[10px] text-gray-600">Tapez un prénom ci-dessus pour commencer.</p>
                </div>
              )}
            </div>
          </div>

          {/* Spin Action CTA */}
          <div className="pt-1">
            <button
              disabled={players.length === 0 || spinning}
              onClick={() => socket?.send('roulette/start')}
              className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black py-3.5 px-6 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              <Dices className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
              <span>{spinning ? 'Tirage en cours…' : loser ? 'Relancer la Roulette 🎯' : 'Lancer la Roulette !'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
