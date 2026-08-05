import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ChefHat, Flame, Bell, CheckCircle, RefreshCw, Volume2, VolumeX, Sun, Activity, Clock } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatTableNumber } from '../utils/tableCode';
import { api } from '../services/api';
import { stompService } from '../services/stompService';

export const KitchenDashboard: React.FC = () => {
  const { cafeSlug = 'monastir-lounge' } = useParams<{ cafeSlug: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = getAudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  };

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setWakeLockActive(true);
      } catch (err) {
        console.warn('WakeLock request failed:', err);
      }
    }
  };

  const loadOrders = async () => {
    try {
      const list = await api.getOrdersByCafe(cafeSlug);
      if (Array.isArray(list)) {
        setOrders(list.filter((o) => o && o.status !== 'ARCHIVED' && o.status !== 'CANCELLED'));
      }
    } catch (e) {
      console.error('Erreur chargement cuisine', e);
    }
  };

  useEffect(() => {
    loadOrders();
    requestWakeLock();

    const unsubscribe = stompService.connect(
      cafeSlug,
      (incomingOrder) => {
        if (!incomingOrder || !incomingOrder.id) return;
        playChime();

        setOrders((prev) => {
          const cleanPrev = (prev || []).filter(Boolean);
          const idx = cleanPrev.findIndex((o) => String(o.id).toLowerCase() === String(incomingOrder.id).toLowerCase());
          if (idx > -1) {
            const updated = [...cleanPrev];
            updated[idx] = incomingOrder;
            return updated.filter((o) => o.status !== 'ARCHIVED' && o.status !== 'CANCELLED');
          } else {
            return [incomingOrder, ...cleanPrev];
          }
        });
      },
      () => {},
      () => void loadOrders()
    );

    const reconciliationTimer = window.setInterval(() => void loadOrders(), 10000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void loadOrders();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
      window.clearInterval(reconciliationTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribe();
    };
  }, [cafeSlug, soundEnabled]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus);
      if (updated && updated.id) {
        setOrders((prev) =>
          prev.map((o) => (String(o.id).toLowerCase() === String(orderId).toLowerCase() ? updated : o))
        );
      }
    } catch (e) {
      console.error('Erreur mise à jour statut cuisine', e);
    }
  };

  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  const toggleItemDone = (key: string) => {
    setCompletedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const pendingOrders = orders.filter((o) => o.status === 'RECEIVED');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  return (
    <div className="min-h-screen bg-[#08090e] text-white p-4 sm:p-6 space-y-6 relative">
      {/* Top Bar */}
      <header className="glass-panel p-4 rounded-3xl flex items-center justify-between gap-4 border border-white/[0.08]">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-br from-orange-500 via-amber-500 to-red-500 rounded-2xl shadow-lg shadow-orange-500/25 text-white animate-glow-pulse">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Écran Cuisine KDS</h1>
            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5">
              <span className="flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <Activity className="w-3 h-3" />
                <span>En Direct</span>
              </span>
              {wakeLockActive && (
                <span className="flex items-center space-x-1 text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Sun className="w-3 h-3" />
                  <span>Écran Allumé</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Counters */}
        <div className="hidden md:flex items-center space-x-3 text-xs font-extrabold">
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3.5 py-2 rounded-2xl flex items-center space-x-1.5">
            <span>En Attente:</span>
            <span className="text-sm font-black text-white">{pendingOrders.length}</span>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3.5 py-2 rounded-2xl flex items-center space-x-1.5">
            <span>En Préparation:</span>
            <span className="text-sm font-black text-white">{preparingOrders.length}</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-2 rounded-2xl flex items-center space-x-1.5">
            <span>Prêtes au Bar:</span>
            <span className="text-sm font-black text-white">{readyOrders.length}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-2xl border transition-all ${
              soundEnabled
                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                : 'bg-white/[0.04] border-white/[0.06] text-gray-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={loadOrders}
            className="p-3 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 rounded-2xl border border-white/[0.06] transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="text-center py-28 glass-panel rounded-3xl max-w-md mx-auto">
          <ChefHat className="w-16 h-16 text-gray-700 mx-auto mb-4 animate-bounce" />
          <h2 className="text-lg font-bold text-gray-400">Aucune commande en préparation</h2>
          <p className="text-xs text-gray-600 mt-1">Les nouvelles commandes bips apparaitront immédiatement ici</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => {
            const isPending = order.status === 'RECEIVED';
            const isPreparing = order.status === 'PREPARING';
            const isReady = order.status === 'READY';
            const isPickedUp = order.status === 'PICKED_UP';
            const isServed = order.status === 'SERVED';

            return (
              <div
                key={order.id}
                className={`glass-panel p-5 rounded-3xl border flex flex-col justify-between space-y-4 shadow-2xl transition-all duration-300 ${
                  isPending
                    ? 'border-amber-500/40 bg-amber-500/[0.04] animate-glow-pulse'
                    : isPreparing
                    ? 'border-orange-500/40 bg-orange-500/[0.04]'
                    : isReady
                    ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                    : isPickedUp
                    ? 'border-blue-500/40 bg-blue-500/[0.04]'
                    : 'border-white/[0.06] opacity-70'
                }`}
              >
                {/* Order Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-500/25">
                      T{formatTableNumber(order.tableNumber)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Table {formatTableNumber(order.tableNumber)}</span>
                      <span className="text-[10px] text-gray-400 flex items-center mt-0.5">
                        <Clock className="w-3 h-3 mr-1 text-gray-500" />
                        {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        📥 Reçue
                      </span>
                    )}
                    {isPreparing && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        👨‍🍳 En Cuisine
                      </span>
                    )}
                    {isReady && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        🔔 Prête au Bar
                      </span>
                    )}
                    {isPickedUp && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        🏃‍♂️ En Cours de Livraison
                      </span>
                    )}
                    {isServed && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-500/20 text-gray-300 border border-gray-500/30">
                        🍽️ Servie à Table
                      </span>
                    )}
                  </div>
                </div>

                {/* Items List with interactive completion toggle */}
                <div className="space-y-2.5 flex-1">
                  {order.items.map((item, idx) => {
                    const itemKey = `${order.id}_${idx}`;
                    const isDone = completedItems[itemKey];

                    return (
                      <div
                        key={idx}
                        onClick={() => toggleItemDone(itemKey)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 opacity-60'
                            : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-extrabold ${isDone ? 'line-through text-emerald-300' : 'text-white'}`}>
                            {isDone && '✓ '}
                            {item.productName}
                          </span>
                          <span className="text-xs font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/20">
                            x{item.quantity}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] font-medium text-amber-300/90 mt-1 italic bg-amber-500/10 p-1.5 rounded-xl border border-amber-500/15">
                            💬 "{item.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="pt-2">
                  {isPending && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all duration-300 active:scale-95"
                    >
                      <Flame className="w-4 h-4" />
                      <span className="text-xs">Lancer la Préparation</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                      className="w-full bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all duration-300 active:scale-95"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="text-xs">Commande Prête (Aviser Salle)</span>
                    </button>
                  )}

                  {isReady && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                      <span className="text-xs font-extrabold text-emerald-400 block flex items-center justify-center space-x-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>En attente de prise en charge par l'équipe en salle...</span>
                      </span>
                    </div>
                  )}

                  {isPickedUp && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
                      <span className="text-xs font-extrabold text-blue-400 block">
                        🏃‍♂️ En cours de livraison à table
                      </span>
                    </div>
                  )}

                  {isServed && (
                    <div className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl text-center">
                      <span className="text-xs font-bold text-gray-400">Servie à table par l'équipe salle</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
