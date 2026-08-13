import React from 'react';
import { AlertTriangle, LogOut, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const ConfirmLeaveModal: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  title = "Quitter la partie ?",
  message = "Êtes-vous sûr de vouloir quitter cette partie ? Toute la progression de ce jeu sera réinitialisée."
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#121622] p-6 text-white shadow-2xl space-y-5 animate-scaleUp">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-gray-400 hover:bg-white/20 hover:text-white transition"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">{title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Confirmation requise</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-gray-300">
          {message}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 py-3 text-xs font-black text-white hover:from-red-600 hover:to-rose-700 transition shadow-lg shadow-red-500/20"
          >
            <LogOut className="h-4 w-4" /> Oui, quitter
          </button>
        </div>
      </div>
    </div>
  );
};
