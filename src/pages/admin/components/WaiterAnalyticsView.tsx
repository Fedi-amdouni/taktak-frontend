import React, { useState, useEffect } from 'react';
import { Award, Zap, Heart, CheckCircle2, TrendingUp, Clock, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { WaiterPerformance } from '../../../types';
import { api } from '../../../services/api';

interface WaiterAnalyticsViewProps {
  cafeSlug: string;
}

export const WaiterAnalyticsView: React.FC<WaiterAnalyticsViewProps> = ({ cafeSlug }) => {
  const [period, setPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');
  const [performances, setPerformances] = useState<WaiterPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getWaiterPerformance(cafeSlug, period);
      setPerformances(data);
    } catch (err) {
      console.error('Erreur chargement analytics serveurs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cafeSlug, period]);

  // Global KPIs calculation
  const totalTeamRevenue = performances.reduce((acc, p) => acc + (p.totalRevenue || 0), 0);
  const totalTeamOrders = performances.reduce((acc, p) => acc + (p.ordersCount || 0), 0);
  const totalTeamTips = performances.reduce((acc, p) => acc + (p.totalTips || 0), 0);

  const avgTeamResponseTimeSec = performances.length > 0
    ? performances.reduce((acc, p) => acc + (p.avgResponseTimeSeconds || 0), 0) / performances.length
    : 0;

  const topWaiter = performances.length > 0 ? performances[0] : null;
  const maxRevenue = topWaiter && topWaiter.totalRevenue > 0 ? topWaiter.totalRevenue : 1;

  const formatSeconds = (sec: number) => {
    if (!sec || sec === 0) return 'Instant';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const getResponseTimeBadge = (sec: number) => {
    if (sec <= 120) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        label: '🟢 Ultra Rapide',
      };
    } else if (sec <= 300) {
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        label: '🟠 Modéré',
      };
    } else {
      return {
        bg: 'bg-red-500/10 text-red-400 border-red-500/20',
        label: '🔴 Lent (> 5 min)',
      };
    }
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg shadow-orange-500/25 text-white">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">Performance & Vitesse Serveurs</h2>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Analytique individuelle du chiffre d'affaires, temps de réactivité et pourboires
            </p>
          </div>
        </div>

        {/* Period Pills */}
        <div className="flex items-center space-x-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.06]">
          {(['TODAY', 'WEEK', 'MONTH'] as const).map((pKey) => {
            const labels = { TODAY: "Aujourd'hui", WEEK: 'Cette Semaine', MONTH: 'Ce Mois' };
            const isActive = period === pKey;
            return (
              <button
                key={pKey}
                onClick={() => setPeriod(pKey)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 ${
                  isActive
                    ? 'category-pill-active text-white shadow-lg shadow-orange-500/20 scale-[1.02]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {labels[pKey]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Global KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Top Waiter */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
              Top Serveur du Shift
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-white flex items-center space-x-2">
              <span>{topWaiter ? topWaiter.waiterName : 'Aucun'}</span>
              {topWaiter && <span className="text-base">🥇</span>}
            </div>
            <p className="text-[11px] text-amber-300/80 font-bold mt-1">
              {topWaiter ? `${Number(topWaiter.totalRevenue || 0).toFixed(3)} TND (${topWaiter.ordersCount} cmd)` : '0.000 TND'}
            </p>
          </div>
        </div>

        {/* KPI 2: Avg Response Time */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
              Temps Réactivité Moyen
            </span>
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-white">
              {formatSeconds(avgTeamResponseTimeSec)}
            </div>
            <p className="text-[11px] text-emerald-400 font-bold mt-1">
              {avgTeamResponseTimeSec <= 120 ? '⚡ Réactivité excellente' : '⏱️ Temps de prise en charge'}
            </p>
          </div>
        </div>

        {/* KPI 3: Total Tips */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
              Pourboires Accumulés
            </span>
            <div className="p-2 bg-pink-500/10 text-pink-400 rounded-xl border border-pink-500/20">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-white">
              {Number(totalTeamTips).toFixed(3)} <span className="text-xs text-gray-500 font-medium">TND</span>
            </div>
            <p className="text-[11px] text-pink-400/80 font-bold mt-1">
              Cumul des gratifications
            </p>
          </div>
        </div>

        {/* KPI 4: Total Orders */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
              Volume Total Commandes
            </span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-white">
              {totalTeamOrders} <span className="text-xs text-gray-500 font-medium">commandes</span>
            </div>
            <p className="text-[11px] text-blue-400/80 font-bold mt-1">
              Total équipe sur la période
            </p>
          </div>
        </div>
      </div>

      {/* Waiters Comparative Table */}
      <div className="glass-panel rounded-2xl border border-white/[0.06] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
            <span>Tableau Comparatif de l'Équipe</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </h3>
          <span className="text-[11px] text-gray-500 font-medium">Classé par chiffre d'affaires</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Sparkles className="w-8 h-8 text-orange-400 mx-auto animate-pulse mb-2" />
            <p className="text-xs text-gray-500">Calcul des performances...</p>
          </div>
        ) : performances.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            Aucune donnée de performance enregistrée pour cette période.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.06] text-gray-400 uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="py-3.5 px-4">Rang / Serveur</th>
                  <th className="py-3.5 px-4 text-center">Commandes Servies</th>
                  <th className="py-3.5 px-4 text-right">CA Généré</th>
                  <th className="py-3.5 px-4 text-center">Réactivité (Acceptation)</th>
                  <th className="py-3.5 px-4 text-center">Livraison Moyenne</th>
                  <th className="py-3.5 px-4 text-right">Pourboires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {performances.map((perf, index) => {
                  const badge = getResponseTimeBadge(perf.avgResponseTimeSeconds);
                  const isTop3 = index < 3;
                  const medal = isTop3 ? medals[index] : null;

                  return (
                    <tr key={perf.waiterId} className="hover:bg-white/[0.02] transition-colors duration-200">
                      {/* Name + Rank */}
                      <td className="py-4 px-4 font-bold text-white flex items-center space-x-3">
                        <span className="text-base w-6 text-center">{medal || `#${index + 1}`}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-xs">
                            👤
                          </div>
                          <div>
                            <span className="text-sm font-extrabold text-white block">{perf.waiterName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Orders count */}
                      <td className="py-4 px-4 text-center font-bold text-gray-200">
                        <span className="bg-white/[0.04] px-3 py-1 rounded-xl border border-white/[0.06]">
                          {perf.ordersCount} cmd
                        </span>
                      </td>

                      {/* Revenue */}
                      <td className="py-4 px-4 text-right font-extrabold text-amber-300 text-sm">
                        {Number(perf.totalRevenue || 0).toFixed(3)} <span className="text-[10px] text-gray-500 font-normal">TND</span>
                      </td>

                      {/* Response Time Badge */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-xl text-[11px] font-extrabold border ${badge.bg}`}>
                          <span>{badge.label}</span>
                          <span className="ml-1 text-[10px] opacity-80">({formatSeconds(perf.avgResponseTimeSeconds)})</span>
                        </span>
                      </td>

                      {/* Fulfillment Time */}
                      <td className="py-4 px-4 text-center text-gray-300 font-semibold">
                        <span className="flex items-center justify-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span>{perf.avgFulfillmentTimeMinutes} min</span>
                        </span>
                      </td>

                      {/* Tips */}
                      <td className="py-4 px-4 text-right font-bold text-pink-400">
                        {Number(perf.totalTips || 0).toFixed(3)} <span className="text-[10px] text-gray-500 font-normal">TND</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visual Sales Progress Bars */}
      {performances.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Répartition du Chiffre d'Affaires par Serveur
          </h3>
          <div className="space-y-3">
            {performances.map((perf) => {
              const percentage = Math.round((Number(perf.totalRevenue || 0) / Number(maxRevenue)) * 100);
              return (
                <div key={perf.waiterId} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white flex items-center space-x-2">
                      <span>👤 {perf.waiterName}</span>
                    </span>
                    <span className="text-amber-400">{Number(perf.totalRevenue || 0).toFixed(3)} TND</span>
                  </div>
                  <div className="w-full bg-white/[0.04] h-3 rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500 shadow-md"
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
