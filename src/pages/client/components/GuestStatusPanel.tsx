import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, ChevronRight, Clock3 } from 'lucide-react';
import { Order } from '../../../types';
import { api } from '../../../services/api';

interface GuestStatusPanelProps {
  activeOrderId?: string | null;
  waiterRequest?: 'WAITER' | 'BILL' | null;
  onOpenOrder: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Commande reçue',
  PREPARING: 'En préparation',
  READY: 'Prête au comptoir',
  PICKED_UP: 'En route vers votre table',
  SERVED: 'Servie à table',
  PAID: 'Réglée',
};

export const GuestStatusPanel: React.FC<GuestStatusPanelProps> = ({
  activeOrderId,
  waiterRequest,
  onOpenOrder,
}) => {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!activeOrderId) {
      setOrder(null);
      return;
    }
    let mounted = true;
    const load = async () => {
      try {
        const current = await api.getOrder(activeOrderId);
        if (mounted) setOrder(current);
      } catch {
        // The full tracker handles detailed errors; keep this compact surface quiet.
      }
    };
    load();
    const interval = window.setInterval(load, 10000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [activeOrderId]);

  const etaLabel = useMemo(() => {
    if (!order) return 'Calcul en cours';
    if (order.status === 'READY' || order.status === 'PICKED_UP') return 'Prête maintenant';
    if (order.status === 'SERVED' || order.status === 'PAID') return 'Terminée';
    const remaining = order.estimatedReadyAt
      ? Math.max(1, Math.ceil((new Date(order.estimatedReadyAt).getTime() - Date.now()) / 60000))
      : order.estimatedWaitMinutes;
    return remaining ? `Environ ${remaining} min` : 'Quelques minutes';
  }, [order]);

  if (!activeOrderId && !waiterRequest) return null;

  return (
    <section className="mx-auto w-full max-w-md px-4 pt-3" aria-label="État de votre service">
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11141d] shadow-lg shadow-black/20">
        {activeOrderId && (
          <button onClick={onOpenOrder} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.025]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
              <Clock3 className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">{etaLabel}</span>
              <span className="mt-0.5 block truncate text-sm font-extrabold text-white">{STATUS_LABELS[order?.status || 'RECEIVED'] || 'Commande en cours'}</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">Suivre <ChevronRight className="h-3.5 w-3.5" /></span>
          </button>
        )}

        {activeOrderId && waiterRequest && <div className="mx-4 h-px bg-white/[0.06]" />}

        {waiterRequest && (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-300">
              {waiterRequest === 'BILL' ? <CheckCircle2 className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </span>
            <span>
              <span className="block text-sm font-extrabold text-white">{waiterRequest === 'BILL' ? 'Addition demandée' : 'Serveur appelé'}</span>
              <span className="mt-0.5 block text-[11px] text-emerald-300/80">Demande envoyée à l’équipe de salle</span>
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
