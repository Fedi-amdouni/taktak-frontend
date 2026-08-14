import React from 'react';
import { ArrowRight, CircleDollarSign, Grid3X3, Layers3, Dices, Sparkles, Brain } from 'lucide-react';

export type EntertainmentGame = 'connect-four' | 'uno' | 'quiz' | 'truth' | 'ludo' | 'chkobba' | 'rami';
interface Props { onSelect: (game: EntertainmentGame) => void; onRoulette: () => void; }
const games = [
  { id: 'connect-four' as const, title: 'Puissance 4', text: 'Duel à deux, en direct', icon: Grid3X3, color: 'from-blue-600 to-indigo-950' },
  { id: 'uno' as const, title: 'UNO', text: 'De 2 à 4 joueurs', icon: Layers3, color: 'from-red-500 via-yellow-500 to-blue-600' },
  { id: 'quiz' as const, title: 'Quiz Tunisie', text: 'Culture, villes et café', icon: Brain, color: 'from-red-600 to-rose-950' },
  { id: 'truth' as const, title: 'Action ou Vérité', text: 'Ambiance garantie à 4', icon: Sparkles, color: 'from-purple-600 to-fuchsia-950' },
  { id: 'ludo' as const, title: 'Ludo Café', text: 'Course de pions à 4', icon: Dices, color: 'from-cyan-500 to-blue-950' },
  { id: 'chkobba' as const, title: 'Chkobba', text: 'La scopa tounsia, à 2 à 4', icon: Layers3, color: 'from-amber-400 via-orange-600 to-rose-950' },
  { id: 'rami' as const, title: 'Rami', text: 'Suites, brelans et defausse', icon: Layers3, color: 'from-emerald-500 via-teal-700 to-slate-950' },
];
export const EntertainmentHub: React.FC<Props> = ({ onSelect, onRoulette }) => <section className="mx-auto max-w-md space-y-5 p-4 pb-24">
  <header><p className="text-xs font-bold uppercase tracking-[.22em] text-amber-300">À votre table</p><h1 className="mt-1 text-3xl font-black text-white">Divertissement</h1><p className="mt-2 text-sm text-gray-400">Choisissez un jeu, rejoignez le lobby, puis jouez ensemble.</p></header>
  <button onClick={onRoulette} className="w-full overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-orange-500/30 to-amber-300/10 p-5 text-left"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-300 text-3xl">🎯</span><span className="flex-1"><span className="block text-lg font-black text-white">Chkoun ykhalles ?</span><span className="text-xs text-amber-100/70">La roulette de la note</span></span><CircleDollarSign className="h-6 w-6 text-amber-200" /></div></button>
  <div className="grid grid-cols-2 gap-3">{games.map(({ id, title, text, icon: Icon, color }) => <button key={id} onClick={() => onSelect(id)} className={`min-h-44 overflow-hidden rounded-3xl bg-gradient-to-br ${color} p-4 text-left shadow-xl transition active:scale-95`}><span className="grid h-12 w-12 place-items-center rounded-2xl bg-black/25"><Icon className="h-7 w-7 text-white" /></span><span className="mt-5 block text-base font-black text-white">{title}</span><span className="mt-1 block text-[10px] font-medium text-white/70">{text}</span><ArrowRight className="mt-3 h-4 w-4 text-white" /></button>)}</div>
</section>;
