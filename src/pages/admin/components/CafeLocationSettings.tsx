import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ShieldCheck, Save, CheckCircle2, Wifi, Info } from 'lucide-react';
import { api } from '../../../services/api';
import { Cafe } from '../../../types';

interface CafeLocationSettingsProps {
  cafeSlug: string;
}

export const CafeLocationSettings: React.FC<CafeLocationSettingsProps> = ({ cafeSlug }) => {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [radius, setRadius] = useState<number>(120);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchCafe = async () => {
      try {
        const data = await api.getCafeBySlug(cafeSlug);
        if (data) {
          setCafe(data);
          if (data.latitude != null) setLatitude(data.latitude);
          if (data.longitude != null) setLongitude(data.longitude);
          if (data.geofenceRadiusMeters != null) setRadius(data.geofenceRadiusMeters);
        }
      } catch (err) {
        console.error('Erreur chargement café', err);
      }
    };
    fetchCafe();
  }, [cafeSlug]);

  const handleDetectCurrentPosition = () => {
    if (!navigator.geolocation) {
      setErrorMsg("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsDetecting(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        setIsDetecting(false);
      },
      (err) => {
        setIsDetecting(false);
        setErrorMsg("Impossible d'obtenir votre position. Vérifiez les autorisations GPS.");
        console.warn('GPS Error', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = async () => {
    if (latitude === '' || longitude === '' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setErrorMsg("Les coordonnées du café doivent être confirmées avant l'enregistrement.");
      return;
    }
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const updated = await api.updateCafeLocation(cafeSlug, latitude, longitude, radius);
      setCafe(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setErrorMsg("Erreur lors de l'enregistrement des paramètres de sécurité.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-6 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-inner">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Localisation & Sécurité Anti-Fraude</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              Vérification automatique de la présence physique des clients à table
            </p>
          </div>
        </div>

        {/* Live WiFi Status */}
        <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.06] px-3.5 py-2 rounded-2xl">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <div className="text-[11px]">
            <span className="text-gray-400 block font-medium">IP WiFi Apprise</span>
            <span className="font-mono font-bold text-white">
              {cafe?.lastKnownWifiIp || 'En attente de connexion staff...'}
            </span>
          </div>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200/90 leading-relaxed font-medium">
          Les clients connectés au <strong>WiFi du café</strong> sont validés instantanément sans demande GPS. Pour les clients en <strong>4G</strong>, leur position GPS ponctuelle est comparée à ces coordonnées pour certifier qu'ils sont bien sur place.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* GPS Coordinates Card */}
        <div className="bg-black/30 border border-white/[0.06] p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-orange-400" />
              <span>Coordonnées GPS du Café</span>
            </label>
            <button
              type="button"
              onClick={handleDetectCurrentPosition}
              disabled={isDetecting}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Navigation className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Recherche GPS…' : '📍 Détecter ma position actuelle'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-gray-500 font-bold block mb-1">Latitude</span>
              <input
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold block mb-1">Longitude</span>
              <input
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Geofence Radius Slider Card */}
        <div className="bg-black/30 border border-white/[0.06] p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Rayon de Tolérance Géofence
            </label>
            <span className="text-xs font-black text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
              {radius} mètres
            </span>
          </div>

          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            Rayon autour du café dans lequel le client en 4G est considéré comme présent (recommandé : 100 à 150m pour couvrir la terrasse et l'étage).
          </p>

          <input
            type="range"
            min="50"
            max="300"
            step="10"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value, 10))}
            className="w-full accent-orange-500 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-gray-500 font-bold">
            <span>50m (Petit local)</span>
            <span>120m (Standard)</span>
            <span>300m (Grand Lounge & Terrasse)</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/25 p-3.5 rounded-xl text-xs font-bold text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Footer Save Button */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        {saveSuccess ? (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Paramètres de sécurité enregistrés avec succès !</span>
          </div>
        ) : (
          <span className="text-[11px] text-gray-500">Mise à jour en temps réel pour tous les clients</span>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold px-6 py-3 rounded-2xl shadow-xl shadow-orange-500/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Enregistrement…' : 'Enregistrer la position'}</span>
        </button>
      </div>
    </div>
  );
};
