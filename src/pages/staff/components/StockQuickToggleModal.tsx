import React, { useState, useEffect } from 'react';
import { X, Zap, Eye, EyeOff, Search } from 'lucide-react';
import { Product } from '../../../types';
import { api } from '../../../services/api';

interface StockQuickToggleModalProps {
  cafeSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onProductsUpdated?: () => void;
}

export const StockQuickToggleModal: React.FC<StockQuickToggleModalProps> = ({
  cafeSlug,
  isOpen,
  onClose,
  onProductsUpdated,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getMenu(cafeSlug);
      setProducts(data.products || []);
    } catch (e) {
      console.error('Erreur chargement produits', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen, cafeSlug]);

  const handleToggle = async (productId: string) => {
    // Optimistic UI update for instant feedback (1-tap)
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p))
    );

    try {
      await api.toggleProductAvailability(productId);
      if (onProductsUpdated) onProductsUpdated();
    } catch (e) {
      console.error('Erreur bascule stock', e);
      // Rollback on error
      loadProducts();
    }
  };

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn transition-all">
      <div className="w-full max-w-2xl bg-[#0e111a] border border-white/[0.12] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] sm:max-h-[85vh] flex flex-col relative animate-slideUp sm:animate-scaleUp">
        {/* Mobile Sheet Handle */}
        <div className="w-12 h-1.5 bg-white/20 hover:bg-white/40 rounded-full mx-auto mb-2 sm:hidden cursor-pointer" onClick={onClose} />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">⚡ Stock Express (Rupture en 1-Tap)</h3>
              <p className="text-xs text-gray-400">Touchez un produit pour le rendre indisponible ou disponible immédiatement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit (ex: Cappuccino, Chicha)..."
            className="w-full bg-gray-950 text-xs text-white pl-10 pr-4 py-2.5 rounded-2xl border border-gray-800 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
          {loading ? (
            <p className="text-center text-xs text-gray-500 py-10">Chargement des produits...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-xs text-gray-500 py-10">Aucun produit trouvé</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleToggle(product.id)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-left active:scale-95 ${
                    product.isAvailable
                      ? 'bg-gray-950 border-gray-800 hover:border-green-500/50'
                      : 'bg-red-500/10 border-red-500/30 opacity-70'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/40'}
                      alt={product.name}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="truncate">
                      <span className="font-extrabold text-xs text-white block truncate">{product.name}</span>
                      <span className="text-[11px] text-orange-400 font-bold">
                        {typeof product.price === 'number' ? product.price.toFixed(3) : Number(product.price).toFixed(3)} TND
                      </span>
                    </div>
                  </div>

                  <div className="ml-2 flex-shrink-0">
                    {product.isAvailable ? (
                      <span className="px-2.5 py-1 rounded-xl bg-green-500/20 text-green-400 text-[10px] font-extrabold flex items-center space-x-1 border border-green-500/30">
                        <Eye className="w-3 h-3" />
                        <span>En Stock</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-400 text-[10px] font-extrabold flex items-center space-x-1 border border-red-500/30">
                        <EyeOff className="w-3 h-3" />
                        <span>Épuisé</span>
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
