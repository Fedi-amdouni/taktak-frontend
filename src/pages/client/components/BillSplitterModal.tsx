import React, { useState } from 'react';
import { X, Users, Calculator, DollarSign } from 'lucide-react';
import { useCart } from '../../../context/CartContext';

interface BillSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillSplitterModal: React.FC<BillSplitterModalProps> = ({ isOpen, onClose }) => {
  const { totalPrice } = useCart();
  const [peopleCount, setPeopleCount] = useState(2);
  const [customTotal, setCustomTotal] = useState<number | ''>('');
  const [tipPercentage, setTipPercentage] = useState(0);

  if (!isOpen) return null;

  const baseTotal = typeof customTotal === 'number' && customTotal > 0 ? customTotal : (totalPrice > 0 ? totalPrice : 25.000);
  const tipAmount = baseTotal * (tipPercentage / 100);
  const grandTotal = baseTotal + tipAmount;
  const perPerson = grandTotal / Math.max(1, peopleCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm glass-panel bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-bold text-white">Division d'Addition</h2>
          </div>
          <button onClick={onClose} className="p-1 bg-gray-800 text-gray-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Amount Input / Display */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Montant Total (DT)</label>
          <input
            type="number"
            step="0.100"
            value={customTotal !== '' ? customTotal : baseTotal.toFixed(3)}
            onChange={(e) => setCustomTotal(parseFloat(e.target.value) || '')}
            className="w-full bg-gray-800 text-lg font-extrabold text-orange-400 px-4 py-2.5 rounded-2xl border border-gray-700 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* People Slider / Controls */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-300 flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span>Nombre de personnes</span>
            </span>
            <span className="font-extrabold text-amber-400 text-sm">{peopleCount} pers.</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={peopleCount}
            onChange={(e) => setPeopleCount(parseInt(e.target.value))}
            className="w-full accent-orange-500 bg-gray-800 rounded-lg cursor-pointer h-2"
          />
        </div>

        {/* Tip selection */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Pourboire Serveur</span>
          <div className="grid grid-cols-4 gap-2">
            {[0, 5, 10, 15].map((tip) => (
              <button
                key={tip}
                onClick={() => setTipPercentage(tip)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  tipPercentage === tip
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                }`}
              >
                {tip}%
              </button>
            ))}
          </div>
        </div>

        {/* Result Card */}
        <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 p-4 rounded-2xl text-center space-y-1">
          <span className="text-xs text-gray-300 font-medium">Chacun doit payer</span>
          <p className="text-2xl font-black text-orange-400">{perPerson.toFixed(3)} <span className="text-sm text-gray-400 font-normal">TND</span></p>
          {tipAmount > 0 && (
            <p className="text-[10px] text-gray-400">(Inclut {tipAmount.toFixed(3)} TND de pourboire total)</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-2xl text-xs transition-all"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
