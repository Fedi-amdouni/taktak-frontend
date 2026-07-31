import React from 'react';
import { MapPin, Check, Lock, ShieldCheck, X } from 'lucide-react';
import { Waiter } from '../../types';

interface TableZoneSelectorModalProps {
  waiter: Waiter | null;
  isOpen: boolean;
  onClose: () => void;
  onZoneUpdated?: (updatedWaiter: Waiter) => void;
}

export const TableZoneSelectorModal: React.FC<TableZoneSelectorModalProps> = ({
  waiter,
  isOpen,
  onClose,
}) => {
  const totalTables = 15; // 1 to 15

  if (!isOpen || !waiter) return null;

  const assignedTables = waiter.assignedTables || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fadeIn">
      <div className="w-full max-w-md bg-[#0d0f18] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-500/25">
              👤
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Ma Zone de Tables</h2>
              <p className="text-xs text-gray-400 font-medium">Serveur : <span className="text-amber-400 font-bold">{waiter.name}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/[0.04] text-gray-400 hover:text-white rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-amber-500/[0.08] p-3 rounded-2xl border border-amber-500/20 text-xs space-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-amber-300">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Gestion exclusive par l'administration</span>
          </div>
          <p className="text-[11px] text-gray-400">
            L'attribution des tables est définie par le gérant / administrateur dans le panneau Admin.
          </p>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/[0.05] text-xs">
          <span className="text-gray-400 font-semibold flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span>Tables attribuées par le gérant</span>
          </span>
          <span className="font-extrabold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-xl border border-orange-500/20">
            {assignedTables.length} table{assignedTables.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid of Tables 1 to 15 */}
        <div className="grid grid-cols-5 gap-2.5">
          {Array.from({ length: totalTables }, (_, i) => i + 1).map((tableNum) => {
            const isAssigned = assignedTables.includes(tableNum);
            return (
              <div
                key={tableNum}
                className={`h-14 rounded-2xl font-extrabold text-sm flex flex-col items-center justify-center border ${
                  isAssigned
                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 border-orange-400/50 scale-[1.03]'
                    : 'bg-white/[0.02] border-white/[0.04] text-gray-600 opacity-40'
                }`}
              >
                <span className="text-[10px] opacity-70">T</span>
                <span>{tableNum < 10 ? `0${tableNum}` : tableNum}</span>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-5 h-5" />
            <span>Compris</span>
          </button>
        </div>
      </div>
    </div>
  );
};

