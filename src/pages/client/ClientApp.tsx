import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UtensilsCrossed, Music, ShoppingBag, Gamepad2 } from 'lucide-react';
import { Header } from './components/Header';
import { MenuCatalog } from './components/MenuCatalog';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { TableChangeModal } from './components/TableChangeModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { BillSplitterModal } from './components/BillSplitterModal';
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
  const [isBillSplitterOpen, setIsBillSplitterOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<EntertainmentGame | null>(null);
  const [tableStatus, setTableStatus] = useState<{ hasActiveOrders: boolean; gamesAllowed: boolean }>({
    hasActiveOrders: false,
    gamesAllowed: false,
  });
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const gameTableId = `${cafeSlug}-${tableNumber}`;

  useEffect(() => {
    // Initialize session and trigger table change detection
    initializeSession(cafeSlug, tableNumber);

    const urlToken = new URLSearchParams(window.location.search).get('token');
    const storageKey = `taktak_table_token_${cafeSlug}_${tableNumber}`;
    const effectiveToken = urlToken || sessionStorage.getItem(storageKey);

    // Fetch Cafe, Menu, and the server-authoritative table status.
    const loadData = async () => {
      try {
        setIsLoadingSession(true);
        const [cafeData, menuData, statusData] = await Promise.all([
          api.getCafeBySlug(cafeSlug),
          api.getMenu(cafeSlug),
          api.getTableStatus(cafeSlug, tableNumber, effectiveToken).catch(() => ({
            hasActiveOrders: Boolean(activeOrderId),
            gamesAllowed: Boolean(activeOrderId),
            sessionValid: false,
            gamesEnabledOverride: 'AUTO' as const,
          })),
        ]);

        setCafe(cafeData);
        setCategories(menuData.categories);
        setProducts(menuData.products);

        if (statusData.sessionValid && effectiveToken) {
          sessionStorage.setItem(storageKey, effectiveToken);
          setSessionExpired(false);
        } else {
          sessionStorage.removeItem(storageKey);
          setSessionExpired(true);
        }

        setTableStatus({
          hasActiveOrders: statusData.hasActiveOrders || Boolean(activeOrderId),
          gamesAllowed: statusData.gamesAllowed || Boolean(activeOrderId),
        });
      } catch (error) {
        console.error('Erreur chargement des données client', error);
        sessionStorage.removeItem(storageKey);
        setSessionExpired(true);
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadData();
  }, [cafeSlug, tableNumber, activeOrderId]);

  const handleAddToCart = (product: Product, selectedOptions: Record<string, string>, quantity: number, notes?: string) => {
    addToCart(product, selectedOptions, quantity, notes);

    // Trigger UpsellModal if product has cross-sell suggestions
    if (product.suggestedProducts && product.suggestedProducts.length > 0) {
      setUpsellProduct(product);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#08090e] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-400 font-bold">Connexion sécurisée à votre table...</p>
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="min-h-screen bg-[#08090e] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full bg-gradient-to-b from-[#141824] to-[#0c0e17] border border-amber-500/30 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/20 text-3xl">🔒</div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white tracking-tight">Session expirée</h1>
            <p className="text-xs text-gray-300 leading-relaxed">
              Pour des raisons de sécurité, veuillez scanner le QR Code présent sur votre table.
            </p>
          </div>
          <div className="text-[10px] text-gray-500 font-mono">{cafe?.name || 'TakTak Lounge'} • Table {tableNumber}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col selection:bg-orange-500 selection:text-white pb-16">
      {/* Table Transfer Modal (Triggered automatically on table shift) */}
      <TableChangeModal />

      {/* Header Bar */}
      <Header
        cafeName={cafe?.name || 'Monastir Lounge'}
        logoUrl={cafe?.logoUrl}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        onOpenBillSplitter={() => setIsBillSplitterOpen(true)}
        onOpenServiceModal={() => setIsServiceModalOpen(true)}
      />

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
        ) : !tableStatus.gamesAllowed ? (
          <div className="max-w-md mx-auto px-4 py-12 text-center space-y-5 animate-fadeIn">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/10 animate-bounce">
              <Gamepad2 className="w-10 h-10 text-amber-400" />
            </div>
            <div className="space-y-2">
              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Jeux réservés aux clients</span>
              <h2 className="text-lg font-black text-white">Débloquez les jeux à table</h2>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">Passez votre première commande pour jouer avec vos amis.</p>
            </div>
            <button type="button" onClick={() => setActiveTab('menu')} className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center gap-2 mx-auto active:scale-95 transition-all">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Commander pour débloquer</span>
            </button>
          </div>
        ) : (
          selectedGame === 'connect-four' ? <ConnectFourGame tableId={gameTableId} onBack={() => setSelectedGame(null)} /> : selectedGame === 'uno' ? <UnoGame tableId={gameTableId} onBack={() => setSelectedGame(null)} /> : selectedGame === 'ludo' ? <LudoGame tableId={gameTableId} onBack={() => setSelectedGame(null)} /> : selectedGame === 'chkobba' ? <ChkobbaGame tableId={gameTableId} onBack={() => setSelectedGame(null)} /> : selectedGame === 'rami' ? <RamiGame tableId={gameTableId} onBack={() => setSelectedGame(null)} /> : selectedGame === 'quiz' || selectedGame === 'truth' ? <PartyGame tableId={gameTableId} mode={selectedGame} onBack={() => setSelectedGame(null)} /> : <EntertainmentHub onSelect={setSelectedGame} onRoulette={() => setIsRouletteOpen(true)} />
        )}
      </main>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#08090e]/95 backdrop-blur-2xl border-t border-white/[0.08] py-2 px-6">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center space-y-1 py-1 transition-all duration-300 ${
              activeTab === 'menu' ? 'text-orange-400 scale-[1.05]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-[10px] font-bold">Menu</span>
          </button>

          <button
            onClick={() => { setActiveTab('games'); setSelectedGame(null); }}
            className={`flex flex-col items-center space-y-1 py-1 transition-all duration-300 ${
              activeTab === 'games' ? 'text-amber-300 scale-[1.05]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">Jeux</span>
          </button>

          <button
            onClick={() => setActiveTab('ambiance')}
            className={`flex flex-col items-center space-y-1 py-1 transition-all duration-300 relative ${
              activeTab === 'ambiance' ? 'text-purple-400 scale-[1.05]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Music className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-bold">Ambiance</span>
            <span className="absolute top-0 right-1 w-2 h-2 bg-pink-500 rounded-full" />
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center space-y-1 py-1 text-gray-500 hover:text-orange-400 relative transition-all duration-300"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-bold">Panier</span>
            {totalCount > 0 && (
              <span className="absolute -top-1 right-1 bg-orange-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
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

      {/* Bill Splitter Tool */}
      <BillSplitterModal
        isOpen={isBillSplitterOpen}
        onClose={() => setIsBillSplitterOpen(false)}
      />

      {/* Service Call & Bill Modal */}
      <ServiceModal
        cafeSlug={cafeSlug}
        tableNumber={tableNumber}
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onBillRequested={async () => {
          if (!activeOrderId || localStorage.getItem(`taktak_feedback_${activeOrderId}`)) return;
          try { const campaign = await api.getRewardCampaign(cafeSlug); if (campaign.enabled) setTimeout(() => setIsFeedbackOpen(true), 2100); } catch { /* optional feature */ }
        }}
      />

      <FeedbackRewardModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} cafeSlug={cafeSlug} orderId={activeOrderId} />

      <ChkounYkhallesModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        tableId={gameTableId}
      />
    </div>
  );
};
