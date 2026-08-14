import React, { useEffect, useState } from 'react';
import { Gift, Mail, Plus, Save, Send, Settings2, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';
import { RewardCampaign } from '../../../types';

const initial: RewardCampaign = {
  enabled: false,
  googleReviewUrl: '',
  couponValidDays: 30,
  participationCooldownDays: 30,
  minimumOrderAmount: 0,
  options: [
    { label: 'Petit cadeau', discountPercent: 5, probabilityPercent: 60, enabled: true },
    { label: 'Belle surprise', discountPercent: 10, probabilityPercent: 30, enabled: true },
    { label: 'Jackpot', discountPercent: 20, probabilityPercent: 10, enabled: true },
  ],
};

const Field: React.FC<{ label: string; hint?: string; suffix?: string; children: React.ReactNode }> = ({ label, hint, suffix, children }) => <label className="block min-w-0">
  <span className="mb-2 block min-h-8 text-xs font-bold leading-4 text-gray-200">{label}</span>
  <span className="relative block">{children}{suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] font-black text-gray-400">{suffix}</span>}</span>
  <span className={`mt-1.5 block min-h-8 text-[10px] leading-4 text-gray-500 ${hint ? '' : 'invisible'}`} aria-hidden={!hint}>{hint || '—'}</span>
</label>;

export const RewardCampaignManager: React.FC<{ cafeSlug: string }> = ({ cafeSlug }) => {
  const [campaign, setCampaign] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [manual, setManual] = useState({ email: '', discountPercent: 50, validDays: 30 });
  const [sending, setSending] = useState(false);

  useEffect(() => { api.getRewardCampaign(cafeSlug).then(x => setCampaign(x.options.length ? x : { ...initial, ...x, options: initial.options })).catch(() => {}); }, [cafeSlug]);
  const baseInput = 'h-12 w-full rounded-xl border border-white/[0.08] bg-[#090b12] px-3 text-sm text-white outline-none transition focus:border-orange-400/60 focus:ring-2 focus:ring-orange-500/10';
  const changeOption = (index: number, field: 'discountPercent' | 'probabilityPercent', value: string) => setCampaign({ ...campaign, options: campaign.options.map((o, i) => i === index ? { ...o, [field]: Number(value) } : o) });
  const save = async () => { setSaving(true); try { setCampaign(await api.saveRewardCampaign(cafeSlug, campaign)); alert('Campagne enregistrée.'); } catch { alert('Vérifiez les paramètres : les probabilités doivent totaliser exactement 100 %.'); } finally { setSaving(false); } };
  const sendManual = async () => { setSending(true); try { const result = await api.createManualCoupon(cafeSlug, { ...manual, minimumOrderAmount: 0 }); alert(result.emailSent ? `Coupon de ${manual.discountPercent} % envoyé à ${result.email}.` : `Coupon enregistré pour ${result.email}, mais l’email n’a pas été envoyé : le service email doit être configuré.`); if (result.emailSent) setManual({ ...manual, email: '', discountPercent: 50 }); } catch { alert('Impossible de créer le coupon. Vérifiez l’adresse email, la réduction et la durée.'); } finally { setSending(false); } };
  const sum = campaign.options.filter(o => o.enabled).reduce((n, o) => n + Number(o.probabilityPercent), 0);

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10121b] shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-6 py-5">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-400/10"><Sparkles className="h-5 w-5 text-amber-400"/></span><div><h2 className="text-base font-black">Campagne de fidélité</h2><p className="mt-0.5 text-xs text-gray-500">Avis client, roulette et coupon envoyés automatiquement par email.</p></div></div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-2.5 text-sm font-bold"><span className={`h-2.5 w-2.5 rounded-full ${campaign.enabled ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : 'bg-gray-600'}`}/><input className="h-4 w-4 accent-orange-500" type="checkbox" checked={campaign.enabled} onChange={e => setCampaign({ ...campaign, enabled: e.target.checked })}/>{campaign.enabled ? 'Campagne active' : 'Campagne désactivée'}</label>
      </div>

      <div className="space-y-7 p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Lien de la fiche Google" hint="Le client pourra ouvrir cette fiche après la roulette."><input value={campaign.googleReviewUrl || ''} onChange={e => setCampaign({ ...campaign, googleReviewUrl: e.target.value })} className={baseInput} placeholder="https://www.google.com/maps/place/..."/></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Validité du coupon" suffix="jours" hint="Durée pendant laquelle le code peut être utilisé."><input type="number" min="1" max="365" value={campaign.couponValidDays} onChange={e => setCampaign({ ...campaign, couponValidDays: Number(e.target.value) })} className={`${baseInput} pr-20`}/></Field>
            <Field label="Nouvelle participation" suffix="jours" hint="Délai avant que le même email puisse rejouer."><input type="number" min="1" max="365" value={campaign.participationCooldownDays} onChange={e => setCampaign({ ...campaign, participationCooldownDays: Number(e.target.value) })} className={`${baseInput} pr-20`}/></Field>
            <Field label="Minimum pour utiliser le coupon" suffix="TND" hint="Exemple : 10 TND exige une commande d’au moins 10 TND. Saisissez 0 pour supprimer cette condition."><input type="number" min="0" step=".001" value={campaign.minimumOrderAmount} onChange={e => setCampaign({ ...campaign, minimumOrderAmount: Number(e.target.value) })} className={`${baseInput} pr-16`}/></Field>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-end justify-between"><div><h3 className="flex items-center gap-2 text-sm font-black"><Settings2 className="h-4 w-4 text-orange-400"/>Récompenses de la roulette</h3><p className="mt-1 text-[11px] text-gray-500">La probabilité totale doit être égale à 100 %.</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${sum === 100 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{sum} % sur 100 %</span></div>
          <div className="hidden grid-cols-[1fr_150px_150px_44px] gap-3 px-1 pb-2 text-[10px] font-black uppercase tracking-wider text-gray-500 sm:grid"><span>Nom affiché sur la roulette</span><span>Réduction</span><span>Chance de gagner</span><span/></div>
          <div className="space-y-2">{campaign.options.map((o, i) => <div key={o.id || i} className="grid gap-2 rounded-2xl border border-white/[0.06] bg-black/20 p-3 sm:grid-cols-[1fr_150px_150px_44px]">
            <input aria-label={`Nom du gain ${i + 1}`} value={o.label} onChange={e => setCampaign({ ...campaign, options: campaign.options.map((x, n) => n === i ? { ...x, label: e.target.value } : x) })} className={baseInput}/>
            <span className="relative"><input aria-label={`Réduction du gain ${i + 1}`} type="number" min="0" max="100" value={o.discountPercent} onChange={e => changeOption(i, 'discountPercent', e.target.value)} className={`${baseInput} pr-12`}/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-500">%</span></span>
            <span className="relative"><input aria-label={`Probabilité du gain ${i + 1}`} type="number" min="0" max="100" value={o.probabilityPercent} onChange={e => changeOption(i, 'probabilityPercent', e.target.value)} className={`${baseInput} pr-12`}/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-500">%</span></span>
            <button aria-label={`Supprimer le gain ${i + 1}`} onClick={() => setCampaign({ ...campaign, options: campaign.options.filter((_, n) => n !== i) })} className="grid h-12 w-11 place-items-center rounded-xl text-gray-600 transition hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4"/></button>
          </div>)}</div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><button onClick={() => setCampaign({ ...campaign, options: [...campaign.options, { label: 'Nouveau gain', discountPercent: 5, probabilityPercent: 0, enabled: true }] })} className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-white/[0.04]"><Plus className="h-4 w-4"/>Ajouter une récompense</button><button onClick={save} disabled={saving || sum !== 100} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-black shadow-lg shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-40"><Save className="h-4 w-4"/>{saving ? 'Enregistrement…' : 'Enregistrer la campagne'}</button></div>
        </div>
      </div>
    </section>

    <section className="rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-500/[0.07] to-[#10121b] p-6 shadow-2xl shadow-black/20">
      <div className="mb-6 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10"><Mail className="h-5 w-5 text-emerald-400"/></span><div><h2 className="text-base font-black">Offrir un coupon à une personne</h2><p className="mt-0.5 text-xs text-gray-500">Choisissez simplement la réduction et le destinataire. Le code sera créé et envoyé par email.</p></div></div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(170px,210px)_minmax(170px,210px)_auto]">
        <Field label="Adresse email du destinataire"><input type="email" value={manual.email} onChange={e => setManual({ ...manual, email: e.target.value })} className={baseInput} placeholder="client@exemple.com"/></Field>
        <Field label="Réduction offerte" suffix="%" hint="Vous pouvez saisir 50 pour offrir 50 %. "><input type="number" min="1" max="100" step="1" value={manual.discountPercent} onChange={e => setManual({ ...manual, discountPercent: Number(e.target.value) })} className={`${baseInput} pr-14`}/></Field>
        <Field label="Durée de validité" suffix="jours" hint="Le coupon expirera après cette durée."><input type="number" min="1" max="365" value={manual.validDays} onChange={e => setManual({ ...manual, validDays: Number(e.target.value) })} className={`${baseInput} pr-20`}/></Field>
        <div className="pt-10"><button onClick={sendManual} disabled={sending || !manual.email || manual.discountPercent < 1 || manual.discountPercent > 100} className="flex h-12 min-w-[180px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-500 px-6 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4"/>{sending ? 'Création…' : 'Créer et envoyer'}</button></div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3 text-[11px] text-gray-400"><Gift className="h-4 w-4 shrink-0 text-emerald-400"/>Aucun montant minimum n’est imposé à ce coupon personnalisé. Il fonctionnera automatiquement sur la prochaine commande du client.</div>
    </section>
  </div>;
};
