import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Gift, MailCheck, Star, X } from 'lucide-react';
import { api } from '../../../services/api';
import { CouponReward, RewardCampaign } from '../../../types';

const colors = ['#f97316', '#fbbf24', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6'];

export const FeedbackRewardModal: React.FC<{ isOpen: boolean; onClose: () => void; cafeSlug: string; orderId: string | null }> = ({ isOpen, onClose, cafeSlug, orderId }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [campaign, setCampaign] = useState<RewardCampaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reward, setReward] = useState<CouponReward | null>(null);

  useEffect(() => { if (isOpen) api.getRewardCampaign(cafeSlug).then(setCampaign).catch(() => {}); }, [isOpen, cafeSlug]);
  const activeOptions = useMemo(() => campaign?.options.filter(o => o.enabled) || [], [campaign]);
  const wheel = useMemo(() => {
    let cursor = 0;
    return `conic-gradient(${activeOptions.map((o, i) => { const start = cursor; cursor += Number(o.probabilityPercent) * 3.6; return `${colors[i % colors.length]} ${start}deg ${cursor}deg`; }).join(',')})`;
  }, [activeOptions]);

  if (!isOpen || !orderId) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true);
    try {
      const won = await api.submitRewardFeedback(cafeSlug, { orderId, rating, comment, email });
      setSpinning(true); setRotation(1440 + Math.floor(Math.random() * 300));
      setTimeout(() => { setReward(won); setSpinning(false); localStorage.setItem(`taktak_feedback_${orderId}`, '1'); }, 2800);
    } catch { alert(`Cet email a peut-être déjà participé pendant les ${campaign?.participationCooldownDays || 30} derniers jours, ou l’adresse est invalide.`); }
    finally { setLoading(false); }
  };

  return <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4"><div className="w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] border border-white/10 bg-[#10121b] p-6 text-white shadow-2xl">
    <button onClick={onClose} className="float-right rounded-full bg-white/5 p-2"><X className="h-4 w-4"/></button>
    {(spinning || reward) ? <div className="space-y-4 py-4 text-center">
      <div className="relative mx-auto h-56 w-56"><div className="absolute left-1/2 top-[-8px] z-10 -translate-x-1/2 border-x-[12px] border-t-[22px] border-x-transparent border-t-white"/><div className="h-full w-full rounded-full border-8 border-white/10 shadow-2xl" style={{ background: wheel || '#f97316', transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 2.7s cubic-bezier(.12,.8,.2,1)' : undefined }}/><div className="absolute inset-[42%] rounded-full bg-[#10121b] border-4 border-white/20"/></div>
      <div className="flex flex-wrap justify-center gap-2">{activeOptions.map((o, i) => <span key={o.id || i} className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: colors[i % colors.length] }}>{o.label}</span>)}</div>
      {spinning ? <h2 className="text-xl font-black">La roulette tourne…</h2> : reward && <><Gift className="mx-auto h-12 w-12 text-amber-400"/><h2 className="text-2xl font-black">{reward.rewardLabel}</h2><div className="rounded-2xl bg-emerald-500/10 p-4"><MailCheck className="mx-auto mb-2 h-8 w-8 text-emerald-400"/><p className="text-sm font-bold">Le code a été envoyé uniquement à votre email.</p><p className="mt-1 text-xs text-gray-400">Conservez cet email pour votre prochaine commande.</p></div>{reward.googleReviewUrl && <a href={reward.googleReviewUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-900">Laisser aussi un avis Google <ExternalLink className="h-4 w-4"/></a>}<button onClick={onClose} className="text-sm text-gray-400">Fermer</button></>}
    </div> : <form onSubmit={submit} className="space-y-4"><Gift className="mx-auto h-10 w-10 text-amber-400"/><div className="text-center"><h2 className="text-xl font-black">Votre avis compte</h2><p className="mt-1 text-xs text-gray-400">Tentez votre chance. Un email ne peut participer qu’une fois tous les {campaign?.participationCooldownDays || 30} jours.</p></div><div className="flex justify-center gap-2">{[1,2,3,4,5].map(n => <button type="button" key={n} onClick={() => setRating(n)}><Star className={`h-8 w-8 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`}/></button>)}</div><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Un commentaire (facultatif)" className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm"/><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Votre email pour recevoir le coupon" className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm"/><button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3 font-black disabled:opacity-50">{loading ? 'Vérification…' : 'Envoyer et lancer la roulette'}</button><p className="text-center text-[10px] text-gray-500">Le résultat est calculé automatiquement. Le personnel n’intervient pas.</p></form>}
  </div></div>;
};
