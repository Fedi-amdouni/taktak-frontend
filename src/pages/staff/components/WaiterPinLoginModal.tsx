import React, { useState, useEffect } from 'react';
import { UserCheck, Lock, Delete, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { Waiter } from '../../../types';
import { api } from '../../../services/api';

interface WaiterPinLoginModalProps {
  cafeSlug: string;
  isOpen: boolean;
  onLoginSuccess: (waiter: Waiter) => void;
}

export const WaiterPinLoginModal: React.FC<WaiterPinLoginModalProps> = ({
  cafeSlug,
  isOpen,
  onLoginSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [waiters, setWaiters] = useState<Waiter[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      api.getActiveWaiters(cafeSlug)
        .then(setWaiters)
        .catch((err) => console.warn('Erreur chargement serveurs', err));
    }
  }, [isOpen, cafeSlug]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(null);
      if (newPin.length === 4) {
        submitPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const submitPin = async (pinToSubmit: string) => {
    setLoading(true);
    setError(null);
    try {
      const waiter = await api.loginWaiter(cafeSlug, pinToSubmit);
      onLoginSuccess(waiter);
    } catch (err: any) {
      setError('Code PIN incorrect. Veuillez réessayer.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn transition-all">
      <div className="w-full max-w-sm bg-[#0e111a] border border-white/[0.12] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden animate-slideUp sm:animate-scaleUp">
        {/* Glow decoration */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-500/25 animate-glow-pulse">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Service en Salle - Connexion</h2>
          <p className="text-xs text-gray-400 font-medium">Entrez votre code PIN à 4 chiffres</p>
        </div>

        {/* Demo profiles hint */}
        {waiters.length > 0 && (
          <div className="bg-white/[0.03] p-2.5 rounded-2xl border border-white/[0.05]">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block text-center mb-1">
              Comptes Démo PIN
            </span>
            <div className="flex items-center justify-center space-x-2">
              {waiters.map((w) => (
                <span
                  key={w.id}
                  className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20"
                >
                  👤 {w.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PIN Dots display */}
        <div className="flex justify-center items-center space-x-3 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  isFilled
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 scale-125 shadow-lg shadow-orange-500/40 ring-2 ring-orange-500/30'
                    : 'bg-white/10 border border-white/20'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-2.5 rounded-2xl flex items-center justify-center space-x-2 text-red-400 text-xs font-bold animate-pulse">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad 0-9 */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              disabled={loading}
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-white/[0.04] hover:bg-orange-500/20 hover:border-orange-500/40 border border-white/[0.06] text-white font-extrabold text-xl flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={loading || pin.length === 0}
            className="h-14 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-gray-400 text-xs font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
          >
            C
          </button>
          <button
            disabled={loading}
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-white/[0.04] hover:bg-orange-500/20 hover:border-orange-500/40 border border-white/[0.06] text-white font-extrabold text-xl flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
            className="h-14 rounded-2xl bg-white/[0.02] hover:bg-red-500/20 hover:text-red-400 border border-white/[0.04] text-gray-400 flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
