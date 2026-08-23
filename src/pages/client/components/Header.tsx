import React from 'react';
import { Bell } from 'lucide-react';
import { useTableSession } from '../../../context/TableSessionContext';

interface HeaderProps {
  cafeName: string;
  logoUrl?: string;
  waiterCallsEnabled?: boolean;
  onOpenServiceModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cafeName,
  logoUrl,
  waiterCallsEnabled = true,
  onOpenServiceModal,
}) => {
  const { currentTableNumber } = useTableSession();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#08090e]/90 px-4 py-3 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={cafeName} className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-1 ring-white/10" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-sm font-black text-white">TT</div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-sm font-black tracking-tight text-white">{cafeName}</h1>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-400">Table {String(currentTableNumber).padStart(2, '0')}</p>
          </div>
        </div>

        {waiterCallsEnabled && (
          <button
            onClick={onOpenServiceModal}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-[11px] font-extrabold text-amber-200 transition hover:bg-amber-500/15 active:scale-95"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Appeler</span>
          </button>
        )}
      </div>
    </header>
  );
};
