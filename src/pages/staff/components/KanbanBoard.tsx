import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, Volume2, VolumeX, RefreshCw, Sparkles, Zap, Bell, CheckCircle, Sun, Activity, MapPin, Filter, Lock, Calendar, Archive, Flame, UtensilsCrossed, Layout, List } from 'lucide-react';
import { Order, OrderStatus, ServiceCall, Waiter, TableEntity, FloorPlan, FloorObstacle } from '../../../types';
import { api } from '../../../services/api';
import { stompService } from '../../../services/stompService';
import { OrderCard } from './OrderCard';
import { TableShiftAlert } from './TableShiftAlert';
import { StockQuickToggleModal } from './StockQuickToggleModal';
import { WaiterPinLoginModal } from './WaiterPinLoginModal';
import { TableZoneSelectorModal } from './TableZoneSelectorModal';
import { InteractiveFloorPlan } from './InteractiveFloorPlan';
import { formatTableNumber } from '../../../utils/tableCode';

interface KanbanBoardProps {
  cafeSlug: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ cafeSlug }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [floorObstacles, setFloorObstacles] = useState<FloorObstacle[]>([]);
  const [viewMode, setViewMode] = useState<'MAP' | 'KANBAN'>('MAP');
  const [activeFilter, setActiveFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [shiftedOrders, setShiftedOrders] = useState<Order[]>([]);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  // Waiter & Zoning state
  const [activeWaiter, setActiveWaiter] = useState<Waiter | null>(() => {
    const saved = localStorage.getItem(`activeWaiter_${cafeSlug}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [allWaiters, setAllWaiters] = useState<Waiter[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(!activeWaiter);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState<boolean>(false);
  const [isMyZoneOnly, setIsMyZoneOnly] = useState<boolean>(true);

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

  const playChime = (type: 'ORDER' | 'SERVICE' | 'READY' = 'ORDER') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = getAudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      if (type === 'READY') {
        osc.frequency.setValueAtTime(880.00, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.15);
      } else if (type === 'SERVICE') {
        osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.15);
        osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.15);
      }

      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  };

  const handleTestSound = () => {
    setSoundEnabled(true);
    playChime('ORDER');
  };

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener('release', () => {
          setWakeLockActive(false);
        });
      } catch (err) {
        console.warn('WakeLock request failed:', err);
      }
    }
  };

  const loadData = async () => {
    try {
      const [orderList, callList, tableList, planList, waiterList] = await Promise.all([
        api.getOrdersByCafe(cafeSlug),
        api.getServiceCalls(cafeSlug),
        api.getTablesByCafe(cafeSlug),
        api.getFloorPlans(cafeSlug),
        api.getActiveWaiters(cafeSlug),
      ]);
      setOrders(Array.isArray(orderList) ? orderList.filter(Boolean) : []);
      setServiceCalls(Array.isArray(callList) ? callList.filter((c) => c && c.active) : []);
      setFloorPlans(Array.isArray(planList) ? planList : []);
      const obstacleLists = await Promise.all((planList || []).map((plan) => api.getFloorObstacles(plan.id)));
      setFloorObstacles(obstacleLists.flat());
      setTables(Array.isArray(tableList) ? tableList : []);

      const validWaiters = Array.isArray(waiterList) ? waiterList : [];
      setAllWaiters(validWaiters);

      // Keep active logged-in waiter's table assignments in sync with Admin's assignments!
      if (activeWaiter) {
        const updatedSelf = validWaiters.find((w) => w.id === activeWaiter.id);
        if (updatedSelf) {
          setActiveWaiter(updatedSelf);
          localStorage.setItem(`activeWaiter_${cafeSlug}`, JSON.stringify(updatedSelf));
        }
      }
    } catch (e) {
      console.error('Erreur chargement données', e);
    }
  };

  const handleWaiterLoginSuccess = (waiter: Waiter) => {
    setActiveWaiter(waiter);
    localStorage.setItem(`activeWaiter_${cafeSlug}`, JSON.stringify(waiter));
    setIsLoginModalOpen(false);

    if (!waiter.assignedTables || waiter.assignedTables.length === 0) {
      setIsZoneModalOpen(true);
    }
  };

  const handleWaiterLogout = () => {
    setActiveWaiter(null);
    localStorage.removeItem(`activeWaiter_${cafeSlug}`);
    setIsLoginModalOpen(true);
  };

  const handleZoneUpdated = (updatedWaiter: Waiter) => {
    setActiveWaiter(updatedWaiter);
    localStorage.setItem(`activeWaiter_${cafeSlug}`, JSON.stringify(updatedWaiter));
  };

  useEffect(() => {
    loadData();
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
        void loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const unlockAudio = () => {
      getAudioContext();
      window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);

    const unsubscribe = stompService.connect(
      cafeSlug,
      (incomingOrder) => {
        if (!incomingOrder || !incomingOrder.id) return;
        
        const isInWaiterZone = activeWaiter && activeWaiter.assignedTables.includes(incomingOrder.tableNumber);
        if (!isMyZoneOnly || isInWaiterZone || !activeWaiter) {
          if (incomingOrder.status === 'READY') {
            playChime('READY');
          } else {
            playChime('ORDER');
          }
        }

        setOrders((prev) => {
          const cleanPrev = (prev || []).filter(Boolean);
          const index = cleanPrev.findIndex((o) => String(o.id).toLowerCase() === String(incomingOrder.id).toLowerCase());
          
          if (index > -1) {
            const old = cleanPrev[index];
            if (
              old &&
              incomingOrder.tableChangedAlert &&
              Number(old.tableNumber) !== Number(incomingOrder.tableNumber)
            ) {
              setShiftedOrders((s) => {
                const exists = s.some((item) => String(item.id).toLowerCase() === String(incomingOrder.id).toLowerCase());
                return exists ? s : [...s, incomingOrder];
              });
            }

            const updated = [...cleanPrev];
            updated[index] = incomingOrder;
            return updated;
          } else {
            return [incomingOrder, ...cleanPrev];
          }
        });
      },
      (incomingCall) => {
        if (!incomingCall || !incomingCall.id) return;

        const isInWaiterZone = activeWaiter && activeWaiter.assignedTables.includes(incomingCall.tableNumber);
        if (!isMyZoneOnly || isInWaiterZone || !activeWaiter) {
          playChime('SERVICE');
        }

        setServiceCalls((prev) => [incomingCall, ...prev.filter((c) => c.id !== incomingCall.id)]);
      },
      () => void loadData()
    );

    const reconciliationTimer = window.setInterval(() => void loadData(), 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('click', unlockAudio);
      if (wakeLockRef.current) wakeLockRef.current.release();
      window.clearInterval(reconciliationTimer);
      unsubscribe();
    };
  }, [cafeSlug, soundEnabled, activeWaiter, isMyZoneOnly]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus);
      if (updated && updated.id) {
        setOrders((prev) =>
          (prev || [])
            .filter(Boolean)
            .map((o) => (String(o.id).toLowerCase() === String(orderId).toLowerCase() ? updated : o))
        );
      }
    } catch (e) {
      console.error('Erreur changement statut', e);
    }
  };

  const handleDismissServiceCall = async (callId: string) => {
    setServiceCalls((prev) => prev.filter((c) => c.id !== callId));
    try {
      await api.dismissServiceCall(callId);
    } catch (e) {
      console.error('Erreur acquittement appel', e);
    }
  };

  const handleDismissAlert = (orderId: string) => {
    setShiftedOrders((prev) => prev.filter((o) => o && String(o.id).toLowerCase() !== String(orderId).toLowerCase()));
  };

  const validOrders = (orders || []).filter((o): o is Order => Boolean(o && o.id && o.status));

  const isTableInZone = (tableNumber: number) => {
    if (!isMyZoneOnly || !activeWaiter || !activeWaiter.assignedTables || activeWaiter.assignedTables.length === 0) {
      return true;
    }
    return activeWaiter.assignedTables.includes(tableNumber);
  };

  const zonedOrders = validOrders.filter((o) => isTableInZone(o.tableNumber));
  const zonedServiceCalls = serviceCalls.filter((c) => isTableInZone(c.tableNumber));
  const readyForPickupOrders = zonedOrders.filter((o) => o.status === 'READY');

  const getDayLabel = (dateString?: string) => {
    if (!dateString) return "Aujourd'hui";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return "Hier";

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const groupedOrdersByDay: Record<string, Order[]> = {};
  zonedOrders.forEach((o) => {
    const dayLabel = getDayLabel(o.createdAt);
    if (!groupedOrdersByDay[dayLabel]) {
      groupedOrdersByDay[dayLabel] = [];
    }
    groupedOrdersByDay[dayLabel].push(o);
  });

  const pendingCount = zonedOrders.filter((o) => o.status === 'RECEIVED').length;
  const preparingCount = zonedOrders.filter((o) => o.status === 'PREPARING').length;
  const readyCount = zonedOrders.filter((o) => o.status === 'READY').length;
  const servedCount = zonedOrders.filter((o) => o.status === 'SERVED').length;
  const paidCount = zonedOrders.filter((o) => o.status === 'PAID').length;
  const archivedCount = zonedOrders.filter((o) => o.status === 'ARCHIVED').length;

  const filterTabs = [
    { key: 'ALL', label: 'Toutes les commandes', count: zonedOrders.length, dotColor: 'bg-white' },
    { key: 'READY', label: '🔔 Prêtes au Comptoir', count: readyCount, dotColor: 'bg-emerald-400' },
    { key: 'RECEIVED', label: 'Reçues', count: pendingCount, dotColor: 'bg-amber-400' },
    { key: 'PREPARING', label: 'En cuisine', count: preparingCount, dotColor: 'bg-orange-400' },
    { key: 'SERVED', label: 'Servies à Table', count: servedCount, dotColor: 'bg-green-400' },
    { key: 'PAID', label: 'Payées', count: paidCount, dotColor: 'bg-violet-400' },
    { key: 'ARCHIVED', label: 'Archivées', count: archivedCount, dotColor: 'bg-gray-400' },
  ];

  return (
    <div className="min-h-screen bg-[#08090e] text-white p-3 sm:p-5 space-y-4 sm:space-y-5 relative max-w-6xl mx-auto">
      {/* Ambient gradient */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[40vh] bg-gradient-radial from-orange-500/[0.04] to-transparent pointer-events-none" />

      {/* Table Shift Visual Alerts */}
      <TableShiftAlert alerts={shiftedOrders} onDismiss={handleDismissAlert} />

      {/* Header Tablet Bar */}
      <header className="glass-panel p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg shadow-orange-500/25 text-white animate-glow-pulse">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white">Comptoir Serveurs & Salle</h1>
            <div className="flex items-center space-x-2.5 text-[10px] text-gray-500 mt-1">
              <span className="flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-500/[0.08] px-2 py-0.5 rounded-full border border-emerald-500/15">
                <Activity className="w-2.5 h-2.5" />
                <span>Live STOMP</span>
              </span>
              {wakeLockActive && (
                <span className="flex items-center space-x-1 text-amber-400/80 font-semibold bg-amber-500/[0.06] px-2 py-0.5 rounded-full border border-amber-500/10">
                  <Sun className="w-2.5 h-2.5" />
                  <span>Écran Allumé</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher: Plan 2D vs Kanban */}
        <div className="flex items-center bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08]">
          <button
            onClick={() => setViewMode('MAP')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewMode === 'MAP'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>🗺️ Plan 2D Salle</span>
          </button>
          <button
            onClick={() => setViewMode('KANBAN')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewMode === 'KANBAN'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            <span>📜 Historique & Kanban</span>
          </button>
        </div>

        {/* Waiter Profile & Zone Control Bar */}
        {activeWaiter && (
          <div className="flex flex-wrap items-center gap-2 bg-white/[0.03] p-2 rounded-2xl border border-white/[0.06]">
            <div className="flex items-center space-x-2 px-2 py-1">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                👤
              </div>
              <div>
                <span className="text-xs font-extrabold text-white block">{activeWaiter.name}</span>
                <span className="text-[10px] text-gray-400 block font-medium">
                  {activeWaiter.assignedTables && activeWaiter.assignedTables.length > 0
                    ? `Zone: ${activeWaiter.assignedTables.map((t) => `T${formatTableNumber(t)}`).join(', ')}`
                    : 'Toutes les tables'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMyZoneOnly(!isMyZoneOnly)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-300 flex items-center space-x-1.5 ${
                isMyZoneOnly
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/[0.06] text-gray-400 border border-white/[0.08]'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{isMyZoneOnly ? 'Ma Zone' : 'Toutes les tables'}</span>
            </button>

            <button
              onClick={() => setIsZoneModalOpen(true)}
              className="p-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 rounded-xl transition-all"
              title="Modifier mes tables assignées"
            >
              <MapPin className="w-4 h-4 text-orange-400" />
            </button>

            <button
              onClick={handleWaiterLogout}
              className="p-1.5 bg-white/[0.04] hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all"
              title="Changer de serveur / Déconnexion PIN"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsStockModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-lg shadow-orange-500/20 flex items-center space-x-1.5 text-[11px] font-bold transition-all duration-300 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Stock Express</span>
          </button>

          <button
            onClick={handleTestSound}
            className={`p-2.5 rounded-xl border transition-all duration-300 active:scale-95 ${
              soundEnabled
                ? 'bg-orange-500/[0.08] border-orange-500/20 text-orange-400'
                : 'bg-white/[0.03] border-white/[0.06] text-gray-600'
            }`}
            title="Tester le son"
          >
            {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
          </button>

          <button
            onClick={loadData}
            className="p-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 rounded-xl border border-white/[0.06] transition-all duration-300 active:rotate-180"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* READY FOR PICKUP ALERT BANNER */}
      {readyForPickupOrders.length > 0 && (
        <div className="space-y-2.5 animate-fadeIn">
          <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
            <Bell className="w-4 h-4 animate-bounce text-emerald-400" />
            <span>🔔 Commandes Prêtes au Bar à Récupérer ({readyForPickupOrders.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {readyForPickupOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/30 flex items-center justify-between space-x-3 shadow-xl animate-pulse"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/25">
                    T{formatTableNumber(order.tableNumber)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Table {formatTableNumber(order.tableNumber)}</span>
                    <span className="text-[11px] text-emerald-300 font-extrabold block">
                      {order.items.length} produit{order.items.length > 1 ? 's' : ''} prêt{order.items.length > 1 ? 's' : ''} au bar !
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center space-x-1.5 transition-all duration-300 active:scale-95 animate-bounce"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Récupérée et servie</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main View Area */}
      {viewMode === 'MAP' ? (
        <InteractiveFloorPlan
          tables={tables}
          floorPlans={floorPlans}
          obstacles={floorObstacles}
          orders={orders}
          serviceCalls={serviceCalls}
          activeWaiter={activeWaiter}
          waiters={allWaiters}
          isMyZoneOnly={isMyZoneOnly}
          onUpdateOrderStatus={handleUpdateStatus}
          onDismissServiceCall={handleDismissServiceCall}
        />
      ) : (
        <div className="space-y-6">
          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as typeof activeFilter)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-300 whitespace-nowrap ${
                  activeFilter === tab.key
                    ? 'category-pill-active text-white scale-[1.02]'
                    : 'bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:bg-white/[0.06] hover:text-gray-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${tab.dotColor}`} />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${
                  activeFilter === tab.key ? 'bg-white/20' : 'bg-white/[0.06]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Grouped by Day & Rows */}
          {Object.keys(groupedOrdersByDay).length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-2xl max-w-md mx-auto animate-fadeIn">
              <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-3 animate-float" />
              <h3 className="text-sm font-bold text-gray-400">Aucune commande enregistrée</h3>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedOrdersByDay).map(([dayLabel, dayOrders]) => {
                const activeList = dayOrders.filter((o) => (o.status === 'RECEIVED' || o.status === 'PREPARING' || o.status === 'READY' || o.status === 'PICKED_UP') && (activeFilter === 'ALL' || activeFilter === o.status));
                const servedList = dayOrders.filter((o) => (o.status === 'SERVED' || o.status === 'PAID') && (activeFilter === 'ALL' || activeFilter === o.status));
                const archivedList = dayOrders.filter((o) => o.status === 'ARCHIVED' && (activeFilter === 'ALL' || activeFilter === 'ARCHIVED'));

                if (activeList.length === 0 && servedList.length === 0 && archivedList.length === 0) {
                  return null;
                }

                return (
                  <div key={dayLabel} className="space-y-4">
                    {/* Day Header */}
                    <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-2">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <h2 className="text-sm font-extrabold text-white tracking-wide uppercase">{dayLabel}</h2>
                      <span className="text-[10px] font-bold bg-white/[0.06] text-gray-400 px-2 py-0.5 rounded-full">
                        {dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* ROW 1: Active Orders */}
                    {activeList.length > 0 && (
                      <div className="space-y-2.5 bg-orange-500/[0.03] p-4 rounded-3xl border border-orange-500/15">
                        <div className="flex items-center space-x-2 text-xs font-extrabold text-orange-400 uppercase tracking-wider">
                          <Flame className="w-4 h-4 animate-pulse" />
                          <span>🔥 Ligne 1 : Commandes En Cours & En Préparation ({activeList.length})</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                          {activeList.map((order) => (
                            <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ROW 2: Served Orders */}
                    {servedList.length > 0 && (
                      <div className="space-y-2.5 bg-blue-500/[0.03] p-4 rounded-3xl border border-blue-500/15">
                        <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                          <div className="flex items-center space-x-2 text-xs font-extrabold text-blue-400 uppercase tracking-wider">
                            <UtensilsCrossed className="w-4 h-4 text-blue-400" />
                            <span>🍽️ Ligne 2 : Commandes Servies à Table ({servedList.length})</span>
                          </div>
                          <span className="text-[10px] text-gray-400">Clients toujours installés</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                          {servedList.map((order) => (
                            <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ROW 3: Archived Orders */}
                    {archivedList.length > 0 && (
                      <div className="space-y-2.5 bg-white/[0.02] p-4 rounded-3xl border border-white/[0.06]">
                        <div className="flex items-center space-x-2 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                          <Archive className="w-4 h-4 text-gray-500" />
                          <span>📦 Section : Commandes Archivées ({archivedList.length})</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                          {archivedList.map((order) => (
                            <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <StockQuickToggleModal
        cafeSlug={cafeSlug}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onProductsUpdated={loadData}
      />

      <WaiterPinLoginModal
        cafeSlug={cafeSlug}
        isOpen={isLoginModalOpen}
        onLoginSuccess={handleWaiterLoginSuccess}
      />

      <TableZoneSelectorModal
        waiter={activeWaiter}
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        onZoneUpdated={handleZoneUpdated}
      />
    </div>
  );
};
