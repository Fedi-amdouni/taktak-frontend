import React from 'react';
import { Clock, CheckCircle, AlertTriangle, Utensils, UtensilsCrossed } from 'lucide-react';
import { Order, OrderStatus } from '../../../types';
import { formatTableNumber } from '../../../utils/tableCode';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus }) => {
  const getStatusStyles = (status: OrderStatus) => {
    switch (status) {
      case 'RECEIVED':
        return {
          border: 'border-amber-500/20',
          glow: 'shadow-amber-500/5',
          badge: 'from-amber-500 to-yellow-500',
          dot: 'bg-amber-400',
        };
      case 'PREPARING':
        return {
          border: 'border-orange-500/20',
          glow: 'shadow-orange-500/5',
          badge: 'from-orange-500 to-red-500',
          dot: 'bg-orange-400',
        };
      case 'READY':
        return {
          border: 'border-emerald-500/40 animate-pulse',
          glow: 'shadow-emerald-500/20',
          badge: 'from-emerald-500 to-teal-500',
          dot: 'bg-emerald-400',
        };
      case 'PICKED_UP':
        return {
          border: 'border-blue-500/30',
          glow: 'shadow-blue-500/10',
          badge: 'from-blue-500 to-cyan-500',
          dot: 'bg-blue-400',
        };
      case 'SERVED':
        return {
          border: 'border-emerald-500/20',
          glow: 'shadow-emerald-500/5',
          badge: 'from-emerald-500 to-green-500',
          dot: 'bg-emerald-400',
        };
      case 'PAID':
        return {
          border: 'border-violet-500/20',
          glow: 'shadow-violet-500/5',
          badge: 'from-violet-500 to-purple-500',
          dot: 'bg-violet-400',
        };
      default:
        return {
          border: 'border-white/[0.06]',
          glow: '',
          badge: 'from-gray-600 to-gray-700',
          dot: 'bg-gray-500',
        };
    }
  };

  const style = getStatusStyles(order.status);
  const minutesAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const safeItems = order.items || [];

  return (
    <div
      className={`kanban-card glass-panel p-4 rounded-2xl border ${style.border} shadow-xl ${style.glow} flex flex-col justify-between space-y-3 ${
        order.tableChangedAlert ? 'ring-2 ring-red-500/60 animate-pulse' : ''
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className={`bg-gradient-to-r ${style.badge} text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-lg`}>
            Table {formatTableNumber(order.tableNumber)}
          </span>

          {/* Badges de présence client */}
          {order.presenceStatus === 'VERIFIED_WIFI' && (
            <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1" title="Client connecté au WiFi du café">
              <span>📶 WiFi Café</span>
            </span>
          )}
          {order.presenceStatus === 'VERIFIED_GPS' && (
            <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1" title={`Vérifié sur place par GPS (${order.distanceMeters ?? '<100'}m)`}>
              <span>📍 Sur place</span>
            </span>
          )}
          {order.presenceStatus === 'UNVERIFIED_LOCATION' && (
            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1" title="Position GPS non fournie ou distante (4G)">
              <span>⚠️ 4G / Non vérifié</span>
            </span>
          )}

          {order.tableChangedAlert && (
            <span className="bg-red-500/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1 animate-bounce">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>Déplacée</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 font-medium">
          <Clock className="w-3 h-3" />
          <span>{minutesAgo < 1 ? 'à l\'instant' : `${minutesAgo} min`}</span>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.04] space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
        {safeItems.length === 0 ? (
          <p className="text-[10px] text-gray-600 italic flex items-center space-x-1">
            <Utensils className="w-3 h-3" />
            <span>Synchronisation en cours...</span>
          </p>
        ) : (
          safeItems.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between text-xs pb-1.5 border-b border-white/[0.03] last:border-0 last:pb-0">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-extrabold text-orange-400 mr-1.5 text-[11px]">{item.quantity}×</span>
                  <span className="font-semibold text-gray-200">{item.productName}</span>
                </div>
                {item.notes && (
                  <p className="text-[10px] text-amber-400/60 font-medium pl-5 mt-0.5 italic">"{item.notes}"</p>
                )}
              </div>
              <span className="font-bold text-gray-500 whitespace-nowrap ml-2 text-[10px]">
                {(item.unitPrice * item.quantity).toFixed(3)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Total & Quick Actions */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          {!!order.discountAmount && order.discountAmount > 0 && <span className="mb-1 block text-[10px] font-bold text-emerald-400">Coupon automatique : −{order.discountAmount.toFixed(3)} TND</span>}
          <span className="text-[9px] text-gray-600 block uppercase tracking-widest font-bold">Total</span>
          <span className="text-sm font-extrabold">
            <span className="gradient-text">{order.totalPrice ? order.totalPrice.toFixed(3) : '0.000'}</span>
            <span className="text-[10px] text-gray-600 ml-1">TND</span>
          </span>
        </div>

        {/* Action buttons sequence for Waiter */}
        <div className="flex items-center space-x-2">
          {order.status === 'RECEIVED' && (
            <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
              📥 Transmise en Cuisine
            </span>
          )}

          {order.status === 'PREPARING' && (
            <span className="text-[10px] font-extrabold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-xl border border-orange-500/20 animate-pulse">
              👨‍🍳 En Préparation
            </span>
          )}

          {(order.status === 'READY' || order.status === 'PICKED_UP') && (
            <button
              onClick={() => onUpdateStatus(order.id, 'SERVED')}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition-all duration-300 active:scale-95 animate-bounce"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Récupérée et servie</span>
            </button>
          )}

          {order.status === 'SERVED' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'PAID')}
              className="bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white font-bold text-[11px] px-3 py-2 rounded-xl border border-white/[0.06] flex items-center space-x-1.5 transition-all duration-300 active:scale-95"
              title="Marquer la commande comme payée"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encaisser</span>
            </button>
          )}

          {order.status === 'PAID' && (
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold text-violet-300 bg-violet-500/10 px-2 py-1.5 rounded-xl border border-violet-500/20">
                Payée · à archiver
              </span>
              <button
                onClick={() => onUpdateStatus(order.id, 'ARCHIVED')}
                className="bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 font-black text-[10px] px-2 py-1.5 rounded-xl transition-all active:scale-95"
                title="Archiver cette commande; la table sera libérée si toutes ses commandes sont terminales"
              >
                📦 Archiver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
