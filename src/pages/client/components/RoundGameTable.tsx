import React from 'react';
import { gamePlayerId } from '../../../services/gameSocket';

type Player = { id: string; name: string };
interface Props { players: Player[]; turnId?: string; counts?: Record<string, number>; children: React.ReactNode; }
const positions = ['left-1/2 -translate-x-1/2 -top-5','-right-3 top-1/2 -translate-y-1/2','left-1/2 -translate-x-1/2 -bottom-5','-left-3 top-1/2 -translate-y-1/2'];
export const RoundGameTable: React.FC<Props> = ({ players, turnId, counts, children }) => <div className="relative mx-auto h-[330px] w-full max-w-[360px]">
  <div className="absolute inset-8 rounded-[45%] border-[10px] border-[#70452b] bg-[radial-gradient(circle_at_45%_35%,#39735a,#153d32_70%)] shadow-[inset_0_0_35px_rgba(0,0,0,.55),0_20px_40px_rgba(0,0,0,.45)]"><div className="grid h-full place-items-center">{children}</div></div>
  {[0,1,2,3].map(i=>{const p=players[i];const active=p?.id===turnId;return <div key={i} className={`absolute ${positions[i]} w-24 text-center`}><div className={`mx-auto grid h-11 w-11 place-items-center rounded-full border-4 text-lg shadow-xl ${active?'border-yellow-300 bg-yellow-300 text-slate-950 animate-pulse':'border-white/20 bg-[#252a38] text-white'}`}>{p?p.name.charAt(0).toUpperCase():'+'}</div><div className={`mt-1 rounded-full px-2 py-1 text-[9px] font-black ${active?'bg-yellow-300 text-slate-950':'bg-black/70 text-white'}`}>{p?<>{p.name}{p.id===gamePlayerId?' · vous':''}{counts?.[p.id]!==undefined?` · ${counts[p.id]} cartes`:''}</>:'En attente'}</div><span className={`mt-0.5 inline-block text-[8px] font-bold uppercase tracking-wider ${active?'text-yellow-300':'text-gray-500'}`}>{active?'À toi':'En attente'}</span></div>})}
</div>;
