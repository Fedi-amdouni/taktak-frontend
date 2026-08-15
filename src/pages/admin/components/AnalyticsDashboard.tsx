import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Award,
  RefreshCw,
  Flame,
  Crown,
  BarChart3,
  Clock,
  Coins,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap
} from 'lucide-react';
import { api, OwnerAnalytics } from '../../../services/api';
import { formatPrice } from '../../../utils/formatPrice';

interface AnalyticsDashboardProps {
  cafeSlug: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ cafeSlug }) => {
  const [data, setData] = useState<OwnerAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics(cafeSlug);
      setData(res);
    } catch (e) {
      console.error('Erreur chargement analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [cafeSlug]);

  const maxHourlyOrders = Math.max(
    ...(data?.hourlyDistribution?.map((h) => h.ordersCount) || [1]),
    1
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/25 text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-tight">Performances & Revenus en Direct</h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
              Statistiques consolidées sans doublon • PostgreSQL
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadAnalytics}
            className="p-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 rounded-xl border border-white/[0.08] transition-all flex items-center space-x-1.5 text-xs font-bold active:scale-95"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Chiffre d'Affaires Total */}
        <div className="glass-panel p-5 rounded-3xl border border-orange-500/20 relative overflow-hidden group hover:border-orange-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chiffre d'Affaires</span>
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <p className="text-2xl font-black text-white">
              <span className="gradient-text">{data ? formatPrice(data.totalRevenue) : '0.000'}</span>
              <span className="text-xs font-bold text-gray-500 ml-1.5">TND</span>
            </p>
            <p className="text-[10px] text-emerald-400/90 font-bold mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Commandes validées
            </p>
          </div>
        </div>

        {/* 2. Total Commandes */}
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/20 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volume Commandes</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <p className="text-2xl font-black text-white">{data ? data.totalOrders : 0}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-2">
              Taux d'annulation : <strong className="text-gray-200">{data?.cancellationRate ?? 0}%</strong>
            </p>
          </div>
        </div>

        {/* 3. Ticket Moyen */}
        <div className="glass-panel p-5 rounded-3xl border border-purple-500/20 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Panier Moyen</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <p className="text-2xl font-black text-white">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {data ? formatPrice(data.averageOrderValue) : '0.000'}
              </span>
              <span className="text-xs font-bold text-gray-500 ml-1.5">TND</span>
            </p>
            <p className="text-[10px] text-gray-400 font-medium mt-2">Dépense moyenne par table servie</p>
          </div>
        </div>

        {/* 4. Pourboires & Vitesse de Service */}
        <div className="glass-panel p-5 rounded-3xl border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temps Préparation</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <p className="text-2xl font-black text-emerald-400">
              {data?.averageFulfillmentTimeMinutes ?? 5.2} <span className="text-xs font-bold text-gray-400">min</span>
            </p>
            <p className="text-[10px] text-amber-300 font-bold mt-2 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" />
              <span>Pourboires : {data?.totalTips ? formatPrice(data.totalTips) : '0.000'} TND</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Row: Hourly Peaks + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* HOURLY PEAKS BAR CHART (2 COLS) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Heures d'Affluence & Activité en Salle</h3>
                <p className="text-[10px] text-gray-500">Distribution du volume de commandes de 08h à 23h</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
              Aujourd'hui
            </span>
          </div>

          {/* Bars representation */}
          <div className="pt-4">
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 items-end h-44 pb-2 border-b border-white/[0.06]">
              {data?.hourlyDistribution?.map((item, idx) => {
                const heightPct = Math.max(8, (item.ordersCount / maxHourlyOrders) * 100);
                const isPeak = item.ordersCount === maxHourlyOrders && item.ordersCount > 0;

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/20 text-white px-2 py-1 rounded-lg text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20">
                      {item.hour}: {item.ordersCount} cmds ({formatPrice(item.revenue)} TND)
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isPeak
                          ? 'bg-gradient-to-t from-orange-500 to-amber-400 shadow-md shadow-orange-500/30'
                          : item.ordersCount > 0
                          ? 'bg-orange-500/40 hover:bg-orange-500/70'
                          : 'bg-white/[0.04]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[8px] font-mono text-gray-500 mt-1.5 block group-hover:text-amber-400 transition-colors">
                      {item.hour.replace('h', '')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TOP 6 BEST SELLERS (1 COL) */}
        <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-white/[0.06] pb-3">
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Top Meilleures Ventes</h3>
              <p className="text-[10px] text-gray-500">Classé par recettes & quantité</p>
            </div>
          </div>

          {!data || data.topProducts.length === 0 ? (
            <div className="text-center py-10 space-y-1">
              <Flame className="w-8 h-8 text-gray-700 mx-auto" />
              <p className="text-xs text-gray-500 font-medium">Aucune commande enregistrée</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.topProducts.map((item, idx) => {
                const maxQty = data.topProducts[0]?.quantitySold || 1;
                const barWidth = (item.quantitySold / maxQty) * 100;
                const medals = ['🥇', '🥈', '🥉'];

                return (
                  <div
                    key={idx}
                    className="relative bg-white/[0.02] p-3 rounded-2xl border border-white/[0.04] flex items-center justify-between text-xs overflow-hidden group hover:bg-white/[0.05] transition-all duration-300"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none transition-all duration-700"
                      style={{ width: `${barWidth}%` }}
                    />

                    <div className="flex items-center space-x-2.5 relative z-10 min-w-0 pr-2">
                      <span className="w-7 h-7 rounded-xl bg-white/[0.04] text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {idx < 3 ? medals[idx] : `#${idx + 1}`}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-gray-200 text-xs truncate">{item.name}</h4>
                        <span className="text-[10px] text-gray-500">{item.quantitySold} vendus</span>
                      </div>
                    </div>

                    <div className="text-right relative z-10 flex-shrink-0">
                      <span className="font-black text-xs text-white">
                        <span className="gradient-text">{formatPrice(Number(item.totalRevenue))}</span>
                      </span>
                      <span className="text-[9px] text-gray-500 block font-semibold">TND</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
