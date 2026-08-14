import React, { useState } from 'react';
import { ShoppingBag, Calculator, Clock, MapPin, Sparkles, Bell, Globe } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { useTableSession } from '../../../context/TableSessionContext';

interface HeaderProps {
  cafeName: string;
  logoUrl?: string;
  onOpenCart: () => void;
  onOpenOrderTracker: () => void;
  onOpenBillSplitter: () => void;
  onOpenServiceModal: () => void;
}

export type Language = 'FR' | 'AR' | 'EN';

export const Header: React.FC<HeaderProps> = ({
  cafeName,
  logoUrl,
  onOpenCart,
  onOpenOrderTracker,
  onOpenBillSplitter,
  onOpenServiceModal,
}) => {
  const { totalCount, totalPrice } = useCart();
  const { currentTableNumber, activeOrderId } = useTableSession();
  const [lang, setLang] = useState<Language>('FR');

  const langFlags: Record<Language, string> = {
    FR: '🇫🇷',
    AR: '🇹🇳',
    EN: '🇬🇧',
  };

  const cycleLanguage = () => {
    const nextLang: Record<Language, Language> = { FR: 'AR', AR: 'EN', EN: 'FR' };
    setLang(nextLang[lang]);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.04] px-4 py-3 shadow-2xl" style={{
      background: 'linear-gradient(180deg, rgba(8, 9, 14, 0.95) 0%, rgba(8, 9, 14, 0.88) 100%)',
      backdropFilter: 'blur(24px) saturate(150%)',
    }}>
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo & Cafe Title */}
        <div className="flex items-center space-x-3">
          {logoUrl ? (
            <img src={logoUrl} alt={cafeName} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-orange-500/30 shadow-lg shadow-orange-500/10" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-lg shadow-orange-500/25 animate-glow-pulse">
              TT
            </div>
          )}
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-[15px] font-extrabold text-white tracking-tight">{cafeName}</h1>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-float" />
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5">
              <span className="inline-flex items-center text-orange-300 font-semibold bg-orange-500/[0.08] px-2.5 py-0.5 rounded-full border border-orange-500/15">
                <MapPin className="w-3 h-3 mr-1 text-orange-400" /> Table {currentTableNumber < 10 ? `0${currentTableNumber}` : currentTableNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5">
          {/* Language Switcher */}
          <button
            onClick={cycleLanguage}
            className="px-2.5 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 rounded-2xl border border-white/[0.06] text-xs font-bold flex items-center space-x-1 transition-all duration-300 active:scale-95"
            title="Changer de langue"
          >
            <span>{langFlags[lang]}</span>
            <span className="text-[10px] font-mono text-gray-400">{lang}</span>
          </button>

          {/* Active Order Tracker Button */}
          {activeOrderId && (
            <button
              onClick={onOpenOrderTracker}
              className="relative p-2.5 bg-amber-500/[0.08] hover:bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/20 transition-all duration-300 active:scale-95"
              title="Suivi de commande"
            >
              <Clock className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full" />
            </button>
          )}

          {/* Service & Bill Call Button */}
          <button
            onClick={onOpenServiceModal}
            className="p-2.5 bg-white/[0.04] hover:bg-orange-500/10 text-gray-400 hover:text-orange-400 rounded-2xl border border-white/[0.06] hover:border-orange-500/20 transition-all duration-300 active:scale-95"
            title="Appel Serveur & Addition"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* Bill Splitter Button */}
          <button
            onClick={onOpenBillSplitter}
            className="p-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-gray-200 rounded-2xl border border-white/[0.06] transition-all duration-300 active:scale-95"
            title="Diviser l'addition"
          >
            <Calculator className="w-5 h-5" />
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-3.5 py-2.5 rounded-2xl shadow-lg shadow-orange-500/20 font-semibold transition-all duration-300 active:scale-95"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            {totalCount > 0 && (
              <span className="text-[11px] font-bold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {totalCount} • {totalPrice.toFixed(3)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
