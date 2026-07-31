import React from 'react';
import { Handshake, RotateCcw, Sparkles, Trophy } from 'lucide-react';

type Tone = 'amber' | 'red' | 'cyan' | 'rainbow';

interface Props {
  winnerName?: string | null;
  draw?: boolean;
  label?: string;
  detail?: string;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
}

const tones: Record<Tone, { shell: string; glow: string; badge: string; accent: string }> = {
  amber: {
    shell: 'border-amber-300/40 bg-gradient-to-br from-amber-400/20 via-orange-500/10 to-transparent',
    glow: 'bg-amber-300/20 text-amber-100',
    badge: 'text-amber-200',
    accent: 'text-amber-300',
  },
  red: {
    shell: 'border-red-300/40 bg-gradient-to-br from-red-500/20 via-orange-500/10 to-transparent',
    glow: 'bg-red-300/20 text-red-100',
    badge: 'text-red-200',
    accent: 'text-yellow-200',
  },
  cyan: {
    shell: 'border-cyan-300/40 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-transparent',
    glow: 'bg-cyan-300/20 text-cyan-100',
    badge: 'text-cyan-200',
    accent: 'text-yellow-200',
  },
  rainbow: {
    shell: 'border-white/30 bg-gradient-to-br from-red-500/20 via-yellow-400/10 to-blue-500/20',
    glow: 'bg-white/15 text-white',
    badge: 'text-yellow-200',
    accent: 'text-white',
  },
};

export const GameResultBanner: React.FC<Props> = ({
  winnerName,
  draw = false,
  label,
  detail,
  tone = 'amber',
  actionLabel,
  onAction,
}) => {
  const palette = tones[tone];
  const headline = detail || (draw ? 'Tout le monde a bien joué !' : `${winnerName || 'Le joueur gagnant'} gagne !`);

  return (
    <div role="status" aria-live="polite" className={`relative overflow-hidden rounded-[26px] border p-4 shadow-2xl animate-scaleUp ${palette.shell}`}>
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl shadow-inner animate-bounce ${palette.glow}`}>
          {draw ? <Handshake className="h-7 w-7" /> : <Trophy className="h-7 w-7" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-[.18em] ${palette.badge}`}>
            <Sparkles className="h-3 w-3" /> {label || (draw ? 'Résultat' : 'Victoire')}
          </p>
          <h3 className="mt-1 truncate text-lg font-black text-white">{headline}</h3>
          {!detail && !draw && <p className={`mt-0.5 text-[11px] font-bold ${palette.accent}`}>La table célèbre ce moment 🎉</p>}
        </div>
      </div>
      {onAction && actionLabel && (
        <button onClick={onAction} className="relative mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-2.5 text-xs font-black text-white transition hover:bg-white/25">
          <RotateCcw className="h-3.5 w-3.5" /> {actionLabel}
        </button>
      )}
    </div>
  );
};
