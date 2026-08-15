import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Coffee,
  Sparkles,
  Star,
  Tag,
  Flame,
  UtensilsCrossed,
  Clock,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Category, Product, ProductBadge } from '../../../types';
import { formatPrice } from '../../../utils/formatPrice';
import { useCart } from '../../../context/CartContext';

interface MenuCatalogProps {
  categories: Category[];
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

type FilterTag = 'ALL' | 'PROMO' | 'BEST_SELLER' | 'COMBO' | 'CHEF_SUGGESTION' | 'VEGETARIAN';

export const MenuCatalog: React.FC<MenuCatalogProps> = ({
  categories,
  products,
  onSelectProduct,
}) => {
  const { cart } = useCart();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTag>('ALL');
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  // Auto-select first category when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories]);

  // Highlight products for top promo/hero banner (ONLY available products!)
  const availableProducts = useMemo(() => products.filter((p: Product) => p.isAvailable), [products]);
  const featuredProduct = useMemo(() => {
    return (
      availableProducts.find(
        (p: Product) =>
          p.badge === 'CHEF_SUGGESTION' ||
          p.badge === 'BEST_SELLER' ||
          p.badge === 'COMBO' ||
          (p.promoPrice && p.promoPrice < p.price)
      ) || availableProducts[0] || null
    );
  }, [availableProducts]);

  const filteredProducts = products.filter((p) => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('fr');
    const matchesCategory = normalizedQuery ? true : activeCategoryId ? p.categoryId === activeCategoryId : true;
    const matchesSearch =
      !normalizedQuery ||
      `${p.name} ${p.description || ''}`.toLocaleLowerCase('fr').includes(normalizedQuery);

    let matchesFilter = true;
    if (activeFilter === 'PROMO') {
      matchesFilter = Boolean(p.promoPrice && p.promoPrice < p.price) || p.badge === 'PROMO';
    } else if (activeFilter === 'BEST_SELLER') {
      matchesFilter = p.badge === 'BEST_SELLER';
    } else if (activeFilter === 'COMBO') {
      matchesFilter = p.badge === 'COMBO' || p.badge === 'BREAKFAST' || Boolean(p.isCombo);
    } else if (activeFilter === 'CHEF_SUGGESTION') {
      matchesFilter = p.badge === 'CHEF_SUGGESTION';
    } else if (activeFilter === 'VEGETARIAN') {
      matchesFilter = p.badge === 'VEGETARIAN';
    }

    return matchesCategory && matchesSearch && matchesFilter;
  });

  // Stagger animation for product cards
  useEffect(() => {
    setVisibleItems(new Set());
    filteredProducts.forEach((_, idx) => {
      setTimeout(() => {
        setVisibleItems((prev) => new Set([...prev, idx]));
      }, idx * 40);
    });
  }, [activeCategoryId, searchQuery, activeFilter, products.length]);

  const getCategoryEmoji = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('chaud') || lower.includes('café') || lower.includes('thé') || lower.includes('coffee')) return '☕';
    if (lower.includes('douceur') || lower.includes('viennoiserie') || lower.includes('gâteau') || lower.includes('dessert')) return '🥐';
    if (lower.includes('frais') || lower.includes('jus') || lower.includes('boisson') || lower.includes('cocktail')) return '🍹';
    if (lower.includes('chicha') || lower.includes('narguilé')) return '💨';
    if (lower.includes('plat') || lower.includes('burger') || lower.includes('pizza') || lower.includes('sandwich')) return '🍔';
    if (lower.includes('petit') || lower.includes('formule') || lower.includes('breakfast')) return '🍳';
    return '🍽️';
  };

  const getCartQuantityForProduct = (productId: string) => {
    const cartItems = cart.filter((item) => item.productId === productId);
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  const renderBadge = (badge?: ProductBadge, isPromo?: boolean) => {
    if (isPromo || badge === 'PROMO') {
      return (
        <span className="inline-flex items-center text-[9px] font-black text-red-300 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
          <Tag className="w-2.5 h-2.5 mr-1 text-red-400" />
          Promo
        </span>
      );
    }
    if (!badge) return null;
    switch (badge) {
      case 'BREAKFAST':
      case 'COMBO':
        return (
          <span className="inline-flex items-center text-[9px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
            <UtensilsCrossed className="w-2.5 h-2.5 mr-1 text-amber-400" />
            Formule
          </span>
        );
      case 'BEST_SELLER':
        return (
          <span className="inline-flex items-center text-[9px] font-black text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/30">
            <Flame className="w-2.5 h-2.5 mr-1 text-orange-400" />
            Best-Seller
          </span>
        );
      case 'CHEF_SUGGESTION':
        return (
          <span className="inline-flex items-center text-[9px] font-black text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/30">
            <Star className="w-2.5 h-2.5 mr-1 fill-yellow-300 text-yellow-300" />
            Coup de Cœur
          </span>
        );
      case 'SPICY':
        return (
          <span className="inline-flex items-center text-[9px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            🌶️ Épicé
          </span>
        );
      case 'VEGETARIAN':
        return (
          <span className="inline-flex items-center text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            🌿 Végétarien
          </span>
        );
      case 'NEW':
        return (
          <span className="inline-flex items-center text-[9px] font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
            ✨ Nouveau
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-28 max-w-md mx-auto px-4 pt-3 relative z-10 space-y-4">
      {/* Search Input with Clear Button */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un café, chicha, formule, jus..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#111420]/80 backdrop-blur-xl text-sm text-gray-100 pl-11 pr-10 py-3 rounded-2xl border border-white/[0.08] transition-all duration-300 placeholder:text-gray-500 focus:border-orange-500/60 shadow-lg shadow-black/20"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold bg-white/[0.1] text-gray-300 px-2 py-0.5 rounded-lg hover:bg-white/[0.2] transition-all"
          >
            ✕
          </button>
        )}
      </div>

      {/* Hero Spotlight / Chef Suggestion Card (Only shown if no search query) */}
      {!searchQuery && featuredProduct && (
        <div
          onClick={() => featuredProduct.isAvailable && onSelectProduct(featuredProduct)}
          className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-[#131728] to-[#0c0f1a] p-4 cursor-pointer shadow-xl group hover:border-orange-500/50 transition-all duration-300 active:scale-[0.99]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center space-x-1.5">
                <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-400 animate-pulse" />
                  À la Une du Café
                </span>
              </div>
              <h2 className="text-base font-black text-white truncate tracking-tight group-hover:text-amber-200 transition-colors">
                {featuredProduct.name}
              </h2>
              {featuredProduct.description && (
                <p className="text-[11px] text-gray-300/80 line-clamp-1 font-medium">
                  {featuredProduct.description}
                </p>
              )}
              <div className="flex items-baseline space-x-2 pt-0.5">
                <span className="text-base font-black text-amber-400">
                  {formatPrice(featuredProduct.promoPrice || featuredProduct.price)} <span className="text-[10px] text-gray-400">TND</span>
                </span>
                {featuredProduct.promoPrice && featuredProduct.promoPrice < featuredProduct.price && (
                  <span className="text-xs text-gray-500 line-through font-semibold">
                    {formatPrice(featuredProduct.price)}
                  </span>
                )}
              </div>
            </div>

            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300">
              {featuredProduct.imageUrl ? (
                <img
                  src={featuredProduct.imageUrl}
                  alt={featuredProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-amber-400">
                  <Coffee className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-1 right-1 bg-orange-500 text-white rounded-lg p-1 shadow-md">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instagram Stories Style Category Circle Carousel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
            Catégories
          </span>
          <span className="text-[10px] font-bold text-gray-500">
            {categories.length} sections
          </span>
        </div>

        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-1.5 pt-1 scroll-smooth">
          {/* All Items Pill Circle */}
          <button
            onClick={() => {
              setActiveCategoryId(null);
              setActiveFilter('ALL');
            }}
            className="flex flex-col items-center space-y-1.5 flex-shrink-0 group focus:outline-none"
          >
            <div
              className={`w-14 h-14 rounded-full p-[2.5px] transition-all duration-300 ${
                activeCategoryId === null
                  ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 shadow-lg shadow-orange-500/30 scale-105'
                  : 'bg-white/[0.08] hover:bg-white/[0.15]'
              }`}
            >
              <div className="w-full h-full rounded-full bg-[#0d0f18] border-2 border-[#0d0f18] flex items-center justify-center text-base">
                🌟
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span
                className={`text-[11px] font-black transition-colors duration-200 ${
                  activeCategoryId === null ? 'text-orange-400' : 'text-gray-400 group-hover:text-white'
                }`}
              >
                Tous
              </span>
              <span className="text-[9px] text-gray-500 font-bold">({products.length})</span>
            </div>
          </button>

          {/* Individual Category Story Circles */}
          {categories.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            const emoji = getCategoryEmoji(cat.name);
            const count = products.filter((p) => p.categoryId === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setActiveFilter('ALL');
                }}
                className="flex flex-col items-center space-y-1.5 flex-shrink-0 group focus:outline-none"
              >
                <div
                  className={`w-14 h-14 rounded-full p-[2.5px] transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 shadow-lg shadow-orange-500/30 scale-105'
                      : 'bg-white/[0.08] hover:bg-white/[0.15]'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-[#0d0f18] border-2 border-[#0d0f18] flex items-center justify-center text-base">
                    {emoji}
                  </div>
                </div>
                <div className="flex flex-col items-center max-w-[72px]">
                  <span
                    className={`text-[11px] font-black truncate w-full text-center transition-colors duration-200 ${
                      isActive ? 'text-orange-400' : 'text-gray-400 group-hover:text-white'
                    }`}
                  >
                    {cat.name}
                  </span>
                  <span className="text-[9px] text-gray-500 font-bold">({count})</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Filter Badges Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'ALL' as const, label: 'Tous', icon: null },
          { id: 'BEST_SELLER' as const, label: 'Best-Sellers', icon: Flame },
          { id: 'COMBO' as const, label: 'Formules', icon: UtensilsCrossed },
          { id: 'CHEF_SUGGESTION' as const, label: 'Coups de Cœur', icon: Star },
          { id: 'PROMO' as const, label: 'Promos', icon: Tag },
          { id: 'VEGETARIAN' as const, label: 'Végétarien', icon: null },
        ].map((tag) => {
          const Icon = tag.icon;
          const isActive = activeFilter === tag.id;
          return (
            <button
              key={tag.id}
              onClick={() => setActiveFilter(tag.id)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200 border border-white/[0.05]'
              }`}
            >
              {Icon && <Icon className="w-3 h-3 text-amber-400" />}
              <span>{tag.label}</span>
            </button>
          );
        })}
      </div>

      <div className="divider-gradient" />

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl animate-fadeIn space-y-3">
          <Coffee className="w-14 h-14 text-gray-600 mx-auto" />
          <p className="text-sm font-extrabold text-gray-300">Aucun produit ne correspond à votre recherche</p>
          <p className="text-xs text-gray-500">Essayez de modifier votre filtre ou terme de recherche.</p>
          <button
            onClick={() => {
              setActiveFilter('ALL');
              setSearchQuery('');
              setActiveCategoryId(null);
            }}
            className="text-xs font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-4 py-2 rounded-xl transition-all"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredProducts.map((product, idx) => {
            const isAvailable = product.isAvailable;
            const isVisible = visibleItems.has(idx);
            const hasPromo = product.promoPrice && product.promoPrice < product.price;
            const effectivePrice = hasPromo ? product.promoPrice! : product.price;
            const cartQty = getCartQuantityForProduct(product.id);

            return (
              <div
                key={product.id}
                onClick={() => isAvailable && onSelectProduct({ ...product, price: effectivePrice })}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.35s cubic-bezier(0.4, 0, 0.2, 1)`,
                }}
                className={`group glass-panel p-3.5 rounded-3xl flex items-center space-x-3.5 border border-white/[0.06] shadow-xl hover:border-orange-500/30 transition-all duration-300 ${
                  isAvailable
                    ? 'cursor-pointer active:scale-[0.985]'
                    : 'opacity-45 cursor-not-allowed grayscale'
                }`}
              >
                {/* Product Thumbnail */}
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-900 flex-shrink-0 ring-1 ring-white/[0.08] shadow-inner">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-800/60">
                      <Coffee className="w-7 h-7" />
                    </div>
                  )}

                  {!isAvailable && (
                    <span className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center text-[9px] font-black text-red-400 uppercase tracking-widest text-center px-1">
                      Épuisé
                    </span>
                  )}

                  {/* Quantity In Cart Floating Chip */}
                  {cartQty > 0 && (
                    <span className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-md flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      {cartQty}
                    </span>
                  )}
                </div>

                {/* Product Information */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Badges line */}
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {renderBadge(product.badge, Boolean(hasPromo))}
                    {product.prepTimeMinutes && (
                      <span className="inline-flex items-center text-[9px] text-amber-300 font-bold bg-amber-500/[0.08] px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        ~{product.prepTimeMinutes}m
                      </span>
                    )}
                    {(product.optionsJson || product.comboSlotsJson) && (
                      <span className="inline-flex items-center text-[9px] text-gray-400 font-bold bg-white/[0.04] px-1.5 py-0.5 rounded-full border border-white/[0.06]">
                        Options
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-black text-white truncate leading-tight group-hover:text-orange-300 transition-colors">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-[11px] text-gray-400 line-clamp-1 font-medium">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-baseline space-x-2 pt-0.5">
                    {hasPromo && (
                      <span className="line-through text-[11px] text-gray-500 font-semibold">
                        {formatPrice(product.price)}
                      </span>
                    )}
                    <p className="text-sm font-black">
                      <span className={hasPromo ? 'text-red-400 font-black' : 'gradient-text'}>
                        {formatPrice(effectivePrice)}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-1 font-semibold">TND</span>
                    </p>
                  </div>
                </div>

                {/* Add to Cart Trigger Button */}
                <button
                  disabled={!isAvailable}
                  className={`p-3 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
                    isAvailable
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-500/20 group-hover:scale-110 active:scale-95'
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
