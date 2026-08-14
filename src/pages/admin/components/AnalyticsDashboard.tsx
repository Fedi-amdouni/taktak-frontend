import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Award, RefreshCw, Flame, Crown, BarChart3 } from 'lucide-react';
import { api, OwnerAnalytics } from '../../../services/api';

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">Tableau de Bord</h2>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Performance & Analytics en temps réel</p>
          </div>
        </div>
        <button
          onClick={loadAnalytics}
          className="p-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 rounded-xl border border-white/[0.06] transition-all duration-300 active:rotate-180"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue */}
        <div className="glass-panel p-5 rounded-2xl border border-orange-500/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/[0.08] to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Chiffre d'Affaires</span>
            <div className="p-2 bg-orange-500/[0.08] text-orange-400 rounded-xl border border-orange-500/15">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <p className="text-2xl font-black">
              <span className="gradient-text">{data ? data.totalRevenue.toFixed(3) : '0.000'}</span>
              <span className="text-xs font-bold text-gray-600 ml-1.5">TND</span>
            </p>
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-[9px] text-emerald-400/80 font-semibold">Données PostgreSQL en direct</p>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/[0.06] to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Commandes</span>
            <div className="p-2 bg-amber-500/[0.08] text-amber-400 rounded-xl border border-amber-500/15">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <p className="text-2xl font-black text-white">{data ? data.totalOrders : 0}</p>
            <p className="text-[9px] text-gray-600 mt-2 font-medium">Commandes servies ou en cours</p>
          </div>
        </div>

        {/* AOV */}
        <div className="glass-panel p-5 rounded-2xl border border-violet-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/[0.06] to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Panier Moyen</span>
            <div className="p-2 bg-violet-500/[0.08] text-violet-400 rounded-xl border border-violet-500/15">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <p className="text-2xl font-black">
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{data ? data.averageOrderValue.toFixed(3) : '0.000'}</span>
              <span className="text-xs font-bold text-gray-600 ml-1.5">TND</span>
            </p>
            <p className="text-[9px] text-gray-600 mt-2 font-medium">Dépense moyenne par table</p>
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-orange-500/[0.08] rounded-lg">
              <Crown className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Top 5 Meilleures Ventes</h3>
              <span className="text-[9px] text-gray-600 font-medium">Classé par quantité vendue</span>
            </div>
          </div>
        </div>

        {!data || data.topProducts.length === 0 ? (
          <div className="text-center py-10">
            <Flame className="w-10 h-10 text-gray-800 mx-auto mb-2" />
            <p className="text-xs text-gray-600 font-medium">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.topProducts.map((item, idx) => {
              const maxQty = data.topProducts[0]?.quantitySold || 1;
              const barWidth = (item.quantitySold / maxQty) * 100;
              const medals = ['🥇', '🥈', '🥉'];
              
              return (
                <div
                  key={idx}
                  className="relative bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.04] flex items-center justify-between text-xs overflow-hidden group hover:bg-white/[0.04] transition-all duration-300"
                >
                  {/* Progress bar background */}
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500/[0.06] to-transparent pointer-events-none transition-all duration-700"
                    style={{ width: `${barWidth}%` }}
                  />

                  <div className="flex items-center space-x-3 relative z-10">
                    <span className="w-8 h-8 rounded-lg bg-white/[0.04] text-sm flex items-center justify-center border border-white/[0.06]">
                      {idx < 3 ? medals[idx] : `#${idx + 1}`}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-200 text-[12px]">{item.name}</h4>
                      <span className="text-[9px] text-gray-600 font-medium">{item.quantitySold} vendus</span>
                    </div>
                  </div>

                  <div className="text-right relative z-10">
                    <span className="font-extrabold text-sm">
                      <span className="gradient-text">{typeof item.totalRevenue === 'number' ? item.totalRevenue.toFixed(3) : Number(item.totalRevenue).toFixed(3)}</span>
                    </span>
                    <span className="text-[9px] text-gray-600 block font-medium">TND</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
