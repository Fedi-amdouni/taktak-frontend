import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Coffee, QrCode, TrendingUp, Users, ExternalLink, Sparkles, Zap, Music, Layout, ArrowLeft, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MenuManager } from './components/MenuManager';
import { QrPdfGenerator } from './components/QrPdfGenerator';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { WaiterManager } from './components/WaiterManager';
import { WaiterAnalyticsView } from './components/WaiterAnalyticsView';
import { AmbianceManagement } from './components/AmbianceManagement';
import { FloorPlanEditor } from './components/FloorPlanEditor';
import { RewardCampaignManager } from './components/RewardCampaignManager';

export const AdminDashboard: React.FC = () => {
  const { cafeSlug = 'monastir-lounge' } = useParams<{ cafeSlug: string }>();
  const [activeTab, setActiveTab] = useState<'analytics' | 'floorplan' | 'waiter-analytics' | 'ambiance' | 'menu' | 'waiters' | 'rewards' | 'qrcodes'>('analytics');

  const tabs = [
    { key: 'analytics', label: 'Revenus & Analytics', icon: TrendingUp },
    { key: 'floorplan', label: 'Plan de Salle 2D', icon: Layout },
    { key: 'waiter-analytics', label: 'Performance Équipe Salle', icon: Zap },
    { key: 'ambiance', label: 'Ambiance & Jukebox', icon: Music },
    { key: 'menu', label: 'Menu & Produits', icon: Coffee },
    { key: 'waiters', label: 'Équipe Salle & PINs', icon: Users },
    { key: 'rewards', label: 'Avis & Coupons', icon: Gift },
    { key: 'qrcodes', label: 'QR Codes', icon: QrCode },
  ] as const;

  return (
    <div className="min-h-screen bg-[#08090e] text-white p-4 sm:p-8 space-y-6 max-w-7xl mx-auto relative">
      {/* Ambient */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[30vh] bg-gradient-radial from-orange-500/[0.04] to-transparent pointer-events-none" />

      {/* Header */}
      <header className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-500/25 animate-glow-pulse">
            TT
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-lg font-extrabold tracking-tight">Administration</h1>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-float" />
            </div>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Gestion complète de votre établissement</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center space-x-2 text-[11px] font-bold">
          <Link to="/admin" className="bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white px-3 py-2.5 rounded-xl border border-white/[0.06] flex items-center space-x-1.5 transition-all">
            <ArrowLeft className="w-3 h-3" />
            <span>Mes cafés</span>
          </Link>
          <a
            href={`/m/${cafeSlug}/t/05`}
            target="_blank"
            rel="noreferrer"
            className="bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-orange-400 px-3.5 py-2.5 rounded-xl border border-white/[0.06] flex items-center space-x-1.5 transition-all duration-300"
          >
            <span>Aperçu Client</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={`/staff/${cafeSlug}`}
            target="_blank"
            rel="noreferrer"
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-3.5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 flex items-center space-x-1.5 transition-all duration-300"
          >
            <span>Écran Service en Salle</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar relative z-10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-[11px] transition-all duration-300 whitespace-nowrap ${
                isActive
                  ? 'category-pill-active text-white scale-[1.02]'
                  : 'bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:bg-white/[0.06] hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="divider-gradient" />

      {/* Content */}
      <div className="relative z-10">
        {activeTab === 'analytics' && <AnalyticsDashboard cafeSlug={cafeSlug} />}
        {activeTab === 'floorplan' && <FloorPlanEditor cafeSlug={cafeSlug} />}
        {activeTab === 'waiter-analytics' && <WaiterAnalyticsView cafeSlug={cafeSlug} />}
        {activeTab === 'ambiance' && <AmbianceManagement cafeSlug={cafeSlug} />}
        {activeTab === 'menu' && <MenuManager cafeSlug={cafeSlug} />}
        {activeTab === 'waiters' && <WaiterManager cafeSlug={cafeSlug} />}
        {activeTab === 'rewards' && <RewardCampaignManager cafeSlug={cafeSlug} />}
        {activeTab === 'qrcodes' && <QrPdfGenerator cafeSlug={cafeSlug} cafeName="Monastir Lounge" />}
      </div>
    </div>
  );
};
