import React, { useEffect, useState } from 'react';
import { TableEntity, Order, ServiceCall, Waiter, OrderStatus, FloorPlan, FloorObstacle } from '../../../types';
import { formatTableCode, formatTableNumber } from '../../../utils/tableCode';
import { Bell, Lock, Layers, CircleAlert } from 'lucide-react';
import { TableDetailModal } from './TableDetailModal';

interface InteractiveFloorPlanProps {
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
  // Extract all unique zones from tables
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

  // Helper to check which waiter is assigned to a table
  const getAssignedWaiterForTable = (tableNumber: number): Waiter | undefined => {
    return waiters.find((w) => w.assignedTables && w.assignedTables.some((tn) => Number(tn) === Number(tableNumber)));
  };

  // Helper to check if a table is assigned to current logged-in waiter
  const isTableAssigned = (tableNumber: number) => {
    if (!isMyZoneOnly) return true;
    if (!activeWaiter || !activeWaiter.assignedTables || activeWaiter.assignedTables.length === 0) {
      return true;
    }
    return activeWaiter.assignedTables.some((tn) => Number(tn) === Number(tableNumber));
  };

  // Helper to get active order for a table
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

  // Helper to get active service call for a table
  const getActiveServiceCallForTable = (tableNumber: number): ServiceCall | null => {
    return serviceCalls.find((c) => Number(c.tableNumber) === Number(tableNumber) && c.active) || null;
  };

  // Count ready for pickup orders in a specific zone
  const getZoneReadyCount = (zoneName: string) => {
    const plan = floorPlans.find((item) => item.name === zoneName);
    const zoneTables = tables.filter((t) => plan ? t.floorPlanId === plan.id : t.zoneName === zoneName);
    return zoneTables.filter((t) => {
      const order = getActiveOrderForTable(t.tableNumber);
      return order && order.status === 'READY';
    }).length;
  };

  const getTableStyle = (tableNumber: number, isAssigned: boolean) => {
    if (!isAssigned) {
      return {
        bg: 'bg-gray-900/60 border-gray-800 text-gray-500',
        badge: '',
        animation: 'opacity-50 grayscale',
      };
    }

    const order = getActiveOrderForTable(tableNumber);
    const serviceCall = getActiveServiceCallForTable(tableNumber);

    if (serviceCall) {
      return {
        bg: 'bg-red-500/20 border-red-500 text-red-400 shadow-xl shadow-red-500/30',
        badge: 'Appel',
        animation: 'ring-2 ring-red-500/40',
      };
    }

    if (!order) {
      return {
        bg: 'bg-gray-800/80 border-gray-700 text-gray-300 hover:border-gray-500 shadow-md',
        badge: 'Libre',
        animation: '',
      };
    }

    switch (order.status) {
      case 'RECEIVED':
        return {
          bg: 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10',
          badge: 'Reçue',
          animation: '',
        };
      case 'PREPARING':
        return {
          bg: 'bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-lg shadow-orange-500/10',
          badge: 'Cuisine',
          animation: '',
        };
      case 'READY':
        return {
          bg: 'bg-emerald-500/30 border-emerald-400 text-white shadow-xl shadow-emerald-500/30',
          badge: 'Prête',
          animation: 'ring-2 ring-emerald-500/40',
        };
      case 'PICKED_UP':
        return {
          bg: 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/10',
          badge: 'En route',
          animation: '',
        };
      case 'SERVED':
        return {
          bg: 'bg-green-500/20 border-green-500/50 text-green-300 shadow-lg shadow-green-500/10',
          badge: '🍽️ Servie',
          animation: '',
        };
      case 'PAID':
        return {
          bg: 'bg-violet-500/20 border-violet-500/50 text-violet-300 shadow-lg shadow-violet-500/10',
          badge: 'Payée',
          animation: '',
        };
      default:
        return {
          bg: 'bg-gray-800/80 border-gray-700 text-gray-300',
          badge: '',
          animation: '',
        };
    }
  };

  // Filter tables by current active zone tab
  const activePlan = floorPlans.find((plan) => plan.name === activeZone);
  const currentZoneTables = tables.filter((t) =>
    activePlan ? (t.floorPlanId === activePlan.id || t.zoneName === activeZone) : t.zoneName === activeZone
  );
  const currentObstacles = activePlan ? obstacles.filter((item) => item.floorPlanId === activePlan.id) : [];
  const currentReadyCount = currentZoneTables.filter((table) => getActiveOrderForTable(table.tableNumber)?.status === 'READY').length;
  const currentCallCount = currentZoneTables.filter((table) => getActiveServiceCallForTable(table.tableNumber)).length;

  const selectedOrder = selectedTable ? getActiveOrderForTable(selectedTable.tableNumber) : null;
  const selectedCall = selectedTable ? getActiveServiceCallForTable(selectedTable.tableNumber) : null;

  return (
    <div className="space-y-4">
      {/* Zone Switcher Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
        {availableZones.map((zone) => {
          const readyCount = getZoneReadyCount(zone);
          const isActive = activeZone === zone;
          return (
            <button
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]'
                  : 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{zone}</span>
              {readyCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white animate-bounce flex items-center space-x-1">
                  <Bell className="w-3 h-3" />
                  <span>{readyCount}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* A quiet, touch-first summary: each table carries its own state. */}
      <div className="flex items-center justify-between gap-3 px-1 text-[11px]">
        <span className="text-gray-400">{activeWaiter ? <>Zone de <strong className="text-orange-400">{activeWaiter.name}</strong></> : 'Vue globale'}</span>
        <div className="flex items-center gap-2">
          {currentReadyCount > 0 && <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-emerald-300 font-bold"><Bell className="inline w-3 h-3 mr-1" />{currentReadyCount} prête{currentReadyCount > 1 ? 's' : ''}</span>}
          {currentCallCount > 0 && <span className="rounded-full bg-red-500/15 border border-red-500/25 px-2.5 py-1 text-red-300 font-bold"><CircleAlert className="inline w-3 h-3 mr-1" />{currentCallCount} appel{currentCallCount > 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* Interactive 2D Floor Grid Canvas */}
      <div className="glass-panel p-3 sm:p-4 rounded-3xl border border-white/[0.08] relative min-h-[420px] flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2 border-b border-white/[0.06] pb-2">
          <span className="font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-orange-400" />
            <span>Espace : {activeZone} ({currentZoneTables.length} tables)</span>
          </span>
          <span className="text-[10px] text-gray-500">Plan 2D Temps Réel</span>
        </div>

        <div
          className="relative flex-1 w-full h-[58svh] min-h-[360px] max-h-[560px] bg-gray-950/90 rounded-2xl border border-dashed border-gray-800/80 overflow-hidden select-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            aspectRatio: activePlan ? `${activePlan.width}/${activePlan.height}` : undefined,
          }}
        >
          {currentObstacles.map((item) => (
            <div key={item.id} style={{ left: `${item.posX}%`, top: `${item.posY}%`, width: `${item.width}%`, height: `${item.height}%`, transform: 'translate(-50%, -50%)' }} className="absolute bg-slate-600 border border-slate-500 rounded-sm flex items-center justify-center text-[9px] font-bold text-slate-300 pointer-events-none shadow-sm">
              {item.label}
            </div>
          ))}
          {currentZoneTables.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-gray-600">
              <Layers className="w-12 h-12 mb-3 text-gray-700 animate-pulse" />
              <p className="text-sm font-bold text-gray-400">Aucune table dans {activeZone}</p>
            </div>
          ) : (
            currentZoneTables.map((table) => {
              const ownerWaiter = getAssignedWaiterForTable(table.tableNumber);
              const isAssigned = isTableAssigned(table.tableNumber);
              const style = getTableStyle(table.tableNumber, isAssigned);
              const isRound = table.shape === 'ROUND';
              const isSofa = table.shape === 'SOFA';
              const displayCode = formatTableCode(table.tableCode, table.tableNumber);

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
                  className={`absolute flex flex-col items-center justify-center p-2 transition-all duration-300 border shadow-2xl ${
                    isRound ? 'w-16 h-16 rounded-full' : isSofa ? 'w-24 h-14 rounded-2xl' : 'w-16 h-16 rounded-2xl'
                  } ${style.bg} ${style.animation} ${
                    isAssigned ? 'active:scale-95 cursor-pointer' : 'cursor-not-allowed opacity-40'
                  }`}
                >
                  <span className="text-xs font-black tracking-tight">{displayCode}</span>
                  <span className="text-[9px] font-extrabold text-orange-400/90">N°{formatTableNumber(table.tableNumber)}</span>
                  {ownerWaiter && (
                    <span className="text-[8px] font-bold text-amber-300 truncate max-w-full">
                      👤 {ownerWaiter.name}
                    </span>
                  )}
                  {style.badge && <span className="text-[8px] font-extrabold mt-0.5 truncate max-w-full">{style.badge}</span>}
                  {!isAssigned && (
                    <div className="absolute inset-0 bg-black/75 rounded-2xl flex flex-col items-center justify-center p-1 text-center">
                      <Lock className="w-3 h-3 text-amber-400 mb-0.5" />
                      <span className="text-[8px] font-extrabold text-amber-300 truncate max-w-full">
                        {ownerWaiter ? ownerWaiter.name : 'Autre zone'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 1-Tap Table Detail Drawer Modal */}
      <TableDetailModal
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
