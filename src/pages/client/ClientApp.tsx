import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UtensilsCrossed, Tv, ShoppingBag, Gamepad2 } from 'lucide-react';
import { Header } from './components/Header';
import { GuestStatusPanel } from './components/GuestStatusPanel';
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
  const [waiterRequest, setWaiterRequest] = useState<'WAITER' | 'BILL' | null>(null);
  const [selectedGame, setSelectedGame] = useState<EntertainmentGame | null>(null);
  const [tableStatus, setTableStatus] = useState<{ hasActiveOrders: boolean; gamesAllowed: boolean }>({
    hasActiveOrders: false,
    gamesAllowed: false,
  });
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const gameTableId = `${cafeSlug}-${tableNumber}`;
  const orderingEnabled = cafe?.orderingEnabled ?? true;
  const waiterCallsEnabled = cafe?.waiterCallsEnabled ?? true;
  const gamesEnabled = cafe?.gamesEnabled ?? true;
  const ambianceVotingEnabled = cafe?.ambianceVotingEnabled ?? true;
  const rewardsEnabled = cafe?.rewardsEnabled ?? true;

  useEffect(() => {
    // Initialize session and trigger table change detection
    initializeSession(cafeSlug, tableNumber);

    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get('token');
    const storageKey = `taktak_table_token_${cafeSlug}_${tableNumber}`;
    const effectiveToken = urlToken || sessionStorage.getItem(storageKey);

    // Fetch Cafe & Menu & Table Status
    const loadData = async () => {
      try {
        setIsLoadingSession(true);
        const [cafeData, menuData, statusData] = await Promise.all([
          api.getCafeBySlug(cafeSlug),
          api.getMenu(cafeSlug),
          api.getTableStatus(cafeSlug, tableNumber, effectiveToken).catch(() => ({ hasActiveOrders: Boolean(activeOrderId), gamesAllowed: Boolean(activeOrderId), sessionValid: false })),
        ]);
        setCafe(cafeData);
        setCategories(menuData.categories);
        setProducts(menuData.products);

        // Le serveur valide le jeton sans jamais révéler sa valeur au client.
        // Si le jeton est valide, on le sauvegarde en sessionStorage pour résister aux rechargements de page (F5).
        // En cas de jeton invalide ou expiré, on nettoie le sessionStorage et l'accès est bloqué.
        if (statusData?.sessionValid && effectiveToken) {
          sessionStorage.setItem(storageKey, effectiveToken);
          setSessionExpired(false);
        } else {
          sessionStorage.removeItem(storageKey);
          setSessionExpired(true);
        }

        if (statusData) {
          setTableStatus({
            hasActiveOrders: statusData.hasActiveOrders || Boolean(activeOrderId),
            gamesAllowed: statusData.gamesAllowed || Boolean(activeOrderId),
          });
        }
      } catch (e) {
        console.error('Erreur chargement données client', e);
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

          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/20 text-3xl">
            🔒
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black text-white tracking-tight">Session Expirée</h1>
            <p className="text-xs text-gray-300 leading-relaxed">
              Pour des raisons de sécurité et pour garantir que vous êtes bien présent à la <strong className="text-amber-400">Table {tableNumber}</strong>, l'accès direct par lien manuel est désactivé.
            </p>
          </div>

          <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1">
            <p className="text-[11px] font-bold text-amber-300">
              📸 Veuillez scanner le QR Code présent sur votre table
            </p>
            <p className="text-[10px] text-gray-400">
              Chaque table dispose d'un QR code sécurisé avec jeton dynamique mis à jour à chaque client.
            </p>
          </div>

          <div className="text-[10px] text-gray-500 font-mono">
            {cafe?.name || 'TakTak Lounge'} • Table {tableNumber}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090e] text-gray-100 flex flex-col selection:bg-orange-500 selection:text-white pb-16">
      {/* Table Transfer Modal (Triggered automatically on table shift) */}
      <TableChangeModal />

      {/* Header Bar */}
      <Header
        cafeName={cafe?.name || 'Monastir Lounge'}
        logoUrl={cafe?.logoUrl}
        waiterCallsEnabled={waiterCallsEnabled}
        onOpenServiceModal={() => setIsServiceModalOpen(true)}
      />

      <GuestStatusPanel
        activeOrderId={activeOrderId}
        waiterRequest={waiterRequest}
        onOpenOrder={() => setIsOrderTrackerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'menu' ? (
          <MenuCatalog
            categories={categories}
            products={products}
            orderingEnabled={orderingEnabled}
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
              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                🔒 Jeux Réservés aux Clients
              </span>
              <h2 className="text-lg font-black text-white">Débloquez les Jeux à Table</h2>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Passez votre première commande pour activer instantanément la <strong className="text-white">Chkobba, Rami, Uno, Ludo et Quiz</strong> avec vos amis !
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center gap-2 mx-auto active:scale-95 transition-all"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Commander pour Débloquer 🔓</span>
            </button>
          </div>
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080a10]/95 backdrop-blur-2xl border-t border-white/[0.08] py-2 px-2">
        <div className="max-w-md w-full mx-auto flex items-center justify-around">
          {/* Menu Tab */}
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-1 flex-col items-center space-y-1 py-1 px-1 rounded-2xl transition-all duration-300 ${
              activeTab === 'menu'
                ? 'text-orange-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-[10px] font-black">Menu</span>
          </button>

          {gamesEnabled && <button
            onClick={() => {
              setActiveTab('games');
              setSelectedGame(null);
            }}
            className={`flex flex-1 flex-col items-center space-y-1 py-1 px-1 rounded-2xl transition-all duration-300 ${
              activeTab === 'games'
                ? 'text-amber-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-black">Jeux</span>
          </button>}

          {ambianceVotingEnabled && <button
            onClick={() => setActiveTab('ambiance')}
            className={`flex flex-1 flex-col items-center space-y-1 py-1 px-1 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'ambiance'
                ? 'text-purple-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Tv className="w-5 h-5" />
            <span className="text-[10px] font-black">Ambiance</span>
          </button>
          }

          {orderingEnabled && <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-1 flex-col items-center space-y-1 py-1 px-1 rounded-2xl text-gray-400 hover:text-orange-400 relative transition-all duration-300 active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-black">Panier</span>
            {totalCount > 0 && (
              <span className="absolute -top-0.5 right-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                {totalCount}
              </span>
            )}
          </button>}
        </div>
      </nav>

      {/* Item Customization Modal */}
      {orderingEnabled && <ProductModal
        product={selectedProduct}
        allProducts={products}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />}

      {/* Upsell Cross-Selling Modal */}
      {orderingEnabled && upsellProduct && (
        <UpsellModal
          sourceProduct={upsellProduct}
          isOpen={!!upsellProduct}
          onClose={() => setUpsellProduct(null)}
          onViewCart={() => setIsCartOpen(true)}
        />
      )}

      {/* Cart Drawer */}
      {orderingEnabled && <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderCreated={() => setIsOrderTrackerOpen(true)}
        onOpenRoulette={() => setIsRouletteOpen(true)}
        gamesEnabled={gamesEnabled}
      />}

      {/* Real-time Order Tracker */}
      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
      />

      {/* Service Call & Bill Modal */}
      {waiterCallsEnabled && <ServiceModal
        cafeSlug={cafeSlug}
        tableNumber={tableNumber}
        hasActiveOrders={tableStatus.hasActiveOrders}
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onRequestSent={(type) => setWaiterRequest(type)}
        onBillRequested={async () => {
          if (!activeOrderId || localStorage.getItem(`taktak_feedback_${activeOrderId}`)) return;
          try {
            const campaign = await api.getRewardCampaign(cafeSlug);
            if (rewardsEnabled && campaign.enabled) setTimeout(() => setIsFeedbackOpen(true), 2100);
          } catch {
            /* optional */
          }
        }}
      />}

      {rewardsEnabled && <FeedbackRewardModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        cafeSlug={cafeSlug}
        orderId={activeOrderId}
      />}

      {gamesEnabled && <ChkounYkhallesModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        tableId={gameTableId}
      />}
    </div>
  );
};
