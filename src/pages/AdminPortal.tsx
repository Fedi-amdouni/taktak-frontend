import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShieldCheck, ArrowRight, Lock, MapPin, Sparkles } from 'lucide-react';
import { Cafe } from '../types';
import { api } from '../services/api';

export const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchCafes = async () => {
      try {
        const list = await api.getAllCafes();
        if (list && list.length > 0) {
          setCafes(list);
        } else {
          setCafes([
            { id: '1', name: 'Monastir Lounge', slug: 'monastir-lounge', logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80' },
          ]);
        }
      } catch (err) {
        setCafes([
          { id: '1', name: 'Monastir Lounge', slug: 'monastir-lounge', logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80' },
        ]);
      }
    };
    fetchCafes();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
  };

  return (
    <div className="min-h-screen bg-[#08090e] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg">
            <ShieldCheck className="w-4 h-4" />
            <span>Portail Administration Propriétaires</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">TakTak Admin</h1>
          <p className="text-xs text-gray-400">Gérez vos cafés, produits, serveurs et statistiques d'activité</p>
        </div>

        {!isAuthenticated ? (
          /* Login Form */
          <form onSubmit={handleLogin} className="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-5 shadow-2xl animate-fadeIn">
            <div className="text-center space-y-1">
              <Lock className="w-7 h-7 text-orange-400 mx-auto" />
              <h2 className="text-sm font-bold text-white">Connexion Propriétaire</h2>
              <p className="text-[11px] text-gray-400">Entrez le mot de passe administrateur</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Mot de passe</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.04] text-sm text-white p-3.5 rounded-2xl border border-white/[0.08] focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.98]"
            >
              Se Connecter au Dashboard
            </button>
          </form>
        ) : (
          /* Cafe Selection */
          <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] space-y-4 shadow-2xl animate-fadeIn">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
              <Store className="w-4 h-4 text-orange-400" />
              <span>Sélectionnez votre Café</span>
            </h2>

            <div className="space-y-3">
              {cafes.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/admin/${c.slug}`)}
                  className="p-4 bg-white/[0.03] hover:bg-orange-500/[0.08] border border-white/[0.06] hover:border-orange-500/30 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 group active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-3.5">
                    <img src={c.logoUrl || 'https://via.placeholder.com/50'} alt={c.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-orange-500/40" />
                    <div>
                      <h3 className="text-sm font-extrabold text-white group-hover:text-orange-400 transition-colors">{c.name}</h3>
                      <p className="text-[11px] text-gray-500 flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-1" /> Monastir, Tunisie
                      </p>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] group-hover:bg-orange-500 flex items-center justify-center text-gray-400 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
