import React, { useState } from 'react';
import { ShoppingBag, Calculator, Clock, MapPin, Sparkles, Bell, Globe, ChevronDown, Check } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { useTableSession } from '../../../context/TableSessionContext';

interface HeaderProps {
  cafeName: string;
  logoUrl?: string;
  onOpenCart: () => void;
  onOpenOrderTracker: () => void;
  onOpenServiceModal: () => void;
  onOpenRewardModal?: () => void;
}

export type Language = 'FR' | 'AR' | 'EN';

const LANGUAGES: Array<{ code: Language; label: string; flag: string }> = [
  { code: 'FR', label: 'Français', flag: '🇫🇷' },
  { code: 'AR', label: 'العربية', flag: '🇹🇳' },
  { code: 'EN', label: 'English', flag: '🇬🇧' },
];

export const Header: React.FC<HeaderProps> = ({
  cafeName,
  logoUrl,
  onOpenCart,
  onOpenOrderTracker,
  onOpenServiceModal,
  onOpenRewardModal,
}) => {
  const { totalCount, totalPrice } = useCart();
  const { currentTableNumber, activeOrderId } = useTableSession();
  const [lang, setLang] = useState<Language>('FR');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header
      className="sticky top-0 z-30 border-b border-white/[0.06] px-4 py-2.5 shadow-2xl transition-all"
      style={{
        background: 'linear-gradient(180deg, rgba(10, 12, 19, 0.96) 0%, rgba(8, 9, 14, 0.92) 100%)',
        backdropFilter: 'blur(24px) saturate(160%)',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Cafe Logo & Table Identification */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={cafeName}
                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-orange-500/40 shadow-lg shadow-orange-500/10"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-lg shadow-orange-500/25">
                TT
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#08090e] rounded-full" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1">
              <h1 className="text-sm font-black text-white tracking-tight truncate max-w-[130px] sm:max-w-[180px]">
                {cafeName}
              </h1>
              <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0 animate-float" />
            </div>
            <div className="flex items-center space-x-1.5 text-xs mt-0.5">
              <span className="inline-flex items-center text-amber-300 font-extrabold bg-amber-500/[0.12] px-2 py-0.5 rounded-full border border-amber-500/25 text-[10px]">
                <MapPin className="w-2.5 h-2.5 mr-0.5 text-amber-400" />
                Table {currentTableNumber < 10 ? `0${currentTableNumber}` : currentTableNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="px-2 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 rounded-xl border border-white/[0.08] text-xs font-bold flex items-center space-x-1 transition-all active:scale-95"
              title="Changer de langue"
            >
              <span>{currentLangObj.flag}</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase">{currentLangObj.code}</span>
              <ChevronDown className="w-2.5 h-2.5 text-gray-500" />
            </button>

            {isLangMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsLangMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-32 bg-[#121624] border border-white/[0.12] rounded-2xl p-1.5 shadow-2xl z-50 animate-scaleUp">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        lang === l.code
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'text-gray-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </span>
                      {lang === l.code && <Check className="w-3 h-3 text-amber-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Active Order Tracker Button */}
          {activeOrderId && (
            <button
              onClick={onOpenOrderTracker}
              className="relative p-2 bg-amber-500/[0.12] hover:bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 transition-all active:scale-95"
              title="Suivi de commande"
            >
              <Clock className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full" />
            </button>
          )}

          {/* Feedback & Gift Reward Trigger */}
          {onOpenRewardModal && (
            <button
              onClick={onOpenRewardModal}
              className="relative p-2 bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 text-amber-300 rounded-xl border border-amber-500/30 transition-all active:scale-95 group"
              title="Avis & Récompenses VIP"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            </button>
          )}

          {/* Service & Bill Call Button */}
          <button
            onClick={onOpenServiceModal}
            className="p-2 bg-white/[0.04] hover:bg-orange-500/15 text-gray-400 hover:text-orange-400 rounded-xl border border-white/[0.08] hover:border-orange-500/30 transition-all active:scale-95"
            title="Appel Serveur & Addition"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Cart Header Badge Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center space-x-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-3 py-2 rounded-xl shadow-lg shadow-orange-500/20 font-bold transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalCount > 0 && (
              <span className="text-[10px] font-black bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded-lg">
                {totalCount} • {totalPrice.toFixed(3)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
