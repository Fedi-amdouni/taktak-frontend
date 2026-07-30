import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, selectedOptions: Record<string, string>, quantity: number, notes?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'taktak_cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart]);

  const addToCart = (
    product: Product,
    selectedOptions: Record<string, string>,
    quantity: number,
    notes?: string
  ) => {
    // Generate notes string from options
    const optionSummaries = Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`);
    if (notes?.trim()) optionSummaries.push(notes.trim());
    const finalNotes = optionSummaries.join(' | ');

    // Calculate extra option costs if any (+1.000 TND in title string)
    let extraCost = 0;
    Object.values(selectedOptions).forEach((optVal) => {
      const match = optVal.match(/\(\+([\d.]+)\s*TND\)/);
      if (match && match[1]) {
        extraCost += parseFloat(match[1]);
      }
    });

    const itemUnitPrice = product.price + extraCost;
    const cartItemId = `${product.id}-${JSON.stringify(selectedOptions)}-${finalNotes}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [
        ...prevCart,
        {
          id: cartItemId,
          productId: product.id,
          productName: product.name,
          unitPrice: itemUnitPrice,
          quantity,
          selectedOptions,
          notes: finalNotes,
          imageUrl: product.imageUrl,
        },
      ];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart doit être utilisé au sein d\'un CartProvider');
  }
  return context;
};
