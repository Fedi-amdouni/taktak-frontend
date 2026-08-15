import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ExternalLink,
  Gift,
  MailCheck,
  Star,
  X,
  Sparkles,
  Copy,
  Check,
  Trophy,
  ChevronRight,
  ShieldCheck,
  Flame,
  ArrowRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { api } from '../../../services/api';
import { CouponReward, RewardCampaign, RewardOption } from '../../../types';

interface FeedbackRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeSlug: string;
  orderId: string | null;
}

const SLICE_COLORS = [
  '#f97316', // Orange
  '#eab308', // Amber / Gold
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#3b82f6', // Blue
];

export const FeedbackRewardModal: React.FC<FeedbackRewardModalProps> = ({
  isOpen,
  onClose,
  cafeSlug,
  orderId,
}) => {
  // Steps: 'RATING_GATE' -> 'EMAIL_AND_WHEEL' -> 'SPINNING' -> 'WON'
  const [step, setStep] = useState<'RATING_GATE' | 'EMAIL_AND_WHEEL' | 'SPINNING' | 'WON'>('RATING_GATE');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [campaign, setCampaign] = useState<RewardCampaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reward, setReward] = useState<CouponReward | null>(null);
  const [copied, setCopied] = useState(false);

  const wheelRef = useRef<SVGSVGElement | null>(null);

  // Fetch campaign info on open
  useEffect(() => {
    if (isOpen) {
      api.getRewardCampaign(cafeSlug)
        .then((res) => {
          setCampaign(res);
        })
        .catch(() => {});
      // Reset flow
      setStep('RATING_GATE');
      setRating(5);
      setComment('');
      setReward(null);
      setCopied(false);
    }
  }, [isOpen, cafeSlug]);

  const activeOptions = useMemo<RewardOption[]>(() => {
    if (!campaign || !campaign.options) return [];
    return campaign.options.filter((o) => o.enabled);
  }, [campaign]);

  // Compute SVG slice paths with STRICTLY EQUAL VISUAL SPACING
  const slices = useMemo(() => {
    if (activeOptions.length === 0) return [];
    const count = activeOptions.length;
    const angle = 360 / count; // Equal visual angle for every slice

    return activeOptions.map((option, idx) => {
      const startAngle = idx * angle;
      const endAngle = startAngle + angle;
      const midAngle = startAngle + angle / 2;

      const r = 140;
      const cx = 150;
      const cy = 150;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;
      const midRad = ((midAngle - 90) * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      const textRadius = r * 0.62;
      const textX = cx + textRadius * Math.cos(midRad);
      const textY = cy + textRadius * Math.sin(midRad);

      return {
        option,
        idx,
        color: SLICE_COLORS[idx % SLICE_COLORS.length],
        pathData,
        startAngle,
        endAngle,
        midAngle,
        textX,
        textY,
        angle,
      };
    });
  }, [activeOptions]);

  if (!isOpen) return null;

  const effectiveOrderId =
    orderId ||
    (localStorage.getItem('taktak_guest_feedback_order_id') ||
      (() => {
        const gen = 'guest-' + Math.random().toString(36).substring(2, 9);
        try {
          localStorage.setItem('taktak_guest_feedback_order_id', gen);
        } catch {}
        return gen;
      })());

  const googleLink =
    campaign?.googleReviewUrl && campaign.googleReviewUrl.trim().length > 0
      ? campaign.googleReviewUrl
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafeSlug.replace(/-/g, ' '))}`;

  // Action: User clicked Google Review button -> Open Google Maps and unlock the wheel
  const handleOpenGoogleReview = () => {
    window.open(googleLink, '_blank', 'noopener,noreferrer');
    // Direct transition to wheel step after opening Google
    setTimeout(() => {
      setStep('EMAIL_AND_WHEEL');
    }, 300);
  };

  // Action: Advance to wheel directly (when low rating feedback is submitted)
  const handleProceedToWheel = () => {
    setStep('EMAIL_AND_WHEEL');
  };

  // Action: Submit email, draw prize from server and spin the wheel
  const handleSpinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      alert('Veuillez saisir une adresse email valide pour recevoir votre coupon.');
      return;
    }

    setLoading(true);
    try {
      const won = await api.submitRewardFeedback(cafeSlug, {
        orderId: effectiveOrderId,
        rating,
        comment,
        email: email.trim(),
      });
      setReward(won);
      localStorage.setItem(`taktak_feedback_${effectiveOrderId}`, '1');

      // Start spinning animation
      setStep('SPINNING');

      // Calculate slice angle based on strictly equal visible slices
      let winningIndex = slices.findIndex(
        (s) =>
          s.option.label.toLowerCase() === won.rewardLabel.toLowerCase() ||
          Number(s.option.discountPercent) === Number(won.discountPercent)
      );
      if (winningIndex === -1) winningIndex = 0;

      const winningSlice = slices[winningIndex] || slices[0];
      const sliceMid = winningSlice ? winningSlice.midAngle : 0;

      const extraFullSpins = (5 + Math.floor(Math.random() * 3)) * 360;
      const targetOffset = (360 - sliceMid) % 360;
      const finalRotation = rotation + extraFullSpins + targetOffset;

      setRotation(finalRotation);

      setTimeout(() => {
        setStep('WON');
      }, 3900);
    } catch (err: any) {
      alert(
        `Cet email a peut-être déjà participé pendant les ${
          campaign?.participationCooldownDays || 30
        } derniers jours, ou l'adresse est invalide.`
      );
    } finally {
      setLoading(false);
    }
  };

  const copyCouponCode = () => {
    if (reward?.code) {
      navigator.clipboard.writeText(reward.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5:
        return '🤩 Exceptionnel ! Un pur régal';
      case 4:
        return '😊 Très bon moment, merci !';
      case 3:
        return '😐 Correct / Standard';
      case 2:
        return '😕 Peut faire mieux';
      case 1:
        return '😞 Décevant';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fadeIn transition-all">
      <div className="w-full max-w-md rounded-t-[32px] sm:rounded-[32px] border border-white/10 bg-[#0e111a] text-white shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col animate-slideUp sm:animate-scaleUp">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#121624]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Expérience & Roulette VIP</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Cadeaux 🎁
                </span>
              </h2>
              <p className="text-[10px] text-gray-400 font-medium">Votre fidélité récompensée à chaque visite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto no-scrollbar flex-1 space-y-5">
          {/* ========================================================================= */}
          {/* STEP 1: RATING & DIRECT GOOGLE MAPS GATE */}
          {/* ========================================================================= */}
          {step === 'RATING_GATE' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Star Rating Header */}
              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-white">Comment s'est passée votre visite ?</h3>
                <p className="text-xs text-gray-400">
                  Évaluez votre expérience pour débloquer la Roulette VIP !
                </p>
              </div>

              {/* Star Selector */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center space-y-2">
                <div className="flex justify-center items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform duration-200 active:scale-95 focus:outline-none"
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                            : 'text-gray-700 hover:text-gray-500'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-amber-300">{getRatingLabel(rating)}</p>
              </div>

              {/* BRANCH A: 4 OR 5 STARS -> PROMINENT MANDATORY GOOGLE MAPS REVIEW ACTION */}
              {rating >= 4 ? (
                <div className="space-y-4 animate-scaleUp">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-blue-600/15 border border-blue-500/40 text-center space-y-3 shadow-lg">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mx-auto text-blue-300">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white">
                        Débloquez la Roulette VIP avec votre avis 5★ !
                      </h4>
                      <p className="text-[11px] text-gray-300 leading-relaxed">
                        Pour vous remercier de votre avis sur Google Maps, nous vous débloquons un tour de roulette pour tenter de gagner jusqu'à <strong className="text-amber-300 font-black">-50% ou des cadeaux</strong> !
                      </p>
                    </div>

                    {/* MAIN EXCLUSIVE CTA: DIRECT GOOGLE REVIEW BUTTON */}
                    <button
                      onClick={handleOpenGoogleReview}
                      className="w-full py-4 bg-white hover:bg-gray-100 text-gray-900 font-black text-xs rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center space-x-2.5 transition-all duration-300 active:scale-95 group"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.37 7.36 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.27 2.63 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span>Publier mon avis sur Google (Ouvre Google Maps)</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-900" />
                    </button>
                  </div>
                </div>
              ) : (
                /* BRANCH B: 1, 2 OR 3 STARS -> PRIVATE INTERNAL RECLAMATION (PROTECTS GOOGLE REPUTATION & SAVES TO DB) */
                <div className="space-y-4 animate-scaleUp">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-black text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Formulaire de Réclamation & Remarque Privée</span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      Nous sommes navrés pour cette expérience. Votre réclamation est enregistrée directement dans notre base interne pour la direction du café afin d'améliorer notre service.
                    </p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Décrivez votre réclamation ou le problème rencontré..."
                      className="w-full bg-[#111420] text-xs text-white p-3 rounded-xl border border-white/[0.08] focus:border-orange-500/50 outline-none resize-none h-20 transition-all mt-1 placeholder:text-gray-500"
                    />
                  </div>

                  <button
                    onClick={handleProceedToWheel}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <span>Enregistrer ma Réclamation & Débloquer la Roulette</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: EMAIL INPUT & INTERACTIVE ROULETTE (EQUAL VISUAL SLICES) */}
          {/* ========================================================================= */}
          {(step === 'EMAIL_AND_WHEEL' || step === 'SPINNING') && (
            <form onSubmit={handleSpinSubmit} className="space-y-4 text-center animate-scaleUp">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full text-[11px] font-black border border-amber-500/30">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Votre Roulette VIP est Débloquée !</span>
                </div>
                <h3 className="text-base font-extrabold text-white">Prêt à remporter votre gain ?</h3>
              </div>

              {/* Email Input Field (Required before spin) */}
              <div className="space-y-1 text-left bg-white/[0.03] border border-white/[0.06] p-3.5 rounded-2xl">
                <label className="text-[11px] font-bold text-gray-300 flex items-center justify-between">
                  <span>Votre e-mail pour recevoir le coupon gagné *</span>
                  <span className="text-[10px] text-gray-500 font-normal">Sécurisé</span>
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  disabled={step === 'SPINNING'}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre-email@gmail.com"
                  className="w-full bg-[#111420] text-xs text-white px-3.5 py-3 rounded-xl border border-white/[0.08] focus:border-orange-500/50 outline-none transition-all disabled:opacity-50"
                />
              </div>

              {/* SVG WHEEL CONTAINER (STRICTLY EQUAL VISUAL SLICES) */}
              <div className="relative mx-auto w-[270px] h-[270px] flex items-center justify-center my-1">
                {/* Top Golden Pointer */}
                <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                  <div className="w-0 h-0 border-x-[14px] border-t-[26px] border-x-transparent border-t-amber-400 drop-shadow-[0_4px_12px_rgba(251,191,36,0.8)]" />
                  <div className="w-2.5 h-2.5 bg-white rounded-full -mt-5 shadow-sm" />
                </div>

                {/* The Rotating Wheel SVG */}
                <div
                  className="w-[260px] h-[260px] rounded-full shadow-[0_0_35px_rgba(249,115,22,0.3)] border-4 border-amber-400/40 p-1 bg-[#090b12]"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition:
                      step === 'SPINNING'
                        ? 'transform 3.8s cubic-bezier(0.12, 0.9, 0.18, 1)'
                        : 'none',
                  }}
                >
                  <svg
                    ref={wheelRef}
                    viewBox="0 0 300 300"
                    className="w-full h-full rounded-full overflow-hidden"
                  >
                    {slices.map((slice) => (
                      <g key={slice.idx}>
                        <path
                          d={slice.pathData}
                          fill={slice.color}
                          stroke="#090b12"
                          strokeWidth="2"
                        />
                        <g
                          transform={`translate(${slice.textX}, ${slice.textY}) rotate(${
                            slice.midAngle + 90
                          })`}
                        >
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ffffff"
                            fontSize={slice.angle < 45 ? '10' : '11'}
                            fontWeight="900"
                            style={{
                              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                              letterSpacing: '-0.5px',
                            }}
                          >
                            {slice.option.discountPercent > 0
                              ? `-${slice.option.discountPercent}%`
                              : slice.option.label}
                          </text>
                        </g>
                      </g>
                    ))}

                    {/* Outer Gold Dots */}
                    {Array.from({ length: 16 }).map((_, i) => {
                      const dotAngle = (i * 360) / 16;
                      const rad = ((dotAngle - 90) * Math.PI) / 180;
                      const dx = 150 + 143 * Math.cos(rad);
                      const dy = 150 + 143 * Math.sin(rad);
                      return (
                        <circle
                          key={i}
                          cx={dx}
                          cy={dy}
                          r="2.5"
                          fill="#fef08a"
                          className="animate-pulse"
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Central Center Hub */}
                <div className="absolute inset-[38%] rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-950 border-4 border-amber-400 shadow-2xl flex items-center justify-center pointer-events-none z-20">
                  <span className="text-xs font-black text-amber-300 drop-shadow-md">TAK★TAK</span>
                </div>
              </div>

              {/* Prize Legend (WITHOUT revealing backend probabilities to users) */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500">
                  Récompenses à remporter :
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {slices.map((slice) => (
                    <span
                      key={slice.idx}
                      className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-xl text-white shadow-sm border border-white/10"
                      style={{ backgroundColor: slice.color }}
                    >
                      <span>{slice.option.label}</span>
                      {slice.option.discountPercent > 0 && (
                        <span className="bg-black/30 px-1.5 py-0.2 rounded-md text-[9px] text-amber-200">
                          -{slice.option.discountPercent}%
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Spin CTA Button */}
              {step === 'EMAIL_AND_WHEEL' && (
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/30 flex items-center justify-center space-x-2 transition-all duration-300 active:scale-95 animate-bounce disabled:opacity-50"
                >
                  {loading ? (
                    <span>Tirage du gain sécurisé...</span>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-yellow-200" />
                      <span>🎰 TOURNER LA ROULETTE MAINTENANT !</span>
                    </>
                  )}
                </button>
              )}

              {step === 'SPINNING' && (
                <div className="py-3 text-sm font-black text-amber-400 flex items-center justify-center gap-2">
                  <span className="animate-spin text-lg">⚙️</span>
                  <span>Tirage du gain en cours... Bonne chance !</span>
                </div>
              )}
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: CELEBRATION & PRIZE CLAIM */}
          {/* ========================================================================= */}
          {step === 'WON' && reward && (
            <div className="space-y-4 text-center animate-scaleUp py-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/20 animate-bounce">
                <Trophy className="w-9 h-9 text-white" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                  🎉 FÉLICITATIONS !
                </span>
                <h3 className="text-2xl font-black text-white">{reward.rewardLabel}</h3>
                {reward.discountPercent > 0 && (
                  <p className="text-xs text-emerald-400 font-extrabold">
                    Réduction immédiate de {reward.discountPercent}% sur votre commande
                  </p>
                )}
              </div>

              {/* Direct Promo Code Box with 1-click copy */}
              {reward.code ? (
                <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/15 border-2 border-dashed border-orange-500/40 rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Votre Code Promo Unique :
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl font-mono font-black text-amber-300 tracking-wider select-all">
                      {reward.code}
                    </span>
                    <button
                      onClick={copyCouponCode}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md transition-all active:scale-90"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Saisissez ce code dans votre panier lors de votre commande pour appliquer la réduction.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <p className="text-xs text-emerald-300 font-bold">
                    Votre coupon a été enregistré avec succès !
                  </p>
                </div>
              )}

              {/* Email Confirmation Card */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-left flex items-start space-x-3">
                <MailCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-gray-200">Envoyé à votre adresse e-mail ({email})</p>
                  <p className="text-[11px] text-gray-400">
                    Conservez votre e-mail pour retrouver votre code promo à tout moment.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 font-bold text-xs rounded-xl transition-all"
              >
                Fermer et retourner au menu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
