import React, { useEffect, useState } from 'react';
import { X, Clock, ChefHat, CheckCircle2, MapPin, Sparkles, RefreshCw, Bell, UtensilsCrossed, Footprints, Check, Ban, AlertTriangle } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { stompService } from '../../services/stompService';
import { useTableSession } from '../../context/TableSessionContext';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ isOpen, onClose }) => {
  const { activeOrderId, setActiveOrderId, currentCafeSlug, currentTableNumber } = useTableSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isArchived, setIsArchived] = useState<boolean>(false);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchLatestOrder = async () => {
    if (!activeOrderId) return;
    try {
      const orders = await api.getOrdersByCafe(currentCafeSlug);
      const found = orders.find((o) => String(o.id).toLowerCase() === String(activeOrderId).toLowerCase());
      if (found) {
        if (found.status === 'ARCHIVED') {
          setIsArchived(true);
          setActiveOrderId(null);
        } else if (found.status === 'CANCELLED') {
          setIsCancelled(true);
          setActiveOrderId(null);
          setOrder(null);
        } else {
          setOrder(found);
        }
      }
    } catch (e) {
      console.error('Erreur chargement suivi commande', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !activeOrderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsArchived(false);
    setIsCancelled(false);
    setShowCancelConfirm(false);
    setCancelError(null);
    fetchLatestOrder();

    const interval = setInterval(fetchLatestOrder, 2000);

    const unsubscribe = stompService.connect(currentCafeSlug, (updatedOrder) => {
      if (updatedOrder && String(updatedOrder.id).toLowerCase() === String(activeOrderId).toLowerCase()) {
        if (updatedOrder.status === 'ARCHIVED') {
          setIsArchived(true);
          setActiveOrderId(null);
          setOrder(null);
        } else if (updatedOrder.status === 'CANCELLED') {
          setIsCancelled(true);
          setActiveOrderId(null);
          setOrder(null);
        } else {
          setOrder(updatedOrder);
        }
        setLoading(false);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isOpen, activeOrderId, currentCafeSlug, currentTableNumber]);

  if (!isOpen) return null;

  const currentStatus: OrderStatus = order?.status || 'RECEIVED';
  const canCancel = currentStatus === 'RECEIVED';

  const handleCancelOrder = async () => {
    if (!activeOrderId) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await api.updateOrderStatus(activeOrderId, 'CANCELLED');
      setIsCancelled(true);
      setActiveOrderId(null);
      setOrder(null);
    } catch (err) {
      setCancelError("La préparation a déjà démarré en cuisine ou la commande a changé de statut.");
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const getStepState = (stepStatus: OrderStatus) => {
    const statuses: OrderStatus[] = ['RECEIVED', 'PREPARING', 'READY', 'PICKED_UP', 'SERVED'];
    let currentIndex = statuses.indexOf(currentStatus);
    if (currentStatus === 'PAID' || currentStatus === 'ARCHIVED') currentIndex = 4;
    const stepIndex = statuses.indexOf(stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm glass-panel bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-5 relative" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-bold text-white">Suivi de Commande en Direct</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-gray-800 text-gray-400 hover:text-white rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCancelled ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <Ban className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Commande Annulée !</h3>
              <p className="text-xs text-gray-400 mt-1">Votre commande a bien été annulée auprès de la cuisine.</p>
            </div>
            <button
              onClick={() => {
                setIsCancelled(false);
                onClose();
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3 px-4 rounded-2xl text-xs transition-all shadow-lg shadow-orange-500/20"
            >
              Passer une Nouvelle Commande
            </button>
          </div>
        ) : isArchived ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Commande Réglée & Archivée !</h3>
              <p className="text-xs text-gray-400 mt-1">Merci pour votre visite. Votre session de suivi en direct a été réinitialisée.</p>
            </div>
            <button
              onClick={() => {
                setIsArchived(false);
                onClose();
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-3 px-4 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              Passer une Nouvelle Commande
            </button>
          </div>
        ) : loading && !order ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-400">Chargement du statut en direct...</p>
          </div>
        ) : (
          <>
            {/* Order Meta Info */}
            <div className="bg-gray-800/80 p-3 rounded-2xl border border-gray-700/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">N° de commande</span>
                <span className="font-extrabold text-white">#{activeOrderId ? activeOrderId.slice(-6).toUpperCase() : '001'}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block text-[10px]">Emplacement</span>
                <span className="font-bold text-orange-400 inline-flex items-center">
                  <MapPin className="w-3 h-3 mr-1" /> Table {currentTableNumber}
                </span>
              </div>
            </div>

            {cancelError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-2xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            {/* Live Timeline */}
            <div className="space-y-4 py-2">
              {/* Step 1: RECEIVED */}
              <div className="flex items-start space-x-3">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                    getStepState('RECEIVED') === 'completed' || getStepState('RECEIVED') === 'active'
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">1. Reçue 📥</h4>
                  <p className="text-[11px] text-gray-400">Commande transmise en cuisine</p>
                </div>
              </div>

              <div className="w-0.5 h-4 bg-gray-800 ml-4 -my-2" />

              {/* Step 2: PREPARING */}
              <div className="flex items-start space-x-3">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                    getStepState('PREPARING') === 'active'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 animate-pulse'
                      : getStepState('PREPARING') === 'completed'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">2. En Préparation 👨‍🍳</h4>
                  <p className="text-[11px] text-gray-400">Le barista prépare votre commande</p>
                </div>
              </div>

              <div className="w-0.5 h-4 bg-gray-800 ml-4 -my-2" />

              {/* Step 3: READY */}
              <div className="flex items-start space-x-3">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                    getStepState('READY') === 'active'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-bounce'
                      : getStepState('READY') === 'completed'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">3. Prête au Comptoir 🔔</h4>
                  <p className="text-[11px] text-gray-400">Commande prête au bar</p>
                </div>
              </div>

              <div className="w-0.5 h-4 bg-gray-800 ml-4 -my-2" />

              {/* Step 4: PICKED_UP */}
              <div className="flex items-start space-x-3">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                    getStepState('PICKED_UP') === 'active'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 animate-pulse'
                      : getStepState('PICKED_UP') === 'completed'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}
                >
                  <Footprints className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">4. Récupérée par le Serveur 🏃‍♂️</h4>
                  <p className="text-[11px] text-gray-400">Le serveur vous apporte le plateau !</p>
                </div>
              </div>

              <div className="w-0.5 h-4 bg-gray-800 ml-4 -my-2" />

              {/* Step 5: SERVED */}
              <div className="flex items-start space-x-3">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                    getStepState('SERVED') === 'active' || getStepState('SERVED') === 'completed'
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">5. Servie à Table 🍽️</h4>
                  <p className="text-[11px] text-gray-400">Bonne dégustation !</p>
                </div>
              </div>
            </div>

            {/* Order Items Summary */}
            {order?.items && order.items.length > 0 && (
              <div className="bg-gray-950/60 p-3.5 rounded-2xl border border-gray-800 max-h-32 overflow-y-auto no-scrollbar space-y-1.5 text-xs">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Récapitulatif</p>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-gray-300">
                    <span>{item.quantity}x {item.productName}</span>
                    <span className="font-semibold text-orange-400">{(item.unitPrice * item.quantity).toFixed(3)} TND</span>
                  </div>
                ))}
              </div>
            )}

            {/* Cancel Order Section (Allowed if status is RECEIVED) */}
            {canCancel && (
              <div className="pt-1">
                {showCancelConfirm ? (
                  <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-2xl space-y-3 animate-fadeIn">
                    <p className="text-xs font-bold text-red-200 text-center">
                      Voulez-vous vraiment annuler votre commande ?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition-all"
                      >
                        Conserver
                      </button>
                      <button
                        disabled={cancelling}
                        onClick={handleCancelOrder}
                        className="py-2 px-3 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-red-500/20 disabled:opacity-50"
                      >
                        {cancelling ? 'Annulation...' : 'Oui, annuler'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-2.5 px-4 rounded-2xl text-xs transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Annuler ma commande</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-2xl text-xs transition-all"
            >
              Fermer
            </button>
          </>
        )}
      </div>
    </div>
  );
};

