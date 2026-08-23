import React, { useState } from 'react';
import { X, Bell, Receipt, CreditCard, Banknote, CheckCircle, Sparkles } from 'lucide-react';
import { api } from '../../../services/api';

interface ServiceModalProps {
  cafeSlug: string;
  tableNumber: number;
  hasActiveOrders?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onBillRequested?: () => void;
  onRequestSent?: (type: 'BILL' | 'WAITER') => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  cafeSlug,
  tableNumber,
  hasActiveOrders = false,
  isOpen,
  onClose,
  onBillRequested,
  onRequestSent,
}) => {
  const [activeTab, setActiveTab] = useState<'BILL' | 'WAITER'>(hasActiveOrders ? 'BILL' : 'WAITER');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'BILL' && !hasActiveOrders) return;
    setSubmitting(true);
    try {
      if (activeTab === 'BILL') {
        await api.sendServiceCall(cafeSlug, tableNumber, 'BILL', paymentMethod);
        onBillRequested?.();
        onRequestSent?.('BILL');
        setSuccessMsg(`Demande d'addition (${paymentMethod === 'CASH' ? 'Espèces' : 'Carte TPE'}) transmise au serveur !`);
      } else {
        await api.sendServiceCall(cafeSlug, tableNumber, 'WAITER');
        onRequestSent?.('WAITER');
        setSuccessMsg('Appel serveur transmis ! Un serveur arrive à votre table.');
      }
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      alert("Impossible de transmettre l'appel. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn transition-all">
      <div className="w-full max-w-sm bg-[#0e111a] border border-white/[0.12] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] sm:max-h-[90vh] overflow-y-auto relative animate-slideUp sm:animate-scaleUp">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-white/20 hover:bg-white/40 rounded-full mx-auto mb-2 sm:hidden cursor-pointer" onClick={onClose} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center justify-center mx-auto mb-2">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <h3 className="text-lg font-extrabold text-white">Appel & Addition</h3>
          <p className="text-xs text-gray-400">Table {tableNumber < 10 ? `0${tableNumber}` : tableNumber}</p>
        </div>

        {successMsg ? (
          <div className="py-6 text-center space-y-3 animate-scaleUp">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tab Selection */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-950 rounded-2xl border border-gray-800">
              <button
                type="button"
                disabled={!hasActiveOrders}
                onClick={() => setActiveTab('BILL')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
                  !hasActiveOrders
                    ? 'opacity-40 cursor-not-allowed text-gray-500'
                    : activeTab === 'BILL'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
                title={!hasActiveOrders ? 'Aucune commande en cours à régler' : ''}
              >
                <Receipt className="w-4 h-4" />
                <span>Addition {!hasActiveOrders ? '🔒' : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('WAITER')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === 'WAITER'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Appeler Serveur</span>
              </button>
            </div>

            {!hasActiveOrders && (
              <p className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center font-medium">
                ℹ️ L'addition s'active dès qu'une commande est passée.
              </p>
            )}

            {/* Bill options */}
            {activeTab === 'BILL' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 block">Mode de paiement souhaité :</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-2xl border flex flex-col items-center space-y-1 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-gray-950 border-gray-800 text-gray-400'
                    }`}
                  >
                    <Banknote className="w-6 h-6" />
                    <span className="text-xs font-bold">Espèces 💵</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-2xl border flex flex-col items-center space-y-1 transition-all ${
                      paymentMethod === 'CARD'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-gray-950 border-gray-800 text-gray-400'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xs font-bold">Carte / TPE 💳</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'WAITER' && (
              <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-center space-y-1">
                <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-xs text-gray-300 font-semibold">Un serveur recevra une notification prioritaire sur sa tablette.</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              disabled={submitting}
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Transmission...' : activeTab === 'BILL' ? "Envoyer la Demande d'Addition" : 'Appeler le Serveur'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
