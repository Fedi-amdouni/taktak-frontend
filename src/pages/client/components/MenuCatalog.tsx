import React, { useEffect, useMemo, useState } from 'react';
import { Coffee, Plus, Search } from 'lucide-react';
import { Category, Product } from '../../../types';
import { formatPrice } from '../../../utils/formatPrice';

interface MenuCatalogProps {
  categories: Category[];
  products: Product[];
  orderingEnabled?: boolean;
  onSelectProduct: (product: Product) => void;
}

const ALL_CATEGORY_ID = '__all__';

const badgeLabel = (product: Product) => {
  if (product.promoPrice && product.promoPrice < product.price) return 'Promo';
  if (product.badge === 'BEST_SELLER') return 'Populaire';
  if (product.badge === 'CHEF_SUGGESTION') return 'Notre choix';
  if (product.badge === 'NEW') return 'Nouveau';
  if (product.isCombo || product.badge === 'COMBO' || product.badge === 'BREAKFAST') return 'Formule';
  return null;
};

export const MenuCatalog: React.FC<MenuCatalogProps> = ({
  categories,
  products,
  orderingEnabled = true,
  onSelectProduct,
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState(ALL_CATEGORY_ID);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeCategoryId !== ALL_CATEGORY_ID && !categories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(ALL_CATEGORY_ID);
    }
  }, [categories, activeCategoryId]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('fr');
    return products.filter((product) => {
      if (query) return `${product.name} ${product.description || ''}`.toLocaleLowerCase('fr').includes(query);
      return activeCategoryId === ALL_CATEGORY_ID || product.categoryId === activeCategoryId;
    });
  }, [products, activeCategoryId, searchQuery]);

  const groupedProducts = useMemo(() => categories
    .map((category) => ({
      category,
      products: filteredProducts.filter((product) => product.categoryId === category.id),
    }))
    .filter((group) => group.products.length > 0), [categories, filteredProducts]);

  const renderProductCard = (product: Product) => {
    const effectivePrice = product.promoPrice && product.promoPrice < product.price ? product.promoPrice : product.price;
    const label = badgeLabel(product);
    const canSelect = product.isAvailable && orderingEnabled;
    return (
      <button
        key={product.id}
        disabled={!canSelect}
        onClick={() => onSelectProduct({ ...product, price: effectivePrice })}
        className={`overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] text-left transition ${canSelect ? 'hover:border-orange-500/25 active:scale-[0.98]' : 'cursor-default'} ${!product.isAvailable ? 'opacity-45' : ''}`}
      >
        <div className="relative aspect-[4/3] bg-[#12151e]">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center"><Coffee className="h-7 w-7 text-gray-700" /></div>
          )}
          {label && <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[9px] font-black text-white backdrop-blur">{label}</span>}
          {!product.isAvailable && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-black uppercase tracking-wider text-white">Épuisé</span>}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 min-h-[2.25rem] text-[13px] font-extrabold leading-[1.15rem] text-white">{product.name}</h3>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-black text-orange-300">{formatPrice(effectivePrice)} <span className="text-[9px] text-gray-500">TND</span></p>
              {product.prepTimeMinutes && orderingEnabled && <p className="mt-0.5 text-[9px] font-semibold text-gray-500">env. {product.prepTimeMinutes} min</p>}
            </div>
            {canSelect && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white"><Plus className="h-4 w-4" /></span>}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="relative z-10 mx-auto max-w-md space-y-4 px-4 pb-28 pt-4">
      {!orderingEnabled && (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.07] px-4 py-3">
          <p className="text-xs font-extrabold text-sky-100">Menu en consultation</p>
          <p className="mt-0.5 text-[11px] text-sky-200/70">Les commandes en ligne ne sont pas disponibles dans cet établissement.</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Rechercher dans le menu"
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-orange-500/40"
        />
      </div>

      {!searchQuery && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label="Catégories du menu">
          <button
            onClick={() => setActiveCategoryId(ALL_CATEGORY_ID)}
            className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-extrabold transition ${activeCategoryId === ALL_CATEGORY_ID ? 'bg-white text-gray-950' : 'border border-white/[0.08] bg-white/[0.03] text-gray-400'}`}
          >
            Tout
          </button>
          {categories.map((category) => {
            const active = category.id === activeCategoryId;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-extrabold transition ${active ? 'bg-white text-gray-950' : 'border border-white/[0.08] bg-white/[0.03] text-gray-400'}`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">Notre carte</p>
          <h2 className="mt-0.5 text-lg font-black tracking-tight text-white">
            {searchQuery ? 'Résultats' : activeCategoryId === ALL_CATEGORY_ID ? 'Tous les produits' : categories.find((category) => category.id === activeCategoryId)?.name || 'Tous les produits'}
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-gray-500">{filteredProducts.length} choix</span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] py-14 text-center">
          <Coffee className="mx-auto h-8 w-8 text-gray-700" />
          <p className="mt-3 text-sm font-bold text-gray-300">Aucun produit trouvé</p>
          <button onClick={() => setSearchQuery('')} className="mt-2 text-xs font-bold text-orange-300">Effacer la recherche</button>
        </div>
      ) : (
        activeCategoryId === ALL_CATEGORY_ID && !searchQuery ? (
          <div className="space-y-7">
            {groupedProducts.map(({ category, products: productsInCategory }) => (
              <section key={category.id}>
                <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
                  <h3 className="text-sm font-black text-white">{category.name}</h3>
                  <span className="text-[10px] font-bold text-gray-500">{productsInCategory.length} produits</span>
                </div>
                <div className="grid grid-cols-2 gap-3">{productsInCategory.map(renderProductCard)}</div>
              </section>
            ))}
          </div>
        ) : <div className="grid grid-cols-2 gap-3">{filteredProducts.map(renderProductCard)}</div>
      )}
    </div>
  );
};
