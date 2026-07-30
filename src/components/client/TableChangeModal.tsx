import React from 'react';
import { RefreshCw, MapPin, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useTableSession } from '../../context/TableSessionContext';
import { api } from '../../services/api';

export const TableChangeModal: React.FC = () => {
  const {
    showTableChangeModal,
    currentTableNumber,
    pendingTransferTableNumber,
    activeOrderId,
    confirmTableTransfer,
    cancelTableTransfer,
  } = useTableSession();

  if (!showTableChangeModal || pendingTransferTableNumber === null) return null;

  const handleConfirm = async () => {
    if (activeOrderId) {
      try {
        // Transfer active backend order to new table
        await api.transferOrderTable(activeOrderId, pendingTransferTableNumber);
      } catch (e) {
        console.error('Error transferring order table', e);
      }
    }
    confirmTableTransfer();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm glass-panel bg-gray-900 border border-orange-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto border border-orange-500/40 text-orange-400 animate-bounce-short">
          <RefreshCw className="w-8 h-8" />
        </div>

        {/* Title */}
        <div>
          <h2 className="text-lg font-extrabold text-white">Tu as changé de table ?</h2>
          <p className="text-xs text-gray-300 mt-1">
            Nous avons détecté que tu étais à la <span className="font-bold text-orange-400">Table {currentTableNumber}</span> et que tu viens de scanner la <span className="font-bold text-amber-400">Table {pendingTransferTableNumber}</span>.
          </p>
        </div>

        {/* Transfer Visual Badge */}
        <div className="bg-gray-800/80 p-3.5 rounded-2xl border border-gray-700/80 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-1.5 text-gray-400">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>Ancienne: Table {currentTableNumber}</span>
          </div>
          <span className="text-orange-400 font-bold">➔</span>
          <div className="flex items-center space-x-1.5 text-amber-400 font-extrabold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
            <MapPin className="w-4 h-4" />
            <span>Nouvelle: Table {pendingTransferTableNumber}</span>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 italic">
          Souhaites-tu transférer ton panier et tes commandes en cours vers la Table {pendingTransferTableNumber} ?
        </p>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={cancelTableTransfer}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-2xl text-xs transition-all active:scale-95 border border-gray-700"
          >
            Non, garder Table {currentTableNumber}
          </button>
          <button
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg shadow-orange-500/25 transition-all active:scale-95 flex items-center justify-center space-x-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Transférer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
