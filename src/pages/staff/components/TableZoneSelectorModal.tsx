import React, { useState, useEffect } from 'react';
import { MapPin, Check, Sparkles, X, Loader2 } from 'lucide-react';
import { Waiter } from '../../../types';
import { api } from '../../../services/api';

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
  onZoneUpdated,
}) => {
  const totalTables = 15; // 1 to 15
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (waiter) {
      setSelectedTables(waiter.assignedTables || []);
    }
  }, [waiter, isOpen]);

  if (!isOpen || !waiter) return null;

  const toggleTable = (tableNum: number) => {
    setSelectedTables((prev) =>
      prev.includes(tableNum) ? prev.filter((t) => t !== tableNum) : [...prev, tableNum].sort((a, b) => a - b)
    );
  };

  const handleSelectAll = () => {
    if (selectedTables.length === totalTables) {
      setSelectedTables([]);
    } else {
      setSelectedTables(Array.from({ length: totalTables }, (_, i) => i + 1));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.assignWaiterTables(waiter.id, selectedTables);
      if (onZoneUpdated) {
        onZoneUpdated(updated);
      }
      onClose();
    } catch (e) {
      console.error('Erreur mise à jour zone', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn transition-all">
      <div className="w-full max-w-md bg-[#0e111a] border border-white/[0.12] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] sm:max-h-[90vh] overflow-y-auto relative animate-slideUp sm:animate-scaleUp">
        {/* Mobile Sheet Handle */}
        <div className="w-12 h-1.5 bg-white/20 hover:bg-white/40 rounded-full mx-auto mb-2 sm:hidden cursor-pointer" onClick={onClose} />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-500/25">
              👤
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Ma Zone de Tables</h2>
              <p className="text-xs text-gray-400 font-medium">Service en Salle : <span className="text-amber-400 font-bold">{waiter.name}</span></p>
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
        <div className="bg-orange-500/[0.08] p-3 rounded-2xl border border-orange-500/20 text-xs space-y-1">
          <div className="flex items-center justify-between font-bold text-orange-300">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Sélection de vos tables de service</span>
            </span>
            <button
              onClick={handleSelectAll}
              className="text-[10px] bg-white/[0.08] hover:bg-white/[0.15] text-white px-2.5 py-1 rounded-lg transition-all"
            >
              {selectedTables.length === totalTables ? 'Désélectionner tout' : 'Tout sélectionner'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            Touchez les tables que vous prenez en charge pour ce shift.
          </p>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/[0.05] text-xs">
          <span className="text-gray-400 font-semibold flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span>Tables actuellement sélectionnées</span>
          </span>
          <span className="font-extrabold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-xl border border-orange-500/20">
            {selectedTables.length} table{selectedTables.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid of Tables 1 to 15 */}
        <div className="grid grid-cols-5 gap-2.5">
          {Array.from({ length: totalTables }, (_, i) => i + 1).map((tableNum) => {
            const isAssigned = selectedTables.includes(tableNum);
            return (
              <button
                key={tableNum}
                type="button"
                onClick={() => toggleTable(tableNum)}
                className={`h-14 rounded-2xl font-extrabold text-sm flex flex-col items-center justify-center border transition-all duration-200 active:scale-95 cursor-pointer ${
                  isAssigned
                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 border-orange-400/50 scale-[1.03]'
                    : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <span className="text-[10px] opacity-70">T</span>
                <span>{tableNum < 10 ? `0${tableNum}` : tableNum}</span>
              </button>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Enregistrer ma zone</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
