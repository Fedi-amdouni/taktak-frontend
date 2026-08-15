import React from 'react';
import {
  ArrowRight,
  CircleDollarSign,
  Grid3X3,
  Layers3,
  Dices,
  Sparkles,
  Brain,
  Users,
  Flame,
  Crown
} from 'lucide-react';

export type EntertainmentGame = 'connect-four' | 'uno' | 'quiz' | 'truth' | 'ludo' | 'chkobba' | 'rami';

interface Props {
  onSelect: (game: EntertainmentGame) => void;
  onRoulette: () => void;
}

const games = [
  {
    id: 'chkobba' as const,
    title: 'Chkobba Tounsia',
    text: 'La scopa traditionnelle, 2 à 4 joueurs',
    playersText: '2-4 Joueurs',
    icon: Layers3,
    color: 'from-amber-600 via-orange-600 to-rose-950',
    badge: 'Populaire 🔥',
  },
  {
    id: 'rami' as const,
    title: 'Rami Café',
    text: 'Suites, brelans, jokers & défausse',
    playersText: '2-4 Joueurs',
    icon: Layers3,
    color: 'from-emerald-600 via-teal-700 to-slate-950',
    badge: 'Classique ⭐',
  },
  {
    id: 'connect-four' as const,
    title: 'Puissance 4',
    text: 'Duel tactique en direct',
    playersText: '2 Joueurs',
    icon: Grid3X3,
    color: 'from-blue-600 via-indigo-700 to-slate-950',
    badge: 'Rapide ⚡',
  },
  {
    id: 'uno' as const,
    title: 'UNO Cartes',
    text: '+2, +4, inversements & cartes Joker',
    playersText: '2-4 Joueurs',
    icon: Layers3,
    color: 'from-red-600 via-yellow-600 to-blue-700',
    badge: 'Multijoueur 👥',
  },
  {
    id: 'ludo' as const,
    title: 'Ludo Café',
    text: 'Course effrénée de pions à 4',
    playersText: '2-4 Joueurs',
    icon: Dices,
    color: 'from-cyan-600 via-blue-700 to-slate-950',
    badge: 'Famille 🎲',
  },
  {
    id: 'quiz' as const,
    title: 'Quiz Tunisie',
    text: 'Culture générale, foot, villes et café',
    playersText: '1-4 Joueurs',
    icon: Brain,
    color: 'from-rose-600 via-pink-700 to-slate-950',
    badge: 'Culture 🧠',
  },
  {
    id: 'truth' as const,
    title: 'Action ou Vérité',
    text: 'Défis rigolos et ambiance garantie',
    playersText: '2-6 Joueurs',
    icon: Sparkles,
    color: 'from-purple-600 via-fuchsia-700 to-slate-950',
    badge: 'Ambiance ✨',
  },
];

export const EntertainmentHub: React.FC<Props> = ({ onSelect, onRoulette }) => (
  <section className="mx-auto max-w-md space-y-5 p-4 pb-28">
    <header className="space-y-1">
      <div className="flex items-center space-x-2">
        <span className="text-[10px] font-black uppercase tracking-[.25em] text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-400/25">
          À votre table
        </span>
      </div>
      <h1 className="text-2xl font-black text-white tracking-tight">Espace Divertissement</h1>
      <p className="text-xs text-gray-400 font-medium">
        Défiez vos amis à table en direct pendant que votre commande se prépare !
      </p>
    </header>

    {/* Featured Roulette Hero Card */}
    <div
      onClick={onRoulette}
      className="relative overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-[#0e121e] p-5 cursor-pointer shadow-2xl group hover:border-amber-400/60 transition-all duration-300 active:scale-[0.99]"
    >
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30 flex-shrink-0 group-hover:rotate-12 transition-transform duration-300">
            🎯
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                Le Grand Tirage
              </span>
            </div>
            <h2 className="text-lg font-black text-white tracking-tight truncate group-hover:text-amber-200 transition-colors">
              Chkoun ykhalles ?
            </h2>
            <p className="text-xs text-amber-100/70 font-medium">
              La roulette de la note, de la tournée ou du DJ !
            </p>
          </div>
        </div>

        <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 flex-shrink-0 group-hover:translate-x-1 transition-transform">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>

    {/* Games Grid */}
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
          Jeux de Table en Direct
        </span>
        <span className="text-[10px] font-bold text-gray-500">
          {games.length} jeux disponibles
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {games.map(({ id, title, text, playersText, icon: Icon, color, badge }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`min-h-44 overflow-hidden rounded-3xl bg-gradient-to-br ${color} p-4 text-left shadow-xl transition-all duration-300 active:scale-95 border border-white/10 hover:border-white/25 flex flex-col justify-between group`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5 text-white" />
                </span>
                <span className="text-[9px] font-extrabold bg-black/40 text-white/90 px-2 py-0.5 rounded-full border border-white/10">
                  {badge}
                </span>
              </div>
              <span className="mt-4 block text-sm font-black text-white tracking-tight group-hover:text-amber-200 transition-colors">
                {title}
              </span>
              <span className="mt-1 block text-[10px] font-medium text-white/70 line-clamp-2 leading-relaxed">
                {text}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-3 text-white/80">
              <span className="text-[9px] font-bold flex items-center gap-1">
                <Users className="w-2.5 h-2.5" />
                {playersText}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-white group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  </section>
);
