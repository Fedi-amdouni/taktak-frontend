import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Send, MapPin, ShoppingBag, Sparkles, Dices } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useTableSession } from '../../context/TableSessionContext';
import { api } from '../../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId: string) => void;
  onOpenRoulette: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  onOpenRoulette,
}) => {
  const { cart, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { currentCafeSlug, currentTableNumber, setActiveOrderId } = useTableSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const order = await api.createOrder({
        cafeSlug: currentCafeSlug,
        tableNumber: currentTableNumber,
        totalPrice,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          selectedOptions: item.selectedOptions,
          notes: item.notes,
        })),
      });

      setActiveOrderId(order.id);
      clearCart();
      onOrderCreated(order.id);
      onClose();
    } catch (err) {
      alert('Erreur lors de la validation de la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0d0f18] border border-white/[0.06] rounded-t-[28px] sm:rounded-[28px] max-h-[88vh] flex flex-col shadow-2xl animate-slideUp relative" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto my-2 sm:hidden cursor-pointer" onClick={onClose} />
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/[0.08] flex items-center justify-center">
              <ShoppingBag className="w-4.5 h-4.5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-white tracking-tight">Mon Panier</h2>
              <p className="text-[10px] text-gray-500 font-medium">{cart.length} article{cart.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/[0.04] text-gray-500 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Confirmation Bar */}
        <div className="bg-gradient-to-r from-orange-500/[0.06] to-amber-500/[0.04] border-b border-orange-500/10 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-orange-300/80 font-medium">
            <MapPin className="w-3.5 h-3.5 text-orange-400/60" />
            <span>Commande attribuée à :</span>
          </div>
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-[11px] px-3 py-1 rounded-full shadow-sm shadow-orange-500/20">
            Table {currentTableNumber < 10 ? `0${currentTableNumber}` : currentTableNumber}
          </span>
        </div>

        <button onClick={onOpenRoulette} className="mx-4 mt-3 flex items-center justify-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 py-2.5 text-xs font-extrabold text-amber-200 transition hover:bg-amber-400/20">
          <Dices className="w-4 h-4" /> Chkoun ykhalles ?
        </button>

        {/* Items List */}
        <div className="px-4 py-3 flex-1 overflow-y-auto space-y-2.5 no-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center py-14">
              <ShoppingBag className="w-14 h-14 text-gray-800 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">Votre panier est vide</p>
              <p className="text-xs text-gray-600 mt-1">Ajoutez des produits depuis le menu</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={item.id}
                className="glass-panel p-3.5 rounded-2xl flex items-center space-x-3 animate-fadeIn"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Image */}
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/[0.06]"
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-100 truncate">{item.productName}</h4>
                  {item.notes && (
                    <p className="text-[10px] text-amber-400/60 truncate mt-0.5 italic">{item.notes}</p>
                  )}
                  <p className="text-xs font-extrabold mt-1">
                    <span className="gradient-text">{(item.unitPrice * item.quantity).toFixed(3)}</span>
                    <span className="text-[10px] text-gray-600 ml-1">TND</span>
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white transition-all active:scale-90"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-[11px] font-extrabold text-white w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-all active:scale-90 shadow-sm shadow-orange-500/20"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Submit */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-white/[0.04] space-y-3.5" style={{ background: 'linear-gradient(180deg, rgba(13, 15, 24, 0) 0%, rgba(13, 15, 24, 1) 30%)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total</span>
              <span className="text-lg font-extrabold">
                <span className="gradient-text">{totalPrice.toFixed(3)}</span>
                <span className="text-xs text-gray-500 ml-1.5">TND</span>
              </span>
            </div>

            <button
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center space-x-2.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm">{isSubmitting ? 'Envoi en cours...' : `Envoyer en cuisine`}</span>
              <Sparkles className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
