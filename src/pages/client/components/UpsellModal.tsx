import React, { useState } from 'react';
import { Sparkles, Plus, Check, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '../../../types';
import { useCart } from '../../../context/CartContext';

interface UpsellModalProps {
  sourceProduct: Product;
  isOpen: boolean;
  onClose: () => void;
  onViewCart?: () => void;
}

export const UpsellModal: React.FC<UpsellModalProps> = ({
  sourceProduct,
  isOpen,
  onClose,
  onViewCart,
}) => {
  const { addToCart } = useCart();
  const [addedProductIds, setAddedProductIds] = useState<string[]>([]);

  if (!isOpen || !sourceProduct.suggestedProducts || sourceProduct.suggestedProducts.length === 0) {
    return null;
  }

  const handleAddSuggested = (product: Product) => {
    addToCart(product, {}, 1);
    setAddedProductIds((prev) => [...prev, product.id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay p-0 sm:p-4 animate-fadeIn">
      {/* Bottom Sheet Modal container */}
      <div className="w-full max-w-lg bg-[#0d0f18]/95 backdrop-blur-2xl border-t sm:border border-white/[0.1] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-slideUp text-white relative max-h-[85vh] overflow-y-auto">
        {/* Handle indicator for mobile feel */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto sm:hidden mb-1" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl border border-amber-500/30 text-amber-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                Offre Spéciale
              </span>
              <h3 className="text-base font-black text-white tracking-tight">
                Parfait avec votre <span className="text-amber-300">{sourceProduct.name}</span> !
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-gray-400 font-medium">
          Complétez votre dégustation avec l'une de nos suggestions populaires en 1-Tap :
        </p>

        {/* Suggestions List */}
        <div className="space-y-3">
          {sourceProduct.suggestedProducts.map((product) => {
            const isAdded = addedProductIds.includes(product.id);
            return (
              <div
                key={product.id}
                className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                  isAdded
                    ? 'bg-emerald-500/[0.08] border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'bg-white/[0.03] border-white/[0.06] hover:border-orange-500/30 hover:bg-white/[0.05]'
                }`}
              >
                {/* Thumbnail & Info */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/[0.05] border border-white/[0.08] flex-shrink-0 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🥐</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-white truncate">{product.name}</h4>
                    <span className="text-xs font-extrabold text-amber-300 block mt-0.5">
                      +{Number(product.price).toFixed(3)} <span className="text-[10px] text-gray-400 font-normal">TND</span>
                    </span>
                  </div>
                </div>

                {/* 1-Tap Add Button */}
                <button
                  onClick={() => handleAddSuggested(product)}
                  disabled={isAdded}
                  className={`px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all duration-300 flex items-center space-x-1.5 flex-shrink-0 active:scale-95 ${
                    isAdded
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Ajouté !</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Ajouter (+{Number(product.price).toFixed(3)})</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 font-bold text-xs rounded-2xl border border-white/[0.08] transition-all"
          >
            Continuer le menu
          </button>

          {onViewCart && (
            <button
              onClick={() => {
                onClose();
                onViewCart();
              }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Voir Panier</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
