import React, { useEffect, useState } from 'react';
import { TableEntity, Order, ServiceCall, Waiter, OrderStatus, FloorPlan, FloorObstacle } from '../../../types';
import { formatTableCode, formatTableNumber } from '../../../utils/tableCode';
import { formatPrice } from '../../../utils/formatPrice';
import { Bell, Lock, Layers, CircleAlert, Clock, Utensils, CheckCircle2, User, Wine, DoorOpen, Square, Plus } from 'lucide-react';
import { TableDetailModal } from './TableDetailModal';

interface InteractiveFloorPlanProps {
  cafeSlug?: string;
  tables: TableEntity[];
  floorPlans: FloorPlan[];
  obstacles: FloorObstacle[];
  orders: Order[];
  serviceCalls: ServiceCall[];
  activeWaiter: Waiter | null;
  waiters?: Waiter[];
  isMyZoneOnly: boolean;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onDismissServiceCall: (callId: string) => void;
  onTakeOrder: (table: TableEntity) => void;
}

export const InteractiveFloorPlan: React.FC<InteractiveFloorPlanProps> = ({
  cafeSlug = 'monastir-lounge',
  tables,
  floorPlans,
  obstacles,
  orders,
  serviceCalls,
  activeWaiter,
  waiters = [],
  isMyZoneOnly,
  onUpdateOrderStatus,
  onDismissServiceCall,
  onTakeOrder,
}) => {
  const availableZones = floorPlans.length > 0
    ? floorPlans.map((plan) => plan.name)
    : Array.from(new Set(tables.map((t) => t.zoneName).filter(Boolean) as string[]));

  const [activeZone, setActiveZone] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null);

  useEffect(() => {
    if (availableZones.length === 0) return;

    if (!activeZone || !availableZones.includes(activeZone)) {
      if (activeWaiter && activeWaiter.assignedTables && activeWaiter.assignedTables.length > 0) {
        const assignedTableNumbers = activeWaiter.assignedTables.map(Number);
        const waiterTable = tables.find((t) => assignedTableNumbers.includes(Number(t.tableNumber)));
        if (waiterTable) {
          const waiterPlan = floorPlans.find((p) => p.id === waiterTable.floorPlanId);
          const waiterZone = waiterPlan ? waiterPlan.name : waiterTable.zoneName;
          if (waiterZone && availableZones.includes(waiterZone)) {
            setActiveZone(waiterZone);
            return;
          }
        }
      }
      setActiveZone(availableZones[0] || '');
    }
  }, [activeZone, availableZones, activeWaiter, tables, floorPlans]);

  const getAssignedWaiterForTable = (tableNumber: number): Waiter | undefined => {
    return waiters.find((w) => w.assignedTables && w.assignedTables.some((tn) => Number(tn) === Number(tableNumber)));
  };

  const isTableAssigned = (tableNumber: number) => {
    if (!isMyZoneOnly) return true;
    if (!activeWaiter || !activeWaiter.assignedTables || activeWaiter.assignedTables.length === 0) {
      return true;
    }
    return activeWaiter.assignedTables.some((tn) => Number(tn) === Number(tableNumber));
  };

  const getActiveOrderForTable = (tableNumber: number): Order | null => {
    return (
      orders.find(
        (o) =>
          Number(o.tableNumber) === Number(tableNumber) &&
          o.status !== 'ARCHIVED' &&
          o.status !== 'CANCELLED'
      ) || null
    );
  };

  const getActiveServiceCallForTable = (tableNumber: number): ServiceCall | null => {
    return serviceCalls.find((c) => Number(c.tableNumber) === Number(tableNumber) && c.active) || null;
  };

  const getZoneReadyCount = (zoneName: string) => {
    const plan = floorPlans.find((item) => item.name === zoneName);
    const zoneTables = tables.filter((t) => plan ? t.floorPlanId === plan.id : t.zoneName === zoneName);
    return zoneTables.filter((t) => {
      const order = getActiveOrderForTable(t.tableNumber);
      return order && order.status === 'READY';
    }).length;
  };

  const getZoneCallCount = (zoneName: string) => {
    const plan = floorPlans.find((item) => item.name === zoneName);
    const zoneTables = tables.filter((t) => plan ? t.floorPlanId === plan.id : t.zoneName === zoneName);
    return zoneTables.filter((t) => getActiveServiceCallForTable(t.tableNumber) !== null).length;
  };

  const getTableVisualState = (tableNumber: number, isAssigned: boolean) => {
    if (!isAssigned) {
      return {
        bg: 'bg-gray-900/60 border-gray-800 text-gray-600',
        badge: 'Verrouillée',
        badgeBg: 'bg-gray-800 text-gray-500',
        glow: '',
        pulse: false,
      };
    }

    const serviceCall = getActiveServiceCallForTable(tableNumber);
    const order = getActiveOrderForTable(tableNumber);

    if (serviceCall) {
      return {
        bg: 'bg-red-500/25 border-red-500 text-red-200 shadow-2xl shadow-red-500/40',
        badge: serviceCall.type === 'BILL' ? '💳 Addition' : '🔔 Appel',
        badgeBg: 'bg-red-500 text-white animate-bounce',
        glow: 'ring-4 ring-red-500/50',
        pulse: true,
      };
    }

    if (!order) {
      return {
        bg: 'bg-[#111624] border-white/[0.08] text-gray-300 hover:border-orange-500/40 shadow-lg',
        badge: 'Libre',
        badgeBg: 'bg-white/[0.06] text-gray-400',
        glow: '',
        pulse: false,
      };
    }

    switch (order.status) {
      case 'READY':
        return {
          bg: 'bg-emerald-500/25 border-emerald-400 text-emerald-100 shadow-2xl shadow-emerald-500/30',
          badge: '✅ Prête !',
          badgeBg: 'bg-emerald-500 text-white font-black animate-pulse',
          glow: 'ring-4 ring-emerald-400/40',
          pulse: true,
        };
      case 'PREPARING':
        return {
          bg: 'bg-orange-500/20 border-orange-500/60 text-orange-200 shadow-xl shadow-orange-500/20',
          badge: '🍳 En Cuisine',
          badgeBg: 'bg-orange-500/30 text-orange-300',
          glow: '',
          pulse: false,
        };
      case 'RECEIVED':
        return {
          bg: 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-xl shadow-amber-500/20',
          badge: '📥 Reçue',
          badgeBg: 'bg-amber-500/30 text-amber-300',
          glow: '',
          pulse: false,
        };
      case 'SERVED':
      case 'PICKED_UP':
        return {
          bg: 'bg-blue-500/20 border-blue-500/50 text-blue-200 shadow-xl shadow-blue-500/15',
          badge: '🍽️ Servie',
          badgeBg: 'bg-blue-500/30 text-blue-300',
          glow: '',
          pulse: false,
        };
      case 'PAID':
        return {
          bg: 'bg-purple-500/20 border-purple-500/50 text-purple-200',
          badge: '💰 Payée',
          badgeBg: 'bg-purple-500/30 text-purple-300',
          glow: '',
          pulse: false,
        };
      default:
        return {
          bg: 'bg-gray-800 border-gray-700 text-gray-300',
          badge: order.status,
          badgeBg: 'bg-gray-700 text-gray-300',
          glow: '',
          pulse: false,
        };
    }
  };

  const activePlan = floorPlans.find((plan) => plan.name === activeZone);
  const currentZoneTables = tables.filter((t) =>
    activePlan ? (t.floorPlanId === activePlan.id || t.zoneName === activeZone) : t.zoneName === activeZone
  );
  const currentObstacles = activePlan ? obstacles.filter((item) => item.floorPlanId === activePlan.id) : [];

  const currentReadyCount = currentZoneTables.filter((table) => getActiveOrderForTable(table.tableNumber)?.status === 'READY').length;
  const currentCallCount = currentZoneTables.filter((table) => getActiveServiceCallForTable(table.tableNumber)).length;
  const currentOccupiedCount = currentZoneTables.filter((table) => getActiveOrderForTable(table.tableNumber) !== null).length;
  const currentFreeCount = currentZoneTables.length - currentOccupiedCount;

  const selectedOrder = selectedTable ? getActiveOrderForTable(selectedTable.tableNumber) : null;
  const selectedCall = selectedTable ? getActiveServiceCallForTable(selectedTable.tableNumber) : null;

  return (
    <div className="space-y-4">
      {/* Zone Switcher Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
        {availableZones.map((zone) => {
          const readyCount = getZoneReadyCount(zone);
          const callCount = getZoneCallCount(zone);
          const isActive = activeZone === zone;
          return (
            <button
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
                  : 'bg-white/[0.03] text-gray-400 border border-white/[0.08] hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{zone}</span>
              {callCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white animate-bounce flex items-center space-x-1">
                  <CircleAlert className="w-3 h-3" />
                  <span>{callCount}</span>
                </span>
              ) : readyCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white animate-pulse flex items-center space-x-1">
                  <Bell className="w-3 h-3" />
                  <span>{readyCount}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Real-time Status KPI Summary Banner */}
      <div className="glass-panel p-3 rounded-2xl border border-white/[0.08] flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-bold">
            {activeWaiter ? (
              <>Zone de <strong className="text-orange-400 font-black">{activeWaiter.name}</strong></>
            ) : (
              'Vue globale de la salle'
            )}
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-gray-400">{currentZoneTables.length} tables</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {currentCallCount > 0 && (
            <span className="rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-red-300 font-black text-xs flex items-center gap-1.5 animate-pulse">
              <CircleAlert className="w-3.5 h-3.5 text-red-400" />
              {currentCallCount} Appel{currentCallCount > 1 ? 's' : ''} !
            </span>
          )}
          {currentReadyCount > 0 && (
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-emerald-300 font-black text-xs flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {currentReadyCount} Prête{currentReadyCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 text-gray-400 text-[11px] font-bold">
            {currentOccupiedCount} occupée{currentOccupiedCount > 1 ? 's' : ''} · {currentFreeCount} libre{currentFreeCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Interactive 2D Floor Grid Canvas */}
      <div className="glass-panel p-3 sm:p-4 rounded-3xl border border-white/[0.08] relative min-h-[440px] flex flex-col justify-between overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2 border-b border-white/[0.06] pb-2">
          <span className="font-black text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-orange-400" />
            <span>Espace : {activeZone}</span>
          </span>
          <span className="text-[10px] font-mono text-gray-500">
            {activePlan ? `${activePlan.width}m × ${activePlan.height}m` : 'Plan 2D'}
          </span>
        </div>

        <div
          className="relative flex-1 w-full min-h-[400px] sm:min-h-[480px] bg-[#070a12] rounded-3xl border-2 border-white/10 overflow-hidden select-none shadow-inner"
          style={{
            aspectRatio: activePlan ? `${activePlan.width}/${activePlan.height}` : undefined,
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        >
          {/* Obstacles & Architectural Elements */}
          {currentObstacles.map((item) => {
            const isBar = item.label.toLowerCase().includes('bar') || item.label.toLowerCase().includes('comptoir');
            const isDoor = item.label.toLowerCase().includes('porte') || item.label.toLowerCase().includes('entrée');

            if (isBar) {
              return (
                <div
                  key={item.id}
                  style={{
                    left: `${item.posX}%`,
                    top: `${item.posY}%`,
                    width: `${item.width}%`,
                    height: `${item.height}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute bg-gradient-to-r from-amber-900/90 to-[#3a1d08]/90 border-2 border-amber-600/60 rounded-xl flex items-center justify-between px-2 text-xs font-black text-amber-200 pointer-events-none shadow-xl"
                >
                  <div className="flex items-center gap-1 truncate">
                    <Wine className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </div>
              );
            }

            if (isDoor) {
              return (
                <div
                  key={item.id}
                  style={{
                    left: `${item.posX}%`,
                    top: `${item.posY}%`,
                    width: `${item.width}%`,
                    height: `${item.height}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute bg-emerald-950/60 border-2 border-dashed border-emerald-500/60 rounded-lg flex items-center justify-center text-xs font-black text-emerald-300 pointer-events-none shadow-sm"
                >
                  <DoorOpen className="w-3.5 h-3.5 mr-1" />
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                style={{
                  left: `${item.posX}%`,
                  top: `${item.posY}%`,
                  width: `${item.width}%`,
                  height: `${item.height}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute bg-slate-800 border-2 border-slate-600 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-300 pointer-events-none shadow-md"
              >
                <Square className="w-3 h-3 mr-1 text-slate-400" />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}

          {/* Tables with Full Status Rendering */}
          {currentZoneTables.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-gray-600">
              <Layers className="w-12 h-12 mb-3 text-gray-700 animate-pulse" />
              <p className="text-sm font-black text-gray-400">Aucune table dans {activeZone}</p>
            </div>
          ) : (
            currentZoneTables.map((table) => {
              const ownerWaiter = getAssignedWaiterForTable(table.tableNumber);
              const isAssigned = isTableAssigned(table.tableNumber);
              const vState = getTableVisualState(table.tableNumber, isAssigned);
              const activeOrder = getActiveOrderForTable(table.tableNumber);
              const activeCall = getActiveServiceCallForTable(table.tableNumber);
              const isRound = table.shape === 'ROUND';
              const isSofa = table.shape === 'SOFA';
              const isRect = table.shape === 'RECTANGLE';
              const displayCode = formatTableCode(table.tableCode, table.tableNumber);
              const seats = table.seatsCount || 4;

              return (
                <button
                  key={table.id}
                  disabled={!isAssigned}
                  onClick={() => isAssigned && setSelectedTable(table)}
                  style={{
                    left: `${table.posX}%`,
                    top: `${table.posY}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute flex flex-col items-center justify-center p-1.5 transition-all duration-300 border-2 shadow-2xl ${
                    isRound
                      ? 'w-18 h-18 rounded-full'
                      : isSofa
                      ? 'w-24 h-15 rounded-2xl'
                      : isRect
                      ? 'w-22 h-16 rounded-2xl'
                      : 'w-18 h-18 rounded-2xl'
                  } ${vState.bg} ${vState.glow} ${
                    isAssigned ? 'active:scale-95 cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-40'
                  }`}
                >
                  {/* Miniature Chair Dots */}
                  <div className="absolute -top-1.5 flex gap-0.5">
                    {Array.from({ length: Math.min(seats, 6) }).map((_, si) => (
                      <span key={si} className="w-1.5 h-1.5 rounded-full bg-white/40 border border-black/40" />
                    ))}
                  </div>

                  {/* Table Code & Number */}
                  <span className="text-xs font-black tracking-tight leading-none text-white">
                    {displayCode}
                  </span>

                  {/* Order Total or Free Indicator */}
                  {activeOrder ? (
                    <span className="text-[10px] font-black text-amber-300 mt-0.5">
                      {formatPrice(activeOrder.totalPrice)} <span className="text-[8px] text-gray-400">TND</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-gray-400 mt-0.5">
                      N°{formatTableNumber(table.tableNumber)}
                    </span>
                  )}

                  {/* Dynamic Status Pill */}
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md mt-0.5 truncate max-w-full ${vState.badgeBg}`}>
                    {vState.badge}
                  </span>

                  {/* Lock Overlay if table belongs to another waiter */}
                  {!isAssigned && (
                    <div className="absolute inset-0 bg-black/80 rounded-2xl flex flex-col items-center justify-center p-1 text-center">
                      <Lock className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                      <span className="text-[8px] font-black text-amber-300 truncate max-w-full">
                        {ownerWaiter ? ownerWaiter.name : 'Autre zone'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Quick Legend */}
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/[0.06] text-[10px] font-black text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Appel Serveur
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Prête Cuisine
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-400" /> En Cuisine
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Servie
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500" /> Libre
          </span>
        </div>
      </div>

      {/* 1-Tap Table Detail Drawer Modal */}
      <TableDetailModal
        cafeSlug={cafeSlug}
        table={selectedTable}
        order={selectedOrder}
        serviceCall={selectedCall}
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        onUpdateOrderStatus={onUpdateOrderStatus}
        onDismissServiceCall={onDismissServiceCall}
        onTakeOrder={onTakeOrder}
      />
    </div>
  );
};
