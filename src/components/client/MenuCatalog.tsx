import React, { useState, useEffect } from 'react';
import { Search, Plus, Coffee, Sparkles, Star, Tag } from 'lucide-react';
import { Category, Product, ProductBadge } from '../../types';
import { formatPrice } from '../../utils/formatPrice';

interface MenuCatalogProps {
  categories: Category[];
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const MenuCatalog: React.FC<MenuCatalogProps> = ({
  categories,
  products,
  onSelectProduct,
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  // Auto-select first category when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategoryId ? p.categoryId === activeCategoryId : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Stagger animation for product cards
  useEffect(() => {
    setVisibleItems(new Set());
    filteredProducts.forEach((_, idx) => {
      setTimeout(() => {
        setVisibleItems((prev) => new Set([...prev, idx]));
      }, idx * 50);
    });
  }, [activeCategoryId, searchQuery, products.length]);

  const getCategoryEmoji = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('chaud') || lower.includes('café') || lower.includes('thé')) return '☕';
    if (lower.includes('douceur') || lower.includes('viennoiserie') || lower.includes('gâteau')) return '🥐';
    if (lower.includes('frais') || lower.includes('jus') || lower.includes('boisson')) return '🍹';
    if (lower.includes('chicha') || lower.includes('narguilé')) return '💨';
    if (lower.includes('plat') || lower.includes('burger')) return '🍔';
    return '🍽️';
  };

  const renderBadge = (badge?: ProductBadge, isPromo?: boolean) => {
    if (isPromo || badge === 'PROMO') {
      return (
        <span className="inline-flex items-center text-[9px] font-extrabold text-red-300 bg-gradient-to-r from-red-500/20 to-pink-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
          <Tag className="w-2.5 h-2.5 mr-1 text-red-400" />
          Offre Spéciale
        </span>
      );
    }
    if (!badge) return null;
    switch (badge) {
      case 'BREAKFAST':
      case 'COMBO':
        return (
          <span className="inline-flex items-center text-[9px] font-extrabold text-amber-300 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
            🥐 Formule Petit-Déjeuner
          </span>
        );
      case 'BEST_SELLER':
        return (
          <span className="inline-flex items-center text-[9px] font-extrabold text-orange-300 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-2 py-0.5 rounded-full border border-orange-500/30">
            🔥 Best-Seller
          </span>
        );
      case 'CHEF_SUGGESTION':
        return (
          <span className="inline-flex items-center text-[9px] font-extrabold text-amber-300 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
            <Star className="w-2.5 h-2.5 mr-1 fill-amber-300" />
            Suggestion du Chef
          </span>
        );
      case 'SPICY':
        return (
          <span className="inline-flex items-center text-[9px] font-extrabold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            🌶️ Épicé
          </span>
        );
      case 'VEGETARIAN':
        return (
          <span className="inline-flex items-center text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            🌿 Végétarien
          </span>
        );
      case 'NEW':
        return (
          <span className="inline-flex items-center text-[9px] font-extrabold text-purple-300 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
            ✨ Nouveau
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-28 max-w-md mx-auto px-4 pt-4 relative z-10">
      {/* Search Input */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Rechercher un espresso, chicha, jus..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.04] text-sm text-gray-100 pl-11 pr-4 py-3 rounded-2xl border border-white/[0.06] transition-all duration-300 placeholder:text-gray-500/80 focus:border-orange-500/50"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold bg-white/[0.08] text-gray-300 px-2.5 py-1 rounded-full hover:bg-white/[0.12] transition-all"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Instagram Stories Style Category Circle Carousel */}
      <div className="mb-6">
        <div className="flex items-center space-x-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 scroll-smooth">
          {/* All Menu Story Circle */}
          <button
            onClick={() => setActiveCategoryId(null)}
            className="flex flex-col items-center space-y-1.5 flex-shrink-0 group focus:outline-none"
          >
            <div
              className={`w-15 h-15 rounded-full p-[2.5px] transition-all duration-300 ${
                activeCategoryId === null
                  ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 shadow-lg shadow-orange-500/30 scale-105 animate-glow-pulse'
                  : 'bg-white/[0.1] hover:bg-white/[0.2]'
              }`}
            >
              <div className="w-full h-full rounded-full bg-[#0d0f18] border-2 border-[#0d0f18] flex items-center justify-center text-lg">
                🌟
              </div>
            </div>
            <span
              className={`text-[11px] font-extrabold transition-colors duration-200 ${
                activeCategoryId === null ? 'text-orange-400' : 'text-gray-400 group-hover:text-white'
              }`}
            >
              Tout
            </span>
          </button>

          {/* Individual Category Story Circles */}
          {categories.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            const emoji = getCategoryEmoji(cat.name);

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className="flex flex-col items-center space-y-1.5 flex-shrink-0 group focus:outline-none"
              >
                <div
                  className={`w-15 h-15 rounded-full p-[2.5px] transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 shadow-lg shadow-orange-500/30 scale-105 animate-glow-pulse'
                      : 'bg-white/[0.1] hover:bg-white/[0.2]'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-[#0d0f18] border-2 border-[#0d0f18] flex items-center justify-center text-lg">
                    {emoji}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-extrabold truncate max-w-[70px] text-center transition-colors duration-200 ${
                    isActive ? 'text-orange-400' : 'text-gray-400 group-hover:text-white'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="divider-gradient mb-5" />

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl animate-fadeIn">
          <Coffee className="w-14 h-14 text-gray-700 mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-400">Aucun produit trouvé dans cette section</p>
          <p className="text-xs text-gray-600 mt-1">Essayez une autre catégorie ou un autre terme de recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredProducts.map((product, idx) => {
            const isAvailable = product.isAvailable;
            const isVisible = visibleItems.has(idx);
            const hasPromo = product.promoPrice && product.promoPrice < product.price;
            const effectivePrice = hasPromo ? product.promoPrice! : product.price;

            return (
              <div
                key={product.id}
                onClick={() => isAvailable && onSelectProduct({ ...product, price: effectivePrice })}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
                  transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1)`,
                }}
                className={`product-card glass-panel p-4 rounded-3xl flex items-center space-x-4 border border-white/[0.06] shadow-xl hover:border-orange-500/30 transition-all duration-300 ${
                  isAvailable
                    ? 'cursor-pointer active:scale-[0.985]'
                    : 'opacity-40 cursor-not-allowed grayscale'
                }`}
              >
                {/* Image */}
                <div className="relative w-[78px] h-[78px] rounded-2xl overflow-hidden bg-gray-800/50 flex-shrink-0 ring-1 ring-white/[0.08] shadow-inner">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                      <Coffee className="w-8 h-8" />
                    </div>
                  )}
                  {!isAvailable && (
                    <span className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center text-[9px] font-bold text-red-400 uppercase tracking-widest">
                      Épuisé
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Badges line */}
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {renderBadge(product.badge, Boolean(hasPromo))}
                    {product.prepTimeMinutes && (
                      <span className="inline-flex items-center text-[9px] text-amber-300 font-bold bg-amber-500/[0.08] px-2 py-0.5 rounded-full border border-amber-500/20">
                        ⏱️ ~{product.prepTimeMinutes} min
                      </span>
                    )}
                    {product.optionsJson && (
                      <span className="inline-flex items-center text-[9px] text-gray-400 font-bold bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                        <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-400" />
                        Option
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-white truncate leading-tight">{product.name}</h3>

                  <div className="flex items-baseline space-x-2">
                    {hasPromo && (
                      <span className="line-through text-xs text-gray-500 font-semibold">
                        {formatPrice(product.price)}
                      </span>
                    )}
                    <p className="text-sm font-black">
                      <span className={hasPromo ? 'text-red-400 font-extrabold' : 'gradient-text'}>
                        {formatPrice(effectivePrice)}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-1 font-semibold">TND</span>
                    </p>
                  </div>
                </div>

                {/* Add Button */}
                <button
                  disabled={!isAvailable}
                  className={`p-3.5 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                    isAvailable
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-500/20 hover:scale-105 active:scale-95'
                      : 'bg-white/[0.03] text-gray-700 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
