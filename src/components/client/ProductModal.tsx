import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, MessageSquare, Sparkles, Star, Layers, UtensilsCrossed } from 'lucide-react';
import { Product, ProductBadge, ProductOptionGroup, ComboSlot } from '../../types';

interface ProductModalProps {
  product: Product | null;
  allProducts?: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, selectedOptions: Record<string, string>, quantity: number, notes?: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  allProducts = [],
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  // Parse option groups
  const optionGroups: ProductOptionGroup[] = Array.isArray(product.optionsJson)
    ? product.optionsJson
    : typeof product.optionsJson === 'string'
    ? JSON.parse(product.optionsJson || '[]')
    : [];

  // Parse combo slots
  const comboSlots: ComboSlot[] = Array.isArray(product.comboSlotsJson)
    ? product.comboSlotsJson
    : typeof product.comboSlotsJson === 'string'
    ? JSON.parse(product.comboSlotsJson || '[]')
    : [];

  const isCombo = product.isCombo || comboSlots.length > 0;

  // Default option choices
  const initialOptions: Record<string, string> = {};
  optionGroups.forEach((group) => {
    if (group.choices && group.choices.length > 0) {
      initialOptions[group.name] = group.choices[0];
    }
  });

  // Default combo selections (pick first available product for each slot)
  const initialComboSelections: Record<string, string[]> = {};
  comboSlots.forEach((slot) => {
    const slotProducts = allProducts.filter(
      (p) => p.categoryId === slot.categoryId && p.isAvailable && p.id !== product.id
    );
    if (slotProducts.length > 0) {
      // Pick first N products depending on requiredQuantity
      const req = Math.min(slot.requiredQuantity || 1, slotProducts.length);
      initialComboSelections[slot.id] = slotProducts.slice(0, req).map((p) => p.name);
    } else {
      initialComboSelections[slot.id] = [];
    }
  });

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(initialOptions);
  const [comboSelections, setComboSelections] = useState<Record<string, string[]>>(initialComboSelections);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setSelectedOptions(initialOptions);
    setComboSelections(initialComboSelections);
    setQuantity(1);
    setNotes('');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product?.id, onClose]);

  const handleSelectOption = (groupName: string, choice: string) => {
    setSelectedOptions((prev) => ({ ...prev, [groupName]: choice }));
  };

  const handleSelectComboProduct = (slot: ComboSlot, productName: string) => {
    setComboSelections((prev) => {
      const current = prev[slot.id] || [];
      const requiredQty = slot.requiredQuantity || 1;

      if (requiredQty === 1) {
        return { ...prev, [slot.id]: [productName] };
      }

      // Multi-select mode for requiredQuantity > 1
      if (current.includes(productName)) {
        return { ...prev, [slot.id]: current.filter((p) => p !== productName) };
      } else {
        if (current.length < requiredQty) {
          return { ...prev, [slot.id]: [...current, productName] };
        } else {
          // Replace last element
          return { ...prev, [slot.id]: [...current.slice(1), productName] };
        }
      }
    });
  };

  const handleAdd = () => {
    // Merge combo selections into final options for cart & order tracking
    const finalOptions: Record<string, string> = { ...selectedOptions };
    comboSlots.forEach((slot) => {
      const chosen = comboSelections[slot.id] || [];
      if (chosen.length > 0) {
        finalOptions[slot.title] = chosen.join(', ');
      }
    });

    onAddToCart(product, finalOptions, quantity, notes);
    onClose();
  };

  // Calculate unit price with options
  let unitPrice = product.price;
  Object.values(selectedOptions).forEach((val) => {
    const match = val.match(/\(\+([\d.]+)\s*TND\)/);
    if (match && match[1]) {
      unitPrice += parseFloat(match[1]);
    }
  });

  const totalPrice = unitPrice * quantity;

  const renderBadge = (badge?: ProductBadge) => {
    if (isCombo || badge === 'BREAKFAST' || badge === 'COMBO') {
      return (
        <span className="inline-flex items-center text-xs font-extrabold text-amber-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40 shadow-lg">
          🥐 Formule Petit-Déjeuner
        </span>
      );
    }
    if (!badge) return null;
    switch (badge) {
      case 'BEST_SELLER':
        return (
          <span className="inline-flex items-center text-xs font-extrabold text-orange-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-orange-500/40 shadow-lg">
            🔥 Best-Seller
          </span>
        );
      case 'CHEF_SUGGESTION':
        return (
          <span className="inline-flex items-center text-xs font-extrabold text-amber-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40 shadow-lg">
            <Star className="w-3 h-3 mr-1 fill-amber-300" />
            Suggestion du Chef
          </span>
        );
      case 'SPICY':
        return (
          <span className="inline-flex items-center text-xs font-extrabold text-red-400 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-red-500/40 shadow-lg">
            🌶️ Recette Épicée
          </span>
        );
      case 'VEGETARIAN':
        return (
          <span className="inline-flex items-center text-xs font-extrabold text-emerald-400 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/40 shadow-lg">
            🌿 Végétarien
          </span>
        );
      case 'NEW':
        return (
          <span className="inline-flex items-center text-xs font-extrabold text-purple-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/40 shadow-lg">
            ✨ Nouveauté
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0d0f18] border border-white/[0.06] rounded-t-[32px] sm:rounded-[28px] max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col shadow-2xl animate-slideUp relative" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto my-2 sm:hidden absolute top-2 left-1/2 -translate-x-1/2 z-30 cursor-pointer" onClick={onClose} />

        {/* Header Image with gradient overlay */}
        <div className="relative h-56 w-full bg-gray-900 overflow-hidden">
          {product.imageUrl ? (
            <>
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f18] via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">Image indisponible</div>
          )}

          {/* Badge Overlay */}
          <div className="absolute top-4 left-4">
            {renderBadge(product.badge)}
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-black/70 text-white/80 hover:text-white rounded-2xl backdrop-blur-xl border border-white/10 transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 space-y-5 -mt-4 relative z-10">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">{product.name}</h2>
            {product.description && (
              <p className="text-xs text-gray-300/90 mt-1 font-medium bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06] leading-relaxed">
                {product.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-lg font-extrabold">
                <span className="gradient-text">{product.price.toFixed(3)}</span>
                <span className="text-xs text-gray-500 ml-1.5 font-semibold">TND</span>
              </p>
              {product.prepTimeMinutes && (
                <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 flex items-center gap-1">
                  ⏱️ Temps estimé : ~{product.prepTimeMinutes} min
                </span>
              )}
            </div>
          </div>

          {/* DYNAMIC COMBO / PETIT-DEJEUNER CHOICES */}
          {isCombo && comboSlots.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="divider-gradient" />
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-amber-400 uppercase tracking-widest">
                <UtensilsCrossed className="w-4 h-4" />
                <span>Composition de votre Formule</span>
              </div>

              {comboSlots.map((slot) => {
                const slotProducts = allProducts.filter(
                  (p) => p.categoryId === slot.categoryId && p.isAvailable && p.id !== product.id
                );
                const currentSelections = comboSelections[slot.id] || [];

                return (
                  <div key={slot.id} className="space-y-2 bg-white/[0.02] p-3.5 rounded-2xl border border-white/[0.05]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">{slot.title}</span>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        {slot.requiredQuantity} au choix
                      </span>
                    </div>

                    {slotProducts.length === 0 ? (
                      <p className="text-[11px] text-gray-500 italic py-2">
                        Aucun produit disponible pour ce choix pour le moment.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {slotProducts.map((p) => {
                          const isChosen = currentSelections.includes(p.name);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectComboProduct(slot, p.name)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                                isChosen
                                  ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold shadow-md shadow-amber-500/10'
                                  : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                {p.imageUrl && (
                                  <img src={p.imageUrl} alt={p.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                                )}
                                <span className="text-xs truncate">{p.name}</span>
                              </div>
                              {isChosen && (
                                <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Standard Option Groups */}
          {optionGroups.length > 0 && <div className="divider-gradient" />}
          {optionGroups.map((group) => (
            <div key={group.name} className="space-y-2.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Sparkles className="w-3 h-3 text-amber-500/60" />
                <span>{group.name}</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {group.choices.map((choice) => {
                  const isSelected = selectedOptions[group.name] === choice;
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => handleSelectOption(group.name, choice)}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-medium border transition-all duration-300 ${
                        isSelected
                          ? 'bg-orange-500/[0.08] border-orange-500/40 text-orange-300 font-bold shadow-sm shadow-orange-500/5'
                          : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.05] hover:text-gray-200'
                      }`}
                    >
                      <span>{choice}</span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Notes Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
              <MessageSquare className="w-3 h-3 text-gray-500" />
              <span>Remarque spéciale (optionnelle)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Sans glaçons, extra paille..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/[0.03] text-xs text-gray-200 px-4 py-3 rounded-2xl border border-white/[0.06] placeholder:text-gray-600 transition-all duration-300"
            />
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Quantité</span>
            <div className="flex items-center space-x-3 bg-white/[0.04] p-1.5 rounded-2xl border border-white/[0.06]">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white transition-all duration-200 active:scale-90"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-sm font-extrabold text-white">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-all duration-200 active:scale-90 shadow-md shadow-orange-500/25"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Submit Button */}
        <div className="p-5 border-t border-white/[0.04]" style={{ background: 'linear-gradient(180deg, rgba(13, 15, 24, 0) 0%, rgba(13, 15, 24, 1) 20%)' }}>
          <button
            onClick={handleAdd}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-between transition-all duration-300 active:scale-[0.98]"
          >
            <span className="text-sm">Ajouter au panier</span>
            <span className="text-sm font-extrabold bg-white/15 backdrop-blur-sm px-3 py-1 rounded-xl">{totalPrice.toFixed(3)} TND</span>
          </button>
        </div>
      </div>
    </div>
  );
};
