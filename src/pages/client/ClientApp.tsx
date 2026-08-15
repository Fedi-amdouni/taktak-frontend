import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UtensilsCrossed, Tv, ShoppingBag, Gamepad2, Sparkles, Gift, Star } from 'lucide-react';
import { Header } from './components/Header';
import { MenuCatalog } from './components/MenuCatalog';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { TableChangeModal } from './components/TableChangeModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { ServiceModal } from './components/ServiceModal';
import { AmbianceView } from './components/AmbianceView';
import { UpsellModal } from './components/UpsellModal';
import { ChkounYkhallesModal } from './components/ChkounYkhallesModal';
import { ConnectFourGame } from './components/ConnectFourGame';
import { EntertainmentHub, type EntertainmentGame } from './components/EntertainmentHub';
import { UnoGame } from './components/UnoGame';
import { PartyGame } from './components/PartyGame';
import { LudoGame } from './components/LudoGame';
import { ChkobbaGame } from './components/ChkobbaGame';
import { RamiGame } from './components/RamiGame';
import { FeedbackRewardModal } from './components/FeedbackRewardModal';
import { useTableSession } from '../../context/TableSessionContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { Cafe, Category, Product } from '../../types';

export const ClientApp: React.FC = () => {
  const { cafeSlug = 'monastir-lounge', tableId = '05' } = useParams<{ cafeSlug: string; tableId: string }>();
  const tableNumber = parseInt(tableId, 10) || 5;

  const { initializeSession, activeOrderId } = useTableSession();
  const { addToCart, totalCount } = useCart();

  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [activeTab, setActiveTab] = useState<'menu' | 'ambiance' | 'games'>('menu');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [upsellProduct, setUpsellProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<EntertainmentGame | null>(null);
  const gameTableId = `${cafeSlug}-${tableNumber}`;

  useEffect(() => {
    // Initialize session and trigger table change detection
    initializeSession(cafeSlug, tableNumber);

    // Fetch Cafe & Menu
    const loadData = async () => {
      const cafeData = await api.getCafeBySlug(cafeSlug);
      const menuData = await api.getMenu(cafeSlug);
      setCafe(cafeData);
      setCategories(menuData.categories);
      setProducts(menuData.products);
    };

    loadData();
  }, [cafeSlug, tableNumber]);

  const handleAddToCart = (product: Product, selectedOptions: Record<string, string>, quantity: number, notes?: string) => {
    addToCart(product, selectedOptions, quantity, notes);

    // Trigger UpsellModal if product has cross-sell suggestions
    if (product.suggestedProducts && product.suggestedProducts.length > 0) {
      setUpsellProduct(product);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090e] text-gray-100 flex flex-col selection:bg-orange-500 selection:text-white pb-16">
      {/* Table Transfer Modal (Triggered automatically on table shift) */}
      <TableChangeModal />

      {/* Header Bar */}
      <Header
        cafeName={cafe?.name || 'Monastir Lounge'}
        logoUrl={cafe?.logoUrl}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        onOpenServiceModal={() => setIsServiceModalOpen(true)}
        onOpenRewardModal={() => setIsFeedbackOpen(true)}
      />

      {/* Permanent Attractive VIP Rewards / Google Review Callout */}
      <div className="max-w-md mx-auto w-full px-4 pt-2.5">
        <button
          onClick={() => setIsFeedbackOpen(true)}
          className="w-full flex items-center justify-between gap-2.5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-2.5 text-xs text-amber-200 hover:border-amber-400/50 hover:bg-amber-500/20 transition-all shadow-md group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-sm flex-shrink-0 group-hover:scale-110 transition-transform">
              ⭐
            </span>
            <div className="text-left min-w-0">
              <span className="block text-[11px] font-black text-white truncate flex items-center gap-1">
                <span>Avis Google & Récompense VIP</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded-full">Cadeau</span>
              </span>
              <span className="text-[10px] text-amber-300/80 truncate block">Tournez la roue et gagnez jusqu'à 30% de remise</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-black text-amber-300 flex-shrink-0">
            <span>Participer</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'menu' ? (
          <MenuCatalog
            categories={categories}
            products={products}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        ) : activeTab === 'ambiance' ? (
          <AmbianceView cafeSlug={cafeSlug} />
        ) : selectedGame === 'connect-four' ? (
          <ConnectFourGame tableId={gameTableId} onBack={() => setSelectedGame(null)} />
        ) : selectedGame === 'uno' ? (
          <UnoGame tableId={gameTableId} onBack={() => setSelectedGame(null)} />
        ) : selectedGame === 'ludo' ? (
          <LudoGame tableId={gameTableId} onBack={() => setSelectedGame(null)} />
        ) : selectedGame === 'chkobba' ? (
          <ChkobbaGame tableId={gameTableId} onBack={() => setSelectedGame(null)} />
        ) : selectedGame === 'rami' ? (
          <RamiGame tableId={gameTableId} onBack={() => setSelectedGame(null)} />
        ) : selectedGame === 'quiz' || selectedGame === 'truth' ? (
          <PartyGame tableId={gameTableId} mode={selectedGame} onBack={() => setSelectedGame(null)} />
        ) : (
          <EntertainmentHub onSelect={setSelectedGame} onRoulette={() => setIsRouletteOpen(true)} />
        )}
      </main>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080a10]/95 backdrop-blur-2xl border-t border-white/[0.08] py-2 px-6">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Menu Tab */}
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl transition-all duration-300 ${
              activeTab === 'menu'
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/10 scale-105'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-[10px] font-black">Menu</span>
          </button>

          {/* Games Tab */}
          <button
            onClick={() => {
              setActiveTab('games');
              setSelectedGame(null);
            }}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl transition-all duration-300 ${
              activeTab === 'games'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10 scale-105'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-black">Jeux</span>
          </button>

          {/* Matchs & TV Tab */}
          <button
            onClick={() => setActiveTab('ambiance')}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'ambiance'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-md shadow-purple-500/10 scale-105'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Tv className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-black">Matchs & TV</span>
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-pink-500 rounded-full" />
          </button>

          {/* Cart Tab */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl text-gray-400 hover:text-orange-400 relative transition-all duration-300 active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-black">Panier</span>
            {totalCount > 0 && (
              <span className="absolute -top-0.5 right-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Item Customization Modal */}
      <ProductModal
        product={selectedProduct}
        allProducts={products}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Upsell Cross-Selling Modal */}
      {upsellProduct && (
        <UpsellModal
          sourceProduct={upsellProduct}
          isOpen={!!upsellProduct}
          onClose={() => setUpsellProduct(null)}
          onViewCart={() => setIsCartOpen(true)}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderCreated={() => setIsOrderTrackerOpen(true)}
        onOpenRoulette={() => setIsRouletteOpen(true)}
      />

      {/* Real-time Order Tracker */}
      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
      />

      {/* Service Call & Bill Modal */}
      <ServiceModal
        cafeSlug={cafeSlug}
        tableNumber={tableNumber}
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onBillRequested={async () => {
          if (!activeOrderId || localStorage.getItem(`taktak_feedback_${activeOrderId}`)) return;
          try {
            const campaign = await api.getRewardCampaign(cafeSlug);
            if (campaign.enabled) setTimeout(() => setIsFeedbackOpen(true), 2100);
          } catch {
            /* optional */
          }
        }}
      />

      <FeedbackRewardModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        cafeSlug={cafeSlug}
        orderId={activeOrderId}
      />

      <ChkounYkhallesModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        tableId={gameTableId}
      />
    </div>
  );
};
