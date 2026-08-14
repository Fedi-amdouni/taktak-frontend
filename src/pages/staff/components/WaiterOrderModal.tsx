import React, { useEffect, useState } from 'react';
import { ArrowLeft, Minus, Plus, Send, ShoppingBag, Trash2, X } from 'lucide-react';
import { CartItem, Category, Product, TableEntity } from '../../../types';
import { api } from '../../../services/api';
import { formatTableCode } from '../../../utils/tableCode';
import { MenuCatalog } from '../../client/components/MenuCatalog';
import { ProductModal } from '../../client/components/ProductModal';

interface Props {
  cafeSlug: string;
  table: TableEntity | null;
  onClose: () => void;
  onOrderCreated: () => void;
}

export const WaiterOrderModal: React.FC<Props> = ({ cafeSlug, table, onClose, onOrderCreated }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!table) return;
    void api.getMenu(cafeSlug).then((menu) => {
      setCategories(menu.categories || []);
      setProducts(menu.products || []);
    });
  }, [cafeSlug, table]);

  if (!table) return null;

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const addToCart = (product: Product, selectedOptions: Record<string, string>, quantity: number, notes?: string) => {
    const optionExtra = Object.values(selectedOptions).reduce((sum, value) => {
      const match = value.match(/\(\+([\d.]+)\s*TND\)/);
      return sum + (match ? Number(match[1]) : 0);
    }, 0);
    const id = `${product.id}-${JSON.stringify(selectedOptions)}-${notes || ''}`;
    setCart((current) => {
      const existing = current.find((item) => item.id === id);
      if (existing) return current.map((item) => item.id === id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...current, { id, productId: product.id, productName: product.name, unitPrice: product.price + optionExtra, quantity, selectedOptions, notes, imageUrl: product.imageUrl }];
    });
  };

  const updateQuantity = (id: string, delta: number) => setCart((current) => current
    .map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
    .filter((item) => item.quantity > 0));

  const submit = async () => {
    if (!cart.length || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.createOrder({
        cafeSlug,
        tableNumber: table.tableNumber,
        totalPrice,
        items: cart.map(({ productId, productName, quantity, unitPrice, selectedOptions, notes }) => ({ productId, productName, quantity, unitPrice, selectedOptions, notes })),
      });
      onOrderCreated();
      onClose();
    } catch {
      alert("Impossible d'envoyer la commande. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#08090e] text-white overflow-y-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0d0f18]/95 px-4 py-3 backdrop-blur-xl">
        <button onClick={onClose} className="flex items-center gap-2 text-xs font-bold text-gray-300"><ArrowLeft className="h-4 w-4" /> Plan 2D</button>
        <div className="text-center"><p className="text-[10px] uppercase tracking-widest text-gray-500">Nouvelle commande</p><p className="text-sm font-black text-orange-400">Table {formatTableCode(table.tableCode, table.tableNumber)}</p></div>
        <button onClick={() => setShowCart(true)} className="relative rounded-xl bg-orange-500 p-2.5 text-white"><ShoppingBag className="h-4 w-4" />{totalCount > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-black text-orange-600">{totalCount}</span>}</button>
      </div>

      <MenuCatalog categories={categories} products={products} onSelectProduct={setSelectedProduct} />
      <ProductModal product={selectedProduct} allProducts={products} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />

      {showCart && <div className="fixed inset-0 z-[80] flex items-end bg-black/75" onClick={() => setShowCart(false)}><div className="max-h-[88vh] w-full rounded-t-3xl border border-white/10 bg-[#0d0f18] p-5" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-black">Commande serveur</h2><p className="text-xs text-gray-500">Table {formatTableCode(table.tableCode, table.tableNumber)}</p></div><button onClick={() => setShowCart(false)} className="rounded-xl bg-white/5 p-2"><X className="h-5 w-5" /></button></div>
        <div className="max-h-[52vh] space-y-2 overflow-y-auto">
          {cart.length === 0 ? <p className="py-12 text-center text-sm text-gray-500">Aucun produit ajouté</p> : cart.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3">
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.productName}</p><p className="text-[11px] font-black text-orange-400">{(item.unitPrice * item.quantity).toFixed(3)} TND</p></div>
            <button onClick={() => updateQuantity(item.id, -1)} className="rounded-lg bg-white/10 p-1.5"><Minus className="h-3 w-3" /></button><span className="w-5 text-center text-xs font-black">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="rounded-lg bg-orange-500 p-1.5"><Plus className="h-3 w-3" /></button><button onClick={() => setCart((current) => current.filter((entry) => entry.id !== item.id))} className="p-1.5 text-red-400"><Trash2 className="h-4 w-4" /></button>
          </div>)}
        </div>
        {cart.length > 0 && <div className="mt-4 border-t border-white/10 pt-4"><div className="mb-3 flex justify-between font-black"><span>Total</span><span className="text-orange-400">{totalPrice.toFixed(3)} TND</span></div><button onClick={submit} disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-sm font-black disabled:opacity-50"><Send className="h-4 w-4" />{isSubmitting ? 'Envoi…' : 'Envoyer en cuisine'}</button></div>}
      </div></div>}
    </div>
  );
};
