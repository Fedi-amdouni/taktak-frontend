import React, { useState, useEffect } from 'react';
import { MapPin, Check, Sparkles, CheckSquare, Square } from 'lucide-react';
import { Waiter } from '../../types';
import { api } from '../../services/api';

interface TableZoneSelectorModalProps {
  waiter: Waiter | null;
  isOpen: boolean;
  onClose: () => void;
  onZoneUpdated: (updatedWaiter: Waiter) => void;
}

export const TableZoneSelectorModal: React.FC<TableZoneSelectorModalProps> = ({
  waiter,
  isOpen,
  onClose,
  onZoneUpdated,
}) => {
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const totalTables = 15; // 1 to 15

  useEffect(() => {
    if (waiter && isOpen) {
      setSelectedTables(waiter.assignedTables || []);
    }
  }, [waiter, isOpen]);

  if (!isOpen || !waiter) return null;

  const toggleTable = (tableNum: number) => {
    setSelectedTables((prev) =>
      prev.includes(tableNum) ? prev.filter((t) => t !== tableNum) : [...prev, tableNum].sort((a, b) => a - b)
    );
  };

  const selectAll = () => {
    const all = Array.from({ length: totalTables }, (_, i) => i + 1);
    setSelectedTables(all);
  };

  const deselectAll = () => {
    setSelectedTables([]);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const updated = await api.assignWaiterTables(waiter.id, selectedTables);
      onZoneUpdated(updated);
      onClose();
    } catch (err) {
      alert('Erreur enregistrement de la zone');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fadeIn">
      <div className="w-full max-w-md bg-[#0d0f18] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-500/25">
            👤
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Affectation des Tables</h2>
            <p className="text-xs text-gray-400 font-medium">Serveur : <span className="text-amber-400 font-bold">{waiter.name}</span></p>
          </div>
        </div>

        {/* Quick select actions */}
        <div className="flex items-center justify-between bg-white/[0.03] p-2 rounded-2xl border border-white/[0.05] text-xs">
          <span className="text-gray-400 font-semibold pl-2">
            {selectedTables.length} table{selectedTables.length > 1 ? 's' : ''} sélectionnée{selectedTables.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={selectAll}
              className="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 rounded-xl font-bold text-[11px] transition-all"
            >
              Tout cocher
            </button>
            <button
              onClick={deselectAll}
              className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-gray-500 rounded-xl font-bold text-[11px] transition-all"
            >
              Vider
            </button>
          </div>
        </div>

        {/* Grid of Tables 1 to 15 */}
        <div className="grid grid-cols-5 gap-2.5">
          {Array.from({ length: totalTables }, (_, i) => i + 1).map((tableNum) => {
            const isSelected = selectedTables.includes(tableNum);
            return (
              <button
                key={tableNum}
                onClick={() => toggleTable(tableNum)}
                className={`h-14 rounded-2xl font-extrabold text-sm flex flex-col items-center justify-center transition-all duration-200 active:scale-95 border ${
                  isSelected
                    ? 'category-pill-active text-white shadow-lg shadow-orange-500/25 scale-[1.05] border-orange-400/50'
                    : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span className="text-[10px] opacity-70">T</span>
                <span>{tableNum < 10 ? `0${tableNum}` : tableNum}</span>
              </button>
            );
          })}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            disabled={submitting}
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            <span>{submitting ? 'Enregistrement...' : `Démarrer mon service (${selectedTables.length} tables)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
