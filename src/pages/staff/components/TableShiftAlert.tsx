import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Order } from '../../../types';
import { formatTableNumber } from '../../../utils/tableCode';

interface TableShiftAlertProps {
  alerts: Order[];
  onDismiss: (orderId: string) => void;
}

export const TableShiftAlert: React.FC<TableShiftAlertProps> = ({ alerts, onDismiss }) => {
  // Deduplicate alerts by order ID
  const uniqueAlerts = alerts.filter((item, index, self) =>
    index === self.findIndex((t) => String(t.id).toLowerCase() === String(item.id).toLowerCase())
  );

  if (uniqueAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2 animate-bounce-short">
      {uniqueAlerts.map((order) => (
        <div
          key={order.id}
          className="bg-red-950/90 border-2 border-red-500 text-red-100 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-start justify-between space-x-3"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-500 text-white rounded-xl flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold">Alerte Déplacement Table !</h4>
              <p className="text-xs text-red-200 mt-1">
                Commande <span className="font-bold">#{order.id.slice(-4)}</span> a été transférée à la{' '}
                <span className="font-black text-amber-300 underline">Table {formatTableNumber(order.tableNumber)}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => onDismiss(order.id)}
            className="p-1 bg-red-900/60 hover:bg-red-800 text-red-300 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
