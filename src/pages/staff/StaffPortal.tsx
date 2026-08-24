import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Store, KeyRound, ArrowRight, ShieldCheck, ChefHat, Tablet } from 'lucide-react';
import { Cafe } from '../../types';
import { api } from '../../services/api';

export const StaffPortal: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect');
  const [portalMode, setPortalMode] = useState<'STAFF' | 'KITCHEN'>(
    redirectTarget?.includes('kitchen') ? 'KITCHEN' : 'STAFF'
  );

  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchCafes = async () => {
      try {
        const list = await api.getAllCafes();
        setCafes(list || []);
      } catch {
        setCafes([]);
      }
    };
    fetchCafes();
  }, []);

  const handleSelectCafe = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setPinCode('');
    setErrorMsg('');
  };

  const submitPin = async (candidate: string) => {
    if (!selectedCafe) return;
    try {
      const waiter = await api.loginWaiter(selectedCafe.slug, candidate);
      localStorage.setItem(`activeWaiter_${selectedCafe.slug}`, JSON.stringify(waiter));
      if (portalMode === 'KITCHEN' || (redirectTarget && redirectTarget.includes('kitchen'))) {
        navigate(`/kitchen/${selectedCafe.slug}`);
      } else {
        navigate(`/staff/${selectedCafe.slug}`);
      }
    } catch {
      setErrorMsg('Code PIN incorrect.');
      setPinCode('');
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pinCode.length < 4) {
      const nextPin = pinCode + digit;
      setPinCode(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4 && selectedCafe) {
        void submitPin(nextPin);
      }
    }
  };

  const handleClearPin = () => {
    setPinCode('');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#08090e] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3.5 py-1.5 rounded-full text-xs font-black shadow-lg">
            <ShieldCheck className="w-4 h-4" />
            <span>Portail Équipe & KDS</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">TakTak Pro</h1>
          <p className="text-xs text-gray-400">Accès sécurisé pour le service en salle et la cuisine</p>
        </div>

        {/* Portal Destination Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.08]">
          <button
            onClick={() => setPortalMode('STAFF')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
              portalMode === 'STAFF'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tablet className="w-4 h-4" />
            <span>Tablette Serveur</span>
          </button>
          <button
            onClick={() => setPortalMode('KITCHEN')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
              portalMode === 'KITCHEN'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Écran Cuisine (KDS)</span>
          </button>
        </div>

        {/* Cafe Selection List */}
        {!selectedCafe ? (
          <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] space-y-4 shadow-2xl animate-fadeIn">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
              <Store className="w-4 h-4 text-orange-400" />
              <span>Sélectionnez l&apos;Établissement</span>
            </h2>

            <div className="space-y-3">
              {cafes.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCafe(c)}
                  className="p-4 bg-white/[0.03] hover:bg-orange-500/[0.08] border border-white/[0.06] hover:border-orange-500/30 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 group active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-3.5">
                    <img src={c.logoUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80'} alt={c.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-orange-500/40" />
                    <div>
                      <h3 className="text-sm font-extrabold text-white group-hover:text-orange-400 transition-colors">{c.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">{c.slug}</p>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] group-hover:bg-orange-500 flex items-center justify-center text-gray-400 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* PIN Entry Modal */
          <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center space-x-3">
                <img src={selectedCafe.logoUrl} alt={selectedCafe.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20" />
                <div>
                  <h2 className="text-sm font-black text-white">{selectedCafe.name}</h2>
                  <p className="text-[10px] text-orange-400 font-bold">
                    {portalMode === 'KITCHEN' ? '👨‍🍳 Écran Cuisinier' : '🧑‍💼 Service en Salle'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCafe(null)}
                className="text-[11px] font-bold text-gray-400 hover:text-white bg-white/[0.06] px-3 py-1.5 rounded-xl transition-all"
              >
                Changer
              </button>
            </div>

            <div className="text-center space-y-1">
              <KeyRound className="w-8 h-8 text-orange-400 mx-auto animate-bounce" />
              <h3 className="text-sm font-extrabold text-white">Entrez votre Code PIN</h3>
              <p className="text-[11px] text-gray-400">PIN Démo : <strong>1234</strong> (Youssef), <strong>5678</strong> (Ahmed), <strong>9999</strong> (Sirine)</p>
            </div>

            {/* PIN Dots Display */}
            <div className="flex justify-center space-x-4">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center border text-lg font-bold transition-all duration-200 ${
                    pinCode.length > idx
                      ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/30 scale-105'
                      : 'bg-white/[0.04] border-white/[0.1] text-gray-600'
                  }`}
                >
                  {pinCode.length > idx ? '•' : ''}
                </div>
              ))}
            </div>

            {errorMsg && <p className="text-xs text-red-400 text-center font-bold">{errorMsg}</p>}

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinDigit(digit)}
                  className="w-16 h-16 rounded-2xl bg-white/[0.05] hover:bg-orange-500/20 active:bg-orange-500 text-white text-xl font-bold border border-white/[0.08] hover:border-orange-500/40 transition-all flex items-center justify-center mx-auto shadow-md"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClearPin}
                className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center mx-auto"
              >
                C
              </button>
              <button
                onClick={() => handlePinDigit('0')}
                className="w-16 h-16 rounded-2xl bg-white/[0.05] hover:bg-orange-500/20 active:bg-orange-500 text-white text-xl font-bold border border-white/[0.08] hover:border-orange-500/40 transition-all flex items-center justify-center mx-auto shadow-md"
              >
                0
              </button>
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
