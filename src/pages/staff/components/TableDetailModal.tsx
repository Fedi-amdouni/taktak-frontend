import React from 'react';
import { X, Clock, ChefHat, CheckCircle, Bell, UtensilsCrossed, Archive, MapPin, ShoppingCart } from 'lucide-react';
import { Order, OrderStatus, ServiceCall, TableEntity } from '../../../types';
import { formatTableCode, formatTableNumber } from '../../../utils/tableCode';

interface TableDetailModalProps {
  table: TableEntity | null;
  order: Order | null;
  serviceCall: ServiceCall | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onDismissServiceCall: (callId: string) => void;
  onTakeOrder: (table: TableEntity) => void;
}

export const TableDetailModal: React.FC<TableDetailModalProps> = ({
  table,
  order,
  serviceCall,
  isOpen,
  onClose,
  onUpdateOrderStatus,
  onDismissServiceCall,
  onTakeOrder,
}) => {
  if (!isOpen || !table) return null;

  const currentStatus: OrderStatus | 'FREE' = order?.status || 'FREE';

  const getStatusBadge = () => {
    if (serviceCall && serviceCall.active) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
          🔴 {serviceCall.type === 'BILL' ? "Demande d'Addition" : "Appel Serveur"}
        </span>
      );
    }

    switch (currentStatus) {
      case 'RECEIVED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">📥 Reçue en cuisine</span>;
      case 'PREPARING':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">👨‍🍳 En Préparation</span>;
      case 'READY':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-bounce">🔔 Prête au Comptoir</span>;
      case 'PICKED_UP':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">🏃‍♂️ Récupérée - En Livraison</span>;
      case 'SERVED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">🍽️ Servie à Table</span>;
      case 'PAID':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">Payée</span>;
      case 'ARCHIVED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">📦 Archivée</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700">⚪ Table Libre</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-all animate-fadeIn">
      <div className="w-full max-w-md bg-[#0e111a] border border-white/[0.12] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] sm:max-h-[90vh] overflow-y-auto relative animate-slideUp sm:animate-scaleUp">
        {/* Mobile Sheet Handle */}
        <div className="w-12 h-1.5 bg-white/20 hover:bg-white/40 rounded-full mx-auto mb-2 sm:hidden cursor-pointer" onClick={onClose} />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-500/20">
              {formatTableCode(table.tableCode, table.tableNumber)}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Table {formatTableCode(table.tableCode, table.tableNumber)} (N°{formatTableNumber(table.tableNumber)})</h2>
              <span className="text-[11px] text-gray-400 font-medium flex items-center">
                <MapPin className="w-3 h-3 mr-1 text-orange-400" /> {table.zoneName || 'Salle Principale'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between bg-gray-800/80 p-3 rounded-2xl border border-gray-700/80">
          <span className="text-xs text-gray-400 font-medium">Statut Actuel</span>
          {getStatusBadge()}
        </div>

        <button
          onClick={() => onTakeOrder(table)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-xs font-black text-white shadow-lg shadow-orange-500/20"
        >
          <ShoppingCart className="h-4 w-4" />
          {order ? 'Ajouter une commande pour cette table' : 'Prendre une commande'}
        </button>

        {/* Active Call Alert */}
        {serviceCall && serviceCall.active && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between space-x-2">
            <div>
              <span className="text-xs font-bold text-red-400 block">
                {serviceCall.type === 'BILL' ? "Client demande l'addition" : "Client appelle le serveur"}
              </span>
              {serviceCall.paymentMethod && (
                <span className="text-[10px] text-gray-400">Règlement: {serviceCall.paymentMethod}</span>
              )}
            </div>

            <button
              onClick={() => onDismissServiceCall(serviceCall.id)}
              className="px-3 py-1.5 bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg"
            >
              Acquitter
            </button>
          </div>
        )}

        {/* Order Details */}
        {order && order.items && order.items.length > 0 ? (
          <div className="space-y-3">
            <div className="bg-gray-950/80 p-3 rounded-2xl border border-gray-800 max-h-48 overflow-y-auto no-scrollbar space-y-2 text-xs">
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Commande #{order.id.slice(-6).toUpperCase()}</p>
              {order.items.map((item, idx) => (
                <div key={idx} className="border-b border-gray-800/60 pb-2.5 last:border-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-gray-200">
                    <div className="flex items-center">
                      <span className="font-extrabold text-orange-400 mr-2">{item.quantity}x</span>
                      <span className="font-bold text-white">{item.productName}</span>
                    </div>
                    <span className="font-bold text-orange-400">{(item.unitPrice * item.quantity).toFixed(3)} TND</span>
                  </div>

                  {/* Render Combo & Option Choices */}
                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                    <div className="pl-6 space-y-1">
                      {Object.entries(item.selectedOptions).map(([key, val]) => (
                        <div key={key} className="flex items-center text-[10px] text-amber-300/90 font-medium">
                          <span className="mr-1">👉</span>
                          <span className="font-semibold text-gray-400 mr-1">{key}:</span>
                          <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Item Notes */}
                  {item.notes && (
                    <div className="pl-6 text-[10px] text-gray-400 italic">
                      📝 Remarque: <span className="text-gray-300 font-semibold">{item.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-2 text-xs">
              <span className="text-gray-400 font-medium">Total Commande:</span>
              <span className="text-base font-black text-white">{order.totalPrice ? order.totalPrice.toFixed(3) : '0.000'} TND</span>
            </div>
            {!!order.discountAmount && order.discountAmount > 0 && <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><span>Coupon appliqué automatiquement</span><span>−{order.discountAmount.toFixed(3)} TND</span></div>}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-800">
              {(order.status === 'READY' || order.status === 'PICKED_UP') && (
                <button
                  onClick={() => {
                    onUpdateOrderStatus(order.id, 'SERVED');
                    onClose();
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold py-3 px-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 text-xs"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Récupérée et servie</span>
                </button>
              )}

              {order.status === 'SERVED' && (
                <button
                  onClick={() => {
                    onUpdateOrderStatus(order.id, 'PAID');
                    onClose();
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-2xl border border-gray-700 flex items-center justify-center space-x-2 text-xs"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Marquer comme Payée</span>
                </button>
              )}

              {order.status === 'PAID' && (
                <div className="space-y-2">
                  <div className="w-full bg-violet-500/10 text-violet-300 font-bold py-2 px-3 rounded-2xl border border-violet-500/20 text-center text-xs">
                    Payée · archivage automatique (15s)
                  </div>
                  <button
                    onClick={() => {
                      onUpdateOrderStatus(order.id, 'ARCHIVED');
                      onClose();
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                  >
                    <span>📦 Archiver & Libérer la Table Immédiatement</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-gray-500 italic">
            Aucune commande active enregistrée sur cette table.
          </div>
        )}
      </div>
    </div>
  );
};
