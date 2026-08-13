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
import { useTableSession } from '../../context/TableSessionContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { Cafe, Category, Product } from '../../types';

export const ClientApp: React.FC = () => {
  const { cafeSlug = 'monastir-lounge', tableId = '05' } = useParams<{ cafeSlug: string; tableId: string }>();
  const tableNumber = parseInt(tableId, 10) || 5;

  const { initializeSession } = useTableSession();
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
      />

      <ChkounYkhallesModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        tableId={gameTableId}
      />
    </div>
  );
};
