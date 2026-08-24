import React, { useState } from 'react';
import { RefreshCw, MapPin, CheckCircle2, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTableSession } from '../../../context/TableSessionContext';
import { api } from '../../../services/api';
import { getOrCreateParticipantId } from '../../../utils/clientIdentity';
import { clientTablePath, completeTableTransfer } from '../../../utils/tableTransferFlow';
import { readStorageItemSafely, removeStorageItemSafely } from '../../../utils/tableSessionStorage';

export const TableChangeModal: React.FC = () => {
  const {
    showTableChangeModal,
    currentCafeSlug,
    currentTableNumber,
    pendingTransferTableNumber,
    activeOrderId,
    confirmTableTransfer,
    cancelTableTransfer,
  } = useTableSession();
  const navigate = useNavigate();
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  if (!showTableChangeModal || pendingTransferTableNumber === null) return null;

  const handleConfirm = async () => {
    if (isTransferring) return;
    setIsTransferring(true);
    setTransferError(null);

    const sourceTokenKey = `taktak_table_token_${currentCafeSlug}_${currentTableNumber}`;
    const targetTokenKey = `taktak_table_token_${currentCafeSlug}_${pendingTransferTableNumber}`;
    const targetToken = new URLSearchParams(window.location.search).get('token')
      || readStorageItemSafely(sessionStorage, targetTokenKey);
    try {
      await completeTableTransfer({
        activeOrderId,
        cafeSlug: currentCafeSlug,
        sourceTableNumber: currentTableNumber,
        targetTableNumber: pendingTransferTableNumber,
        participantId: getOrCreateParticipantId(),
        sourceSessionToken: readStorageItemSafely(sessionStorage, sourceTokenKey),
        targetSessionToken: targetToken,
      }, {
        transferOrder: api.transferOrderTable,
        commitLocalTransfer: confirmTableTransfer,
      });
      removeStorageItemSafely(sessionStorage, sourceTokenKey);
    } catch (error) {
      console.error('Error transferring order table', error);
      setTransferError(error instanceof Error
        ? error.message
        : 'Le transfert a échoué. Votre commande reste sur l’ancienne table.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCancel = () => {
    cancelTableTransfer();
    navigate(clientTablePath(currentCafeSlug, currentTableNumber), { replace: true });
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

        {transferError && (
          <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-200">
            {transferError}
          </p>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleCancel}
            disabled={isTransferring}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-2xl text-xs transition-all active:scale-95 border border-gray-700"
          >
            Non, garder Table {currentTableNumber}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isTransferring}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg shadow-orange-500/25 transition-all active:scale-95 flex items-center justify-center space-x-1"
          >
            {isTransferring ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{isTransferring ? 'Transfert...' : 'Transférer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
