import React, { createContext, useContext, useState, useEffect } from 'react';
import { TableSession } from '../types';

interface TableSessionContextType {
  currentCafeSlug: string;
  currentTableNumber: number;
  scannedTableNumber: number | null;
  pendingTransferTableNumber: number | null;
  showTableChangeModal: boolean;
  activeOrderId: string | null;
  setActiveOrderId: (orderId: string | null) => void;
  confirmTableTransfer: () => void;
  cancelTableTransfer: () => void;
  initializeSession: (cafeSlug: string, tableNumber: number) => void;
}

const TableSessionContext = createContext<TableSessionContextType | undefined>(undefined);

const STORAGE_KEY = 'taktak_table_session';

export const TableSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCafeSlug, setCurrentCafeSlug] = useState<string>('monastir-lounge');
  const [currentTableNumber, setCurrentTableNumber] = useState<number>(5);
  const [scannedTableNumber, setScannedTableNumber] = useState<number | null>(null);
  const [pendingTransferTableNumber, setPendingTransferTableNumber] = useState<number | null>(null);
  const [showTableChangeModal, setShowTableChangeModal] = useState<boolean>(false);
  const [activeOrderId, setActiveOrderIdState] = useState<string | null>(null);

  // Load persisted session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const session: TableSession = JSON.parse(saved);
        setCurrentCafeSlug(session.cafeSlug);
        setCurrentTableNumber(session.tableNumber);
        if (session.activeOrderId) {
          setActiveOrderIdState(session.activeOrderId);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const setActiveOrderId = (orderId: string | null) => {
    setActiveOrderIdState(orderId);
    saveSession(currentCafeSlug, currentTableNumber, orderId);
  };

  const saveSession = (slug: string, tableNum: number, orderId: string | null = activeOrderId) => {
    const session: TableSession = {
      cafeSlug: slug,
      tableNumber: tableNum,
      activeOrderId: orderId || undefined,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  };

  const initializeSession = (cafeSlug: string, tableNumber: number) => {
    setScannedTableNumber(tableNumber);

    // Check if there is an existing session on a DIFFERENT table for the same cafe
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const session: TableSession = JSON.parse(saved);
        if (session.cafeSlug === cafeSlug && session.tableNumber !== tableNumber) {
          // TABLE CHANGE DETECTED!
          setPendingTransferTableNumber(tableNumber);
          setShowTableChangeModal(true);
          return;
        }
      } catch {
        // Ignore
      }
    }

    // Direct initialization if same table or clean session
    setCurrentCafeSlug(cafeSlug);
    setCurrentTableNumber(tableNumber);
    saveSession(cafeSlug, tableNumber, activeOrderId);
  };

  const confirmTableTransfer = () => {
    if (pendingTransferTableNumber !== null) {
      setCurrentTableNumber(pendingTransferTableNumber);
      saveSession(currentCafeSlug, pendingTransferTableNumber, activeOrderId);
      setPendingTransferTableNumber(null);
      setShowTableChangeModal(false);
    }
  };

  const cancelTableTransfer = () => {
    // Keep old table session
    setPendingTransferTableNumber(null);
    setShowTableChangeModal(false);
  };

  return (
    <TableSessionContext.Provider
      value={{
        currentCafeSlug,
        currentTableNumber,
        scannedTableNumber,
        pendingTransferTableNumber,
        showTableChangeModal,
        activeOrderId,
        setActiveOrderId,
        confirmTableTransfer,
        cancelTableTransfer,
        initializeSession,
      }}
    >
      {children}
    </TableSessionContext.Provider>
  );
};

export const useTableSession = () => {
  const context = useContext(TableSessionContext);
  if (!context) {
    throw new Error('useTableSession doit être utilisé dans un TableSessionProvider');
  }
  return context;
};
