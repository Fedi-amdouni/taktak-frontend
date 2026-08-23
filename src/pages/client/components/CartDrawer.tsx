import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Send, MapPin, ShoppingBag, Sparkles, TicketCheck, ArrowRight, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { CouponValidation, CreateOrderPayload } from '../../../types';
import { useCart } from '../../../context/CartContext';
import { useTableSession } from '../../../context/TableSessionContext';
import { api } from '../../../services/api';
import { formatPrice } from '../../../utils/formatPrice';
import { clearPendingOrderId, getOrCreateParticipantId, getOrCreatePendingOrderId } from '../../../utils/clientIdentity';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId: string) => void;
  onOpenRoulette: () => void;
  gamesEnabled?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  onOpenRoulette,
  gamesEnabled = true,
}) => {
  const { cart, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { currentCafeSlug, currentTableNumber, setActiveOrderId } = useTableSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<'location' | 'transmission'>('transmission');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const preparedOrderRef = React.useRef<CreateOrderPayload | null>(null);
  const [couponCode, setCouponCode] = useState(() => new URLSearchParams(window.location.search).get('coupon') || '');
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !submissionError) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, submissionError, onClose]);

  if (!isOpen) return null;

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.validateCoupon(currentCafeSlug, couponCode.trim(), totalPrice);
      setCoupon(res);
    } catch {
      setCoupon(null);
      alert('Coupon invalide, expiré, déjà utilisé ou montant minimum non atteint.');
    } finally {
      setCouponLoading(false);
    }
  };

  const transmitOrder = async (payload: CreateOrderPayload) => {
    setSubmissionStage('transmission');
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const order = await api.createOrder(payload);

      clearPendingOrderId(payload.cafeSlug, payload.tableNumber);
      preparedOrderRef.current = null;
      setActiveOrderId(order.id);
      clearCart();
      onOrderCreated(order.id);
      onClose();
    } catch {
      setSubmissionError(
        'Nous ne pouvons pas encore confirmer la réception. Votre panier est conservé : réessayez sans risque de créer un doublon.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting || submissionError) return;

    setIsSubmitting(true);
    setSubmissionStage('location');

    let clientLat: number | undefined = undefined;
    let clientLng: number | undefined = undefined;

    // 1. Vérifier si le client est déjà connecté au WiFi officiel du café
    let isAlreadyOnWifi = false;
    try {
      isAlreadyOnWifi = await api.checkCafeWifi(currentCafeSlug);
    } catch {
      isAlreadyOnWifi = false;
    }

    // 2. Hors du WiFi officiel, attendre le choix explicite du client dans
    // la popup du navigateur. Sans timeout, la commande ne part ni avant
    // « Autoriser », ni avant « Refuser ».
    if (!isAlreadyOnWifi && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 60000,
          });
        });
        clientLat = position.coords.latitude;
        clientLng = position.coords.longitude;
      } catch {
        // Le refus est un choix valide : la commande passe alors comme présence non vérifiée.
      }
    }

    const cartSignature = JSON.stringify({
      cafeSlug: currentCafeSlug,
      tableNumber: currentTableNumber,
      totalPrice,
      couponCode: coupon?.code,
      items: cart.map(({ productId, quantity, unitPrice, selectedOptions, notes }) => ({
        productId,
        quantity,
        unitPrice,
        selectedOptions,
        notes,
      })),
    });

    const payload: CreateOrderPayload = {
        cafeSlug: currentCafeSlug,
        tableNumber: currentTableNumber,
        participantId: getOrCreateParticipantId(),
        clientOrderId: getOrCreatePendingOrderId(currentCafeSlug, currentTableNumber, cartSignature),
        totalPrice,
        couponCode: coupon?.code,
        clientLatitude: clientLat,
        clientLongitude: clientLng,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          selectedOptions: item.selectedOptions,
          notes: item.notes,
        })),
      };

    preparedOrderRef.current = payload;
    await transmitOrder(payload);
  };

  const retryOrder = async () => {
    if (isSubmitting || !preparedOrderRef.current) return;
    await transmitOrder(preparedOrderRef.current);
  };

  const finalAmount = coupon?.finalAmount ?? totalPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay animate-fadeIn" onClick={() => {
      if (!isSubmitting && !submissionError) onClose();
    }}>
      <div className="w-full max-w-md bg-[#0a0d16] border border-white/[0.08] rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] flex flex-col shadow-2xl animate-slideUp relative" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto my-2.5 sm:hidden cursor-pointer" onClick={onClose} />

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/[0.12] border border-orange-500/25 flex items-center justify-center">
              <ShoppingBag className="w-4.5 h-4.5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-white tracking-tight">Mon Panier</h2>
              <p className="text-[10px] text-gray-400 font-semibold">{cart.length} article{cart.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting || Boolean(submissionError)}
            aria-label="Fermer le panier"
            className="p-2 bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all duration-300"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Table Confirmation Bar */}
        <div className="bg-gradient-to-r from-orange-500/[0.08] via-amber-500/[0.05] to-transparent border-b border-orange-500/15 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-orange-300/90 font-bold">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span>Service en salle :</span>
          </div>
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[11px] px-3 py-1 rounded-full shadow-sm shadow-orange-500/20">
            Table {currentTableNumber < 10 ? `0${currentTableNumber}` : currentTableNumber}
          </span>
        </div>

        {gamesEnabled && <div className="px-4 pt-3">
          <button
            onClick={onOpenRoulette}
            className="w-full flex items-center justify-between gap-2.5 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-3 text-xs font-black text-amber-200 transition-all hover:bg-amber-400/20 hover:border-amber-400/50 shadow-md group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-base flex-shrink-0 group-hover:rotate-12 transition-transform">
                🎯
              </span>
              <div className="text-left">
                <span className="block text-xs font-black text-white">Chkoun ykhalles ?</span>
                <span className="text-[10px] text-amber-300/80 font-medium">Tirez au sort qui paie la note</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>}

        {/* Items List */}
        <div className="px-4 py-3 flex-1 overflow-y-auto space-y-2.5 no-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center py-14 space-y-2">
              <ShoppingBag className="w-14 h-14 text-gray-700 mx-auto" />
              <p className="text-sm font-black text-gray-400">Votre panier est vide</p>
              <p className="text-xs text-gray-600">Sélectionnez vos cafés, boissons ou desserts préférés !</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={item.id}
                className="glass-panel p-3 rounded-2xl flex items-center space-x-3 animate-fadeIn"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Image */}
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/[0.08]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center text-orange-400 text-lg">
                    ☕
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-gray-100 truncate">{item.productName}</h4>
                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">
                      {Object.values(item.selectedOptions).join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-[10px] text-amber-400/80 truncate mt-0.5 italic">{item.notes}</p>
                  )}
                  <p className="text-xs font-black mt-1">
                    <span className="gradient-text">{formatPrice(item.unitPrice * item.quantity)}</span>
                    <span className="text-[10px] text-gray-500 ml-1 font-semibold">TND</span>
                  </p>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center space-x-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white transition-all active:scale-90"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-[11px] font-black text-white w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center justify-center text-white transition-all active:scale-90 shadow-sm shadow-orange-500/20"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Section */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-white/[0.06] space-y-3.5" style={{ background: 'linear-gradient(180deg, rgba(10, 13, 22, 0) 0%, rgba(10, 13, 22, 1) 30%)' }}>
            {/* Coupon input */}
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCoupon(null);
                }}
                placeholder="Code coupon (Ex: PROMO10)"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs uppercase tracking-wider text-white placeholder:text-gray-500 outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={validateCoupon}
                disabled={couponLoading}
                className="rounded-xl border border-amber-400/30 bg-amber-400/15 hover:bg-amber-400/25 px-3.5 text-xs font-black text-amber-300 transition-all flex items-center gap-1 active:scale-95"
              >
                <TicketCheck className="h-4 w-4" />
                {couponLoading ? '…' : 'Appliquer'}
              </button>
            </div>

            {coupon && (
              <div className="flex justify-between items-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-300">
                <span>{coupon.rewardLabel}</span>
                <span>-{formatPrice(coupon.discountAmount)} TND</span>
              </div>
            )}

            {/* Total Row */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Commande</span>
              <span className="text-lg font-black">
                <span className="gradient-text">{formatPrice(finalAmount)}</span>
                <span className="text-xs text-gray-500 ml-1.5 font-semibold">TND</span>
              </span>
            </div>

            {/* Order Confirmation CTA */}
            <button
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
              className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm">{isSubmitting ? 'Transmission en cuisine…' : 'Envoyer la commande en cuisine'}</span>
              <Sparkles className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        )}
      </div>

      {(isSubmitting || submissionError) && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#05070d]/80 p-6 backdrop-blur-md animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-transmission-title"
          aria-describedby="order-transmission-description"
        >
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#0a0d16]/95 p-7 text-center shadow-2xl shadow-black/60">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/25 bg-orange-500/10">
              {isSubmitting ? (
                <LoaderCircle className="h-8 w-8 animate-spin text-orange-400" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-amber-300" />
              )}
            </div>
            <h2 id="order-transmission-title" className="text-lg font-black text-white">
              {isSubmitting
                ? submissionStage === 'location'
                  ? 'Vérification de présence…'
                  : 'Confirmation en cours…'
                : 'Confirmation interrompue'}
            </h2>
            <p id="order-transmission-description" className="mt-3 text-sm leading-6 text-gray-300" aria-live="polite">
              {isSubmitting
                ? submissionStage === 'location'
                  ? 'Veuillez autoriser ou refuser la localisation dans la fenêtre du navigateur. La commande attend votre choix.'
                  : 'Gardez cette page ouverte. Nous attendons la confirmation de la cuisine.'
                : submissionError}
            </p>
            {!isSubmitting && submissionError && (
              <button
                type="button"
                onClick={retryOrder}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-transform active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" />
                Vérifier et réessayer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
