import React, { useEffect, useRef, useState } from 'react';
import { Check, Grid, Layout, Move, Plus, Save, Square, Trash2, User, UserCheck } from 'lucide-react';
import { FloorObstacle, FloorPlan, TableEntity, TableShape, Waiter } from '../../types';
import { api } from '../../services/api';
import { formatTableCode } from '../../utils/tableCode';

interface Props { cafeSlug: string }
type Selection = { type: 'table' | 'obstacle'; id: string } | null;

const WAITER_COLORS = [
  { bg: 'bg-blue-500/25', border: 'border-blue-400', text: 'text-blue-300' },
  { bg: 'bg-emerald-500/25', border: 'border-emerald-400', text: 'text-emerald-300' },
  { bg: 'bg-purple-500/25', border: 'border-purple-400', text: 'text-purple-300' },
  { bg: 'bg-rose-500/25', border: 'border-rose-400', text: 'text-rose-300' },
];

export const FloorPlanEditor: React.FC<Props> = ({ cafeSlug }) => {
  const [plans, setPlans] = useState<FloorPlan[]>([]);
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [obstacles, setObstacles] = useState<FloorObstacle[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanWidth, setNewPlanWidth] = useState(12);
  const [newPlanHeight, setNewPlanHeight] = useState(8);
  const [newTableNumber, setNewTableNumber] = useState(1);
  const [newTableCode, setNewTableCode] = useState('T01');
  const [newShape, setNewShape] = useState<TableShape>('SQUARE');
  const [newSeats, setNewSeats] = useState(4);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ selection: NonNullable<Selection>; offsetX: number; offsetY: number } | null>(null);

  const activePlan = plans.find((plan) => plan.id === activePlanId) || null;
  const planTables = activePlan ? tables.filter((table) => table.floorPlanId === activePlan.id) : [];
  const selectedTable = selection?.type === 'table' ? tables.find((table) => table.id === selection.id) : undefined;
  const selectedObstacle = selection?.type === 'obstacle' ? obstacles.find((item) => item.id === selection.id) : undefined;

  const loadBase = async () => {
    try {
      setError('');
      const [loadedPlans, loadedTables, loadedWaiters] = await Promise.all([
        api.getFloorPlans(cafeSlug), api.getTablesByCafe(cafeSlug), api.getActiveWaiters(cafeSlug),
      ]);
      setPlans(loadedPlans);
      setTables(loadedTables);
      setWaiters(loadedWaiters);
      setActivePlanId((current) => current && loadedPlans.some((p) => p.id === current) ? current : loadedPlans[0]?.id || null);
      const maxNumber = loadedTables.reduce((max, table) => Math.max(max, table.tableNumber), 0);
      setNewTableNumber(maxNumber + 1);
      setNewTableCode(formatTableCode(undefined, maxNumber + 1));
    } catch {
      setError('Impossible de charger les plans de salle.');
    }
  };

  useEffect(() => { void loadBase(); }, [cafeSlug]);
  useEffect(() => {
    if (!activePlanId) { setObstacles([]); return; }
    api.getFloorObstacles(activePlanId).then(setObstacles).catch(() => setError('Impossible de charger les obstacles.'));
    setSelection(null);
  }, [activePlanId]);

  const createPlan = async () => {
    if (!newPlanName.trim()) { setError('Donnez un nom au plan.'); return; }
    try {
      const created = await api.createFloorPlan(cafeSlug, { name: newPlanName.trim(), width: newPlanWidth, height: newPlanHeight });
      setPlans((current) => [...current, created]);
      setActivePlanId(created.id);
      setNewPlanName('');
      setError('');
    } catch { setError('La création du plan a échoué.'); }
  };

  const updateActivePlan = (patch: Partial<FloorPlan>) => {
    if (!activePlan) return;
    setPlans((current) => current.map((plan) => plan.id === activePlan.id ? { ...plan, ...patch } : plan));
  };

  const addTable = () => {
    if (!activePlan) return;
    if (tables.some((table) => table.tableNumber === newTableNumber)) {
      setError(`Le numéro de table ${newTableNumber} existe déjà.`); return;
    }
    const table: TableEntity = {
      id: `temp_${Date.now()}`, cafeId: activePlan.cafeId, floorPlanId: activePlan.id,
      zoneName: activePlan.name, tableNumber: newTableNumber,
      tableCode: formatTableCode(newTableCode, newTableNumber), posX: 50, posY: 50,
      shape: newShape, seatsCount: newSeats,
    };
    setTables((current) => [...current, table]);
    setSelection({ type: 'table', id: table.id });
    const next = newTableNumber + 1;
    setNewTableNumber(next); setNewTableCode(formatTableCode(undefined, next)); setError('');
  };

  const addWall = (orientation: 'HORIZONTAL' | 'VERTICAL') => {
    if (!activePlan) return;
    const item: FloorObstacle = {
      id: `temp_${Date.now()}`, floorPlanId: activePlan.id, label: 'Mur',
      posX: 50, posY: 50,
      width: orientation === 'HORIZONTAL' ? 30 : 3,
      height: orientation === 'HORIZONTAL' ? 3 : 30,
    };
    setObstacles((current) => [...current, item]);
    setSelection({ type: 'obstacle', id: item.id });
  };

  const pointerDown = (selected: NonNullable<Selection>, event: React.PointerEvent) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const item = selected.type === 'table'
      ? tables.find((table) => table.id === selected.id)
      : obstacles.find((obstacle) => obstacle.id === selected.id);
    if (!item) return;
    setSelection(selected);
    dragRef.current = {
      selection: selected,
      offsetX: event.clientX - rect.left - item.posX / 100 * rect.width,
      offsetY: event.clientY - rect.top - item.posY / 100 * rect.height,
    };
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
  };

  const pointerMove = (event: PointerEvent) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const posX = Math.round(Math.max(2, Math.min(98, ((event.clientX - rect.left - drag.offsetX) / rect.width) * 100)) / 2) * 2;
    const posY = Math.round(Math.max(2, Math.min(98, ((event.clientY - rect.top - drag.offsetY) / rect.height) * 100)) / 2) * 2;
    if (drag.selection.type === 'table') {
      setTables((current) => current.map((table) => table.id === drag.selection.id ? { ...table, posX, posY } : table));
    } else {
      setObstacles((current) => current.map((item) => item.id === drag.selection.id ? { ...item, posX, posY } : item));
    }
  };

  const pointerUp = () => {
    dragRef.current = null;
    window.removeEventListener('pointermove', pointerMove);
    window.removeEventListener('pointerup', pointerUp);
  };

  const save = async () => {
    if (!activePlan) return;
    try {
      setSaving(true); setError('');
      const plan = await api.updateFloorPlan(activePlan);
      const [savedTables, savedObstacles] = await Promise.all([
        api.saveFloorPlanTables(plan.id, planTables.map((table) => ({ ...table, zoneName: plan.name }))),
        api.saveFloorObstacles(plan.id, obstacles),
      ]);
      setPlans((current) => current.map((item) => item.id === plan.id ? plan : item));
      setTables((current) => [...current.filter((table) => table.floorPlanId !== plan.id), ...savedTables]);
      setObstacles(savedObstacles); setSelection(null); setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch { setError('La sauvegarde du plan a échoué. Réessayez.'); }
    finally { setSaving(false); }
  };

  const deletePlan = async () => {
    if (!activePlan || !window.confirm(`Supprimer le plan « ${activePlan.name} » et ses tables ?`)) return;
    try { await api.deleteFloorPlan(activePlan.id); await loadBase(); }
    catch { setError('Impossible de supprimer ce plan.'); }
  };

  const waiterFor = (tableNumber: number) => waiters.find((waiter) => waiter.assignedTables?.includes(tableNumber));
  const assignWaiter = async (tableNumber: number, waiterId: string | null) => {
    for (const waiter of waiters) {
      if (waiter.assignedTables?.includes(tableNumber)) {
        await api.assignWaiterTables(waiter.id, waiter.assignedTables.filter((number) => number !== tableNumber));
      }
    }
    const waiter = waiters.find((item) => item.id === waiterId);
    if (waiter) await api.assignWaiterTables(waiter.id, [...(waiter.assignedTables || []), tableNumber]);
    setWaiters(await api.getActiveWaiters(cafeSlug));
  };

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
        <div className="flex items-center gap-3"><div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl"><Layout className="w-6 h-6" /></div><div><h2 className="text-lg font-black">Plans de salle</h2><p className="text-xs text-gray-400">Créez vos espaces, posez les obstacles puis les tables.</p></div></div>
        {activePlan && <div className="flex gap-2">{saved && <span className="text-emerald-400 text-xs flex items-center gap-1"><Check className="w-4 h-4" /> Enregistré</span>}<button onClick={save} disabled={saving} className="bg-orange-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Sauvegarde…' : 'Sauvegarder'}</button></div>}
      </div>

      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-xs font-bold">{error}</div>}

      <div className="flex flex-wrap gap-2 items-center">
        {plans.map((plan) => <button key={plan.id} onClick={() => setActivePlanId(plan.id)} className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${activePlanId === plan.id ? 'bg-orange-500 border-orange-400 text-white' : 'bg-white/[0.03] border-white/[0.08] text-gray-400'}`}>{plan.name} <span className="opacity-60">{tables.filter((t) => t.floorPlanId === plan.id).length} tables</span></button>)}
        <div className="flex flex-wrap gap-2 glass-panel p-2 rounded-2xl border border-white/[0.08]">
          <input aria-label="Nom du nouveau plan" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="Nom : Terrasse, Lounge…" className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs" />
          <input aria-label="Largeur du nouveau plan" type="number" min="4" max="50" value={newPlanWidth} onChange={(e) => setNewPlanWidth(Number(e.target.value))} className="w-20 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs" />
          <span className="self-center text-gray-600">×</span>
          <input aria-label="Hauteur du nouveau plan" type="number" min="4" max="50" value={newPlanHeight} onChange={(e) => setNewPlanHeight(Number(e.target.value))} className="w-20 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs" />
          <button onClick={createPlan} className="bg-white/[0.06] text-orange-400 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Ajouter un plan</button>
        </div>
      </div>

      {!activePlan ? (
        <div className="glass-panel rounded-3xl border border-dashed border-white/[0.1] py-20 text-center"><Layout className="w-12 h-12 mx-auto text-gray-700 mb-3" /><h3 className="font-black text-white">Aucun plan de salle</h3><p className="text-sm text-gray-500 mt-1">Nommez votre premier espace et choisissez ses dimensions.</p></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          <div className="xl:col-span-3 glass-panel p-4 rounded-3xl border border-white/[0.08] overflow-auto">
            <div className="flex flex-wrap justify-between gap-3 mb-3"><div className="flex items-center gap-2"><Grid className="w-4 h-4 text-orange-400" /><input aria-label="Nom du plan" value={activePlan.name} onChange={(e) => updateActivePlan({ name: e.target.value })} className="bg-transparent font-black text-white border-b border-white/10" /></div><div className="flex items-center gap-2 text-xs"><label>Largeur <input type="number" min="4" max="50" value={activePlan.width} onChange={(e) => updateActivePlan({ width: Number(e.target.value) })} className="w-16 ml-1 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1" /></label><span>×</span><label>Hauteur <input type="number" min="4" max="50" value={activePlan.height} onChange={(e) => updateActivePlan({ height: Number(e.target.value) })} className="w-16 ml-1 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1" /></label><span className="text-gray-500">m</span></div></div>
            <div ref={canvasRef} className="relative w-full min-h-[420px] bg-gray-950/90 rounded-2xl border-2 border-white/10 overflow-hidden select-none" style={{ aspectRatio: `${activePlan.width}/${activePlan.height}`, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              {obstacles.map((item) => <div key={item.id} onPointerDown={(e) => pointerDown({ type: 'obstacle', id: item.id }, e)} style={{ left: `${item.posX}%`, top: `${item.posY}%`, width: `${item.width}%`, height: `${item.height}%`, transform: 'translate(-50%,-50%)' }} className={`absolute touch-none cursor-move bg-slate-700/70 border-2 border-dashed flex items-center justify-center text-[10px] font-bold text-slate-300 rounded-lg ${selection?.id === item.id ? 'border-orange-400 ring-2 ring-orange-500/20' : 'border-slate-500'}`}><Square className="w-3 h-3 mr-1" />{item.label}</div>)}
              {planTables.map((table) => { const waiter = waiterFor(table.tableNumber); const color = waiter ? WAITER_COLORS[Math.max(0, waiters.findIndex((w) => w.id === waiter.id)) % WAITER_COLORS.length] : null; return <div key={table.id} onPointerDown={(e) => pointerDown({ type: 'table', id: table.id }, e)} style={{ left: `${table.posX}%`, top: `${table.posY}%`, transform: 'translate(-50%,-50%)' }} className={`absolute w-16 h-16 touch-none cursor-move flex flex-col items-center justify-center border shadow-xl ${table.shape === 'ROUND' ? 'rounded-full' : table.shape === 'SOFA' ? 'w-24 h-14 rounded-2xl' : 'rounded-2xl'} ${selection?.id === table.id ? 'bg-orange-500/30 border-orange-400 ring-4 ring-orange-500/20' : color ? `${color.bg} ${color.border}` : 'bg-gray-800 border-gray-600'}`}><span className="text-xs font-black">{formatTableCode(table.tableCode, table.tableNumber)}</span><span className="text-[8px] text-gray-400">{waiter?.name || 'Non assignée'}</span></div>; })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel p-4 rounded-3xl border border-white/[0.08] space-y-3"><h3 className="font-black text-xs uppercase">Ajouter une table</h3><input aria-label="Numéro de table" type="number" value={newTableNumber} onChange={(e) => { const value = Number(e.target.value); setNewTableNumber(value); setNewTableCode(formatTableCode(undefined, value)); }} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs" /><input aria-label="Code de table" value={newTableCode} onChange={(e) => setNewTableCode(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs uppercase" /><select aria-label="Forme de table" value={newShape} onChange={(e) => setNewShape(e.target.value as TableShape)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs"><option value="SQUARE">Carrée</option><option value="ROUND">Ronde</option><option value="RECTANGLE">Rectangle</option><option value="SOFA">Banquette</option></select><input aria-label="Nombre de places" type="number" min="1" max="30" value={newSeats} onChange={(e) => setNewSeats(Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs" /><button onClick={addTable} className="w-full bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1"><Plus className="w-4 h-4" /> Poser la table</button></div>
            <div className="glass-panel p-4 rounded-3xl border border-white/[0.08] space-y-2"><h3 className="font-black text-xs uppercase">Murs intérieurs</h3><p className="text-[10px] text-gray-600">Ajoutez uniquement les séparations à l'intérieur de la salle.</p><button onClick={() => addWall('HORIZONTAL')} className="w-full bg-slate-700/40 text-slate-300 border border-slate-600 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1"><Square className="w-4 h-4" /> Mur horizontal</button><button onClick={() => addWall('VERTICAL')} className="w-full bg-slate-700/40 text-slate-300 border border-slate-600 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1"><Square className="w-4 h-4 rotate-90" /> Mur vertical</button></div>

            {selectedObstacle && <div className="glass-panel p-4 rounded-3xl border border-orange-500/30 space-y-2"><h3 className="text-xs font-black text-orange-400">Mur sélectionné</h3><div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-gray-500">Longueur / largeur %<input type="number" min="2" max="100" value={selectedObstacle.width} onChange={(e) => setObstacles((current) => current.map((item) => item.id === selectedObstacle.id ? { ...item, width: Number(e.target.value) } : item))} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5" /></label><label className="text-[10px] text-gray-500">Hauteur / épaisseur %<input type="number" min="2" max="100" value={selectedObstacle.height} onChange={(e) => setObstacles((current) => current.map((item) => item.id === selectedObstacle.id ? { ...item, height: Number(e.target.value) } : item))} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5" /></label></div><button onClick={() => { setObstacles((current) => current.filter((item) => item.id !== selectedObstacle.id)); setSelection(null); }} className="text-red-400 text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" /> Supprimer le mur</button></div>}

            {selectedTable && <div className="glass-panel p-4 rounded-3xl border border-orange-500/30 space-y-2"><h3 className="text-xs font-black text-orange-400">{formatTableCode(selectedTable.tableCode, selectedTable.tableNumber)}</h3><div className="text-[10px] text-gray-500 flex items-center gap-1"><Move className="w-3 h-3" /> Position {selectedTable.posX}% / {selectedTable.posY}%</div><h4 className="text-[10px] uppercase text-gray-500 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Serveur</h4>{waiters.map((waiter) => <button key={waiter.id} onClick={() => void assignWaiter(selectedTable.tableNumber, waiter.id)} className={`w-full text-left px-3 py-2 rounded-xl text-xs ${waiter.assignedTables?.includes(selectedTable.tableNumber) ? 'bg-purple-500/20 text-purple-300' : 'bg-white/[0.03] text-gray-400'}`}>{waiter.name}</button>)}<button onClick={() => { setTables((current) => current.filter((table) => table.id !== selectedTable.id)); setSelection(null); }} className="text-red-400 text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" /> Supprimer la table</button></div>}
            <button onClick={deletePlan} className="w-full text-red-400 border border-red-500/20 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1"><Trash2 className="w-4 h-4" /> Supprimer ce plan</button>
            <div className="text-[10px] text-gray-600 flex items-center gap-1"><User className="w-3 h-3" /> Les codes sont normalisés automatiquement : T5 devient T05.</div>
          </div>
        </div>
      )}
    </div>
  );
};
