import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Monitor, Save, Settings2 } from 'lucide-react';
import { api } from '../../../services/api';
import { CafeFeatureSettings, TvMenuStyle } from '../../../types';

interface FeatureSettingsProps {
  cafeSlug: string;
}

const DEFAULT_SETTINGS: CafeFeatureSettings = {
  orderingEnabled: true,
  waiterCallsEnabled: true,
  gamesEnabled: true,
  ambianceVotingEnabled: true,
  rewardsEnabled: true,
  tvMenuEnabled: true,
  tvMenuStyle: 'ELEGANT',
};

type FeatureToggleKey = Exclude<keyof CafeFeatureSettings, 'tvMenuStyle'>;

const FEATURES: Array<{
  key: FeatureToggleKey;
  title: string;
  description: string;
  group: 'service' | 'experience' | 'display';
}> = [
  { key: 'orderingEnabled', title: 'Commandes à table', description: 'Panier, personnalisation et envoi en cuisine.', group: 'service' },
  { key: 'waiterCallsEnabled', title: 'Appel serveur & addition', description: 'Demandes prioritaires depuis la table.', group: 'service' },
  { key: 'gamesEnabled', title: 'Jeux de table', description: 'Jeux multijoueurs après une commande.', group: 'experience' },
  { key: 'ambianceVotingEnabled', title: 'Votes & ambiance', description: 'Votes musique, sondages et programme TV.', group: 'experience' },
  { key: 'rewardsEnabled', title: 'Avis & récompenses', description: 'Feedback, roue VIP et coupons.', group: 'experience' },
  { key: 'tvMenuEnabled', title: 'Menu Smart TV', description: 'Affichage plein écran via une URL dédiée.', group: 'display' },
];

const TV_STYLES: Array<{
  key: TvMenuStyle;
  title: string;
  eyebrow: string;
  description: string;
  previewClass: string;
  textClass: string;
}> = [
  {
    key: 'ELEGANT',
    title: 'Élégant éditorial',
    eyebrow: 'CRÈME & OR',
    description: 'Carte raffinée, inspirée des menus de table haut de gamme.',
    previewClass: 'bg-[radial-gradient(circle_at_70%_15%,#f9f2df_0%,#d8b27a_40%,#4d2d1b_100%)]',
    textClass: 'text-[#321e14]',
  },
  {
    key: 'ESPRESSO',
    title: 'Espresso premium',
    eyebrow: 'BOIS & LAITON',
    description: 'Ambiance coffee shop chaleureuse, dense et sophistiquée.',
    previewClass: 'bg-[radial-gradient(circle_at_20%_10%,#704322_0%,#23150e_46%,#090706_100%)]',
    textClass: 'text-[#f4dfb5]',
  },
  {
    key: 'URBAN',
    title: 'Urbain contrasté',
    eyebrow: 'NOIR & SAFRAN',
    description: 'Typographie forte et blocs visuels pour une lecture immédiate.',
    previewClass: 'bg-[#11110f]',
    textClass: 'text-[#f8c947]',
  },
];

export const FeatureSettings: React.FC<FeatureSettingsProps> = ({ cafeSlug }) => {
  const [settings, setSettings] = useState<CafeFeatureSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<CafeFeatureSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const cafe = await api.getCafeBySlug(cafeSlug);
        const next = FEATURES.reduce((acc, feature) => {
          acc[feature.key] = cafe[feature.key] ?? true;
          return acc;
        }, { ...DEFAULT_SETTINGS });
        next.tvMenuStyle = cafe.tvMenuStyle ?? DEFAULT_SETTINGS.tvMenuStyle;
        setSettings(next);
        setSavedSettings(next);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cafeSlug]);

  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings]);
  const activeCount = Object.values(settings).filter(Boolean).length;
  const tvUrl = `${window.location.origin}/tv/${cafeSlug}`;

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const cafe = await api.updateCafeFeatures(cafeSlug, settings);
      const persisted = FEATURES.reduce((acc, feature) => {
        acc[feature.key] = cafe[feature.key] ?? settings[feature.key];
        return acc;
      }, { ...settings });
      persisted.tvMenuStyle = cafe.tvMenuStyle ?? settings.tvMenuStyle;
      setSettings(persisted);
      setSavedSettings(persisted);
      setMessage('Configuration publiée sur l’expérience client.');
    } catch {
      setMessage('Impossible d’enregistrer la configuration.');
    } finally {
      setSaving(false);
    }
  };

  const applyMenuOnly = () => setSettings((current) => ({
    orderingEnabled: false,
    waiterCallsEnabled: false,
    gamesEnabled: false,
    ambianceVotingEnabled: false,
    rewardsEnabled: false,
    tvMenuEnabled: false,
    tvMenuStyle: current.tvMenuStyle,
  }));

  const copyTvUrl = async () => {
    await navigator.clipboard.writeText(tvUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-panel rounded-3xl border border-white/[0.08] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-orange-500/15 border border-orange-500/25 text-orange-300 flex items-center justify-center">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Expérience activée</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{activeCount} module{activeCount !== 1 ? 's' : ''} actif{activeCount !== 1 ? 's' : ''} sur 6</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={applyMenuOnly} className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[11px] font-bold text-gray-300 hover:bg-white/[0.08]">
            Mode menu uniquement
          </button>
          <button onClick={() => setSettings(DEFAULT_SETTINGS)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[11px] font-bold text-gray-300 hover:bg-white/[0.08]">
            Tout activer
          </button>
          <button disabled={!dirty || saving} onClick={save} className="rounded-xl bg-orange-500 px-4 py-2 text-[11px] font-black text-white shadow-lg shadow-orange-500/20 disabled:opacity-40 flex items-center gap-1.5">
            <Save className="h-3.5 w-3.5" /> {saving ? 'Enregistrement…' : 'Publier'}
          </button>
        </div>
      </div>

      {message && <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-gray-200">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {FEATURES.map((feature) => {
          const enabled = settings[feature.key];
          return (
            <button
              key={feature.key}
              disabled={loading}
              onClick={() => setSettings((current) => ({ ...current, [feature.key]: !enabled }))}
              className={`rounded-2xl border p-4 text-left transition-all ${enabled ? 'border-emerald-500/25 bg-emerald-500/[0.06]' : 'border-white/[0.07] bg-white/[0.025]'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white">{feature.title}</h3>
                    <span className={`text-[9px] font-black uppercase tracking-wider ${enabled ? 'text-emerald-300' : 'text-gray-500'}`}>{enabled ? 'Actif' : 'Masqué'}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">{feature.description}</p>
                </div>
                <span className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <section className="glass-panel rounded-3xl border border-white/[0.08] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">Direction Smart TV</p>
            <h3 className="mt-1 text-base font-black text-white">Choisissez l'identité de votre menu</h3>
            <p className="mt-1 text-[11px] text-gray-400">Chaque direction s'adapte automatiquement de 3 à 100 produits.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold text-gray-300">{settings.tvMenuStyle === 'ELEGANT' ? 'Élégant' : settings.tvMenuStyle === 'ESPRESSO' ? 'Espresso' : 'Urbain'}</span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {TV_STYLES.map((style) => {
            const selected = settings.tvMenuStyle === style.key;
            return (
              <button
                key={style.key}
                disabled={loading}
                onClick={() => setSettings((current) => ({ ...current, tvMenuStyle: style.key }))}
                className={`group overflow-hidden rounded-2xl border text-left transition ${selected ? 'border-orange-400 ring-2 ring-orange-500/20' : 'border-white/[0.08] hover:border-white/25'}`}
              >
                <div className={`relative h-32 overflow-hidden p-4 ${style.previewClass}`}>
                  {style.key === 'ELEGANT' && <>
                    <div className="absolute inset-y-3 left-4 w-14 rounded-xl border border-[#8d6a36]/50 bg-[#f8f0df]/90" />
                    <div className="absolute left-[5.2rem] right-4 top-5 h-3 border-b border-[#6d4828]/50" />
                    <div className="absolute left-[5.2rem] right-4 top-12 grid grid-cols-3 gap-2"><i className="h-12 rounded-md bg-[#f6ecda]/90" /><i className="h-12 rounded-md bg-[#f6ecda]/80" /><i className="h-12 rounded-md bg-[#f6ecda]/90" /></div>
                  </>}
                  {style.key === 'ESPRESSO' && <>
                    <div className="absolute left-4 right-4 top-5 h-px bg-[#d6a963]/60" />
                    <div className="absolute left-4 right-4 top-8 grid grid-cols-2 gap-2"><i className="h-9 rounded bg-[#382217]" /><i className="h-9 rounded bg-[#382217]" /></div>
                    <div className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-1.5"><i className="h-7 rounded bg-[#d19b52]/40" /><i className="h-7 rounded bg-[#d19b52]/30" /><i className="h-7 rounded bg-[#d19b52]/40" /><i className="h-7 rounded bg-[#d19b52]/30" /></div>
                  </>}
                  {style.key === 'URBAN' && <>
                    <div className="absolute left-4 top-4 h-3 w-24 bg-[#f8c947]" />
                    <div className="absolute right-4 top-4 h-3 w-12 bg-white" />
                    <div className="absolute inset-x-4 top-10 grid grid-cols-3 gap-2"><i className="h-16 bg-[#2b2b24]" /><i className="h-16 bg-[#f8c947]" /><i className="h-16 bg-[#2b2b24]" /></div>
                  </>}
                  <span className={`relative text-[9px] font-black tracking-[0.2em] ${style.textClass}`}>{style.eyebrow}</span>
                  {selected && <span className="absolute bottom-3 right-3 rounded-full bg-orange-500 px-2 py-1 text-[9px] font-black text-white">ACTIF</span>}
                </div>
                <div className="bg-[#11131a] p-4">
                  <h4 className="text-sm font-extrabold text-white">{style.title}</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{style.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="glass-panel rounded-3xl border border-white/[0.08] p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 flex items-center justify-center"><Monitor className="h-5 w-5" /></div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-white">Lien Smart TV</h3>
            <p className="text-[11px] text-gray-400 truncate max-w-xl">{tvUrl}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={copyTvUrl} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-gray-200 flex items-center gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copié' : 'Copier'}
          </button>
          <a href={tvUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-[11px] font-bold text-sky-200 flex items-center gap-1.5">
            Ouvrir <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
