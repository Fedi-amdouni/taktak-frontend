import React, { useState, useEffect } from 'react';
import { Users, UserPlus, KeyRound, Clock, MapPin, Edit3, Trash2, ShieldCheck, Sparkles, X, Check } from 'lucide-react';
import { Waiter } from '../../../types';
import { api } from '../../../services/api';

interface WaiterManagerProps {
  cafeSlug: string;
}

export const WaiterManager: React.FC<WaiterManagerProps> = ({ cafeSlug }) => {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [shiftHours, setShiftHours] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const totalTables = 15; // 1 to 15

  const loadWaiters = async () => {
    setLoading(true);
    try {
      const data = await api.getActiveWaiters(cafeSlug);
      setWaiters(data);
    } catch (err) {
      console.error('Erreur chargement serveurs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaiters();
  }, [cafeSlug]);

  const handleOpenAddModal = () => {
    setEditingWaiter(null);
    setName('');
    setPinCode('');
    setShiftHours('08:00 - 16:00 (Matin)');
    setIsActive(true);
    setSelectedTables([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (waiter: Waiter) => {
    setEditingWaiter(waiter);
    setName(waiter.name);
    setPinCode('');
    setShiftHours(waiter.shiftHours || '');
    setIsActive(waiter.isActive);
    setSelectedTables(waiter.assignedTables || []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const toggleTable = (num: number) => {
    setSelectedTables((prev) =>
      prev.includes(num) ? prev.filter((t) => t !== num) : [...prev, num].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Le nom du serveur est obligatoire');
      return;
    }
    if ((!editingWaiter && !pinCode.trim()) || (pinCode.trim() && pinCode.length < 4)) {
      setFormError('Le code PIN doit comporter au moins 4 chiffres');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      let savedWaiter: Waiter;
      if (editingWaiter) {
        savedWaiter = await api.updateWaiter(editingWaiter.id, {
          name,
          ...(pinCode ? { pinCode } : {}),
          shiftHours,
          isActive,
        });
      } else {
        savedWaiter = await api.createWaiter(cafeSlug, {
          name,
          pinCode,
          shiftHours,
        });
      }

      // Assign selected tables to waiter
      if (savedWaiter && savedWaiter.id) {
        await api.assignWaiterTables(savedWaiter.id, selectedTables);
      }

      setIsModalOpen(false);
      loadWaiters();
    } catch (err: any) {
      setFormError('Erreur lors de l’enregistrement. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (waiterId: string, waiterName: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le serveur "${waiterName}" ?`)) {
      try {
        await api.deleteWaiter(waiterId);
        loadWaiters();
      } catch (err) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg shadow-orange-500/25 text-white">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">Gestion de l'Équipe & Serveurs</h2>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Créez les serveurs, définissez leur PIN 4 chiffres, leur shift et attribuez-leur leur zone de tables
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-lg shadow-orange-500/20 flex items-center space-x-2 text-xs font-extrabold transition-all duration-300 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouveau Serveur</span>
        </button>
      </div>

      {/* Waiters Grid */}
      {loading ? (
        <div className="text-center py-16 glass-panel rounded-2xl">
          <Sparkles className="w-10 h-10 text-orange-400 mx-auto animate-pulse mb-2" />
          <p className="text-xs text-gray-400 font-semibold">Chargement des serveurs...</p>
        </div>
      ) : waiters.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl">
          <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-400">Aucun serveur enregistré</h3>
          <p className="text-xs text-gray-600 mt-1">Ajoutez votre premier serveur pour lui attribuer un code PIN et des tables</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {waiters.map((waiter) => (
            <div
              key={waiter.id}
              className="glass-panel p-5 rounded-2xl border border-white/[0.06] shadow-xl flex flex-col justify-between space-y-4 relative group hover:border-orange-500/30 transition-all duration-300"
            >
              {/* Header card */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-base shadow-inner">
                    👤
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{waiter.name}</h3>
                    <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/[0.08] px-2 py-0.5 rounded-full border border-emerald-500/15 mt-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Serveur Actif</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEditModal(waiter)}
                    className="p-2 bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white rounded-xl transition-all"
                    title="Modifier"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(waiter.id, waiter.name)}
                    className="p-2 bg-white/[0.04] hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-xl transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Badges info */}
              <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.04] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                    <KeyRound className="w-3 h-3 text-orange-400" />
                    <span>Code PIN</span>
                  </span>
                  <span className="font-extrabold text-amber-300 font-mono tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                    ••••
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Horaires / Shift</span>
                  </span>
                  <span className="font-semibold text-gray-300 text-[11px]">
                    {waiter.shiftHours || 'Non spécifié'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                  <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>Zone Attribuée</span>
                  </span>
                  <span className="font-bold text-emerald-300 text-[11px]">
                    {waiter.assignedTables && waiter.assignedTables.length > 0
                      ? waiter.assignedTables.map((t) => `T${t < 10 ? `0${t}` : t}`).join(', ')
                      : 'Aucune table attribuée'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Waiter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0d0f18] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-white">
                  {editingWaiter ? 'Modifier le Serveur' : 'Nouveau Serveur'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 bg-white/[0.04] text-gray-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-xs font-bold text-red-400 text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                    Nom du Serveur
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Youssef, Ahmed, Sirine..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.03] text-gray-100 px-4 py-3 rounded-2xl border border-white/[0.06] focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                    Code PIN (4 Chiffres)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder={editingWaiter ? 'Laisser vide pour conserver' : 'Ex: 1234'}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white/[0.03] text-amber-300 font-extrabold tracking-widest px-4 py-3 rounded-2xl border border-white/[0.06] focus:border-orange-500"
                    required={!editingWaiter}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Horaires de Shift / Temps de Travail
                </label>
                <select
                  value={shiftHours}
                  onChange={(e) => setShiftHours(e.target.value)}
                  className="w-full bg-[#131624] text-gray-100 px-4 py-3 rounded-2xl border border-white/[0.06] focus:border-orange-500"
                >
                  <option value="08:00 - 16:00 (Shift Matin)">08:00 - 16:00 (Shift Matin)</option>
                  <option value="16:00 - 00:00 (Shift Soir)">16:00 - 00:00 (Shift Soir)</option>
                  <option value="12:00 - 20:00 (Shift Continu)">12:00 - 20:00 (Shift Continu)</option>
                  <option value="Temps Plein (08:00 - 00:00)">Temps Plein (08:00 - 00:00)</option>
                </select>
              </div>

              {/* Table Zoning Selector */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Tables Attribuées à ce Serveur ({selectedTables.length})
                </label>
                <div className="grid grid-cols-5 gap-2 bg-white/[0.02] p-3 rounded-2xl border border-white/[0.04]">
                  {Array.from({ length: totalTables }, (_, i) => i + 1).map((tableNum) => {
                    const isSelected = selectedTables.includes(tableNum);
                    return (
                      <button
                        type="button"
                        key={tableNum}
                        onClick={() => toggleTable(tableNum)}
                        className={`h-11 rounded-xl font-extrabold text-xs flex flex-col items-center justify-center transition-all duration-200 border ${
                          isSelected
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md border-orange-400/50 scale-[1.03]'
                            : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-white'
                        }`}
                      >
                        <span className="text-[9px] opacity-70">T</span>
                        <span>{tableNum < 10 ? `0${tableNum}` : tableNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-orange-500/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Check className="w-5 h-5" />
                  <span>{submitting ? 'Enregistrement...' : editingWaiter ? 'Mettre à jour le Serveur' : 'Créer & Attribuer Zone'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
