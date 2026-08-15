import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Grid,
  Layout,
  Plus,
  Save,
  Square,
  Trash2,
  UserCheck,
  Edit3,
  MousePointer,
  Maximize2,
  Layers,
  DoorOpen,
  Wine,
  Sparkles,
  Magnet,
  RotateCcw,
  Armchair
} from 'lucide-react';
import { FloorObstacle, FloorPlan, TableEntity, TableShape, Waiter } from '../../../types';
import { api } from '../../../services/api';
import { formatTableCode } from '../../../utils/tableCode';

interface Props { cafeSlug: string }
type Selection = { type: 'table' | 'obstacle'; id: string } | null;
type EditorMode = 'SELECT' | 'DRAW_WALL' | 'DRAW_BAR' | 'DRAW_DOOR';

const WAITER_COLORS = [
  { bg: 'bg-blue-500/25', border: 'border-blue-400', text: 'text-blue-300', dot: '#60a5fa' },
  { bg: 'bg-emerald-500/25', border: 'border-emerald-400', text: 'text-emerald-300', dot: '#34d399' },
  { bg: 'bg-purple-500/25', border: 'border-purple-400', text: 'text-purple-300', dot: '#c084fc' },
  { bg: 'bg-rose-500/25', border: 'border-rose-400', text: 'text-rose-300', dot: '#fb7185' },
  { bg: 'bg-amber-500/25', border: 'border-amber-400', text: 'text-amber-300', dot: '#fbbf24' },
];

export const FloorPlanEditor: React.FC<Props> = ({ cafeSlug }) => {
  const [plans, setPlans] = useState<FloorPlan[]>([]);
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [obstacles, setObstacles] = useState<FloorObstacle[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('SELECT');
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Drawing & Resizing state
  const [drawingBox, setDrawingBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number; type: EditorMode } | null>(null);

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
  const resizeRef = useRef<{ obstacleId: string; handle: 'E' | 'W' | 'N' | 'S'; startX: number; startY: number; initialPosX: number; initialPosY: number; initialW: number; initialH: number } | null>(null);

  const activePlan = plans.find((plan) => plan.id === activePlanId) || null;
  const planTables = activePlan ? tables.filter((table) => table.floorPlanId === activePlan.id) : [];
  const selectedTable = selection?.type === 'table' ? tables.find((table) => table.id === selection.id) : undefined;
  const selectedObstacle = selection?.type === 'obstacle' ? obstacles.find((item) => item.id === selection.id) : undefined;

  const snap = (val: number, step = 2): number => {
    if (!snapToGrid) return Math.max(1, Math.min(99, Math.round(val)));
    return Math.round(Math.max(2, Math.min(98, val)) / step) * step;
  };

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

  const addPresetObstacle = (type: 'WALL_H' | 'WALL_V' | 'BAR' | 'DOOR') => {
    if (!activePlan) return;
    let label = 'Mur';
    let width = 25;
    let height = 3.5;

    if (type === 'WALL_V') {
      width = 3.5;
      height = 25;
    } else if (type === 'BAR') {
      label = 'Comptoir Bar';
      width = 35;
      height = 8;
    } else if (type === 'DOOR') {
      label = 'Entrée';
      width = 12;
      height = 4;
    }

    const item: FloorObstacle = {
      id: `temp_${Date.now()}`,
      floorPlanId: activePlan.id,
      label,
      posX: 50,
      posY: 50,
      width,
      height,
    };
    setObstacles((current) => [...current, item]);
    setSelection({ type: 'obstacle', id: item.id });
  };

  // --- CANVAS POINTER EVENT HANDLERS (Drawing Wall & Moving Elements) ---
  const handleCanvasPointerDown = (event: React.PointerEvent) => {
    if (editorMode !== 'SELECT') {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas || !activePlan) return;
      const rect = canvas.getBoundingClientRect();
      const startX = snap(((event.clientX - rect.left) / rect.width) * 100);
      const startY = snap(((event.clientY - rect.top) / rect.height) * 100);

      setDrawingBox({ startX, startY, currentX: startX, currentY: startY, type: editorMode });

      const handlePointerMove = (e: PointerEvent) => {
        const currentX = snap(((e.clientX - rect.left) / rect.width) * 100);
        const currentY = snap(((e.clientY - rect.top) / rect.height) * 100);
        setDrawingBox((prev) => prev ? { ...prev, currentX, currentY } : null);
      };

      const handlePointerUp = (e: PointerEvent) => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);

        const endX = snap(((e.clientX - rect.left) / rect.width) * 100);
        const endY = snap(((e.clientY - rect.top) / rect.height) * 100);

        const deltaX = Math.abs(endX - startX);
        const deltaY = Math.abs(endY - startY);

        if (deltaX > 2 || deltaY > 2) {
          const width = Math.max(3, deltaX);
          const height = Math.max(3, deltaY);
          const posX = Math.min(startX, endX) + width / 2;
          const posY = Math.min(startY, endY) + height / 2;

          let label = 'Mur';
          if (editorMode === 'DRAW_BAR') label = 'Comptoir Bar';
          if (editorMode === 'DRAW_DOOR') label = 'Entrée';

          const newObstacle: FloorObstacle = {
            id: `temp_${Date.now()}`,
            floorPlanId: activePlan.id,
            label,
            posX,
            posY,
            width,
            height,
          };
          setObstacles((current) => [...current, newObstacle]);
          setSelection({ type: 'obstacle', id: newObstacle.id });
        }
        setDrawingBox(null);
        setEditorMode('SELECT');
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    } else if (event.target === canvasRef.current) {
      setSelection(null);
    }
  };

  // Move Element
  const pointerDown = (selected: NonNullable<Selection>, event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (editorMode !== 'SELECT') return;
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
      offsetX: event.clientX - rect.left - (item.posX / 100) * rect.width,
      offsetY: event.clientY - rect.top - (item.posY / 100) * rect.height,
    };
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
  };

  const pointerMove = (event: PointerEvent) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const posX = snap(((event.clientX - rect.left - drag.offsetX) / rect.width) * 100);
    const posY = snap(((event.clientY - rect.top - drag.offsetY) / rect.height) * 100);
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

  // --- RESIZE HANDLE EVENT HANDLERS ---
  const handleResizePointerDown = (obstacleId: string, handle: 'E' | 'W' | 'N' | 'S', event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const obstacle = obstacles.find((o) => o.id === obstacleId);
    if (!obstacle || !canvasRef.current) return;

    resizeRef.current = {
      obstacleId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      initialPosX: obstacle.posX,
      initialPosY: obstacle.posY,
      initialW: obstacle.width,
      initialH: obstacle.height,
    };

    const handleResizePointerMove = (e: PointerEvent) => {
      const resize = resizeRef.current;
      const canvas = canvasRef.current;
      if (!resize || !canvas) return;
      const rect = canvas.getBoundingClientRect();

      const deltaXPercent = ((e.clientX - resize.startX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - resize.startY) / rect.height) * 100;

      setObstacles((current) =>
        current.map((item) => {
          if (item.id !== resize.obstacleId) return item;

          let newWidth = resize.initialW;
          let newHeight = resize.initialH;
          let newPosX = resize.initialPosX;
          let newPosY = resize.initialPosY;

          if (resize.handle === 'E') {
            newWidth = snap(Math.max(2, Math.min(95, resize.initialW + deltaXPercent)));
            newPosX = resize.initialPosX + (newWidth - resize.initialW) / 2;
          } else if (resize.handle === 'W') {
            newWidth = snap(Math.max(2, Math.min(95, resize.initialW - deltaXPercent)));
            newPosX = resize.initialPosX - (newWidth - resize.initialW) / 2;
          } else if (resize.handle === 'S') {
            newHeight = snap(Math.max(2, Math.min(95, resize.initialH + deltaYPercent)));
            newPosY = resize.initialPosY + (newHeight - resize.initialH) / 2;
          } else if (resize.handle === 'N') {
            newHeight = snap(Math.max(2, Math.min(95, resize.initialH - deltaYPercent)));
            newPosY = resize.initialPosY - (newHeight - resize.initialH) / 2;
          }

          return { ...item, posX: newPosX, posY: newPosY, width: newWidth, height: newHeight };
        })
      );
    };

    const handleResizePointerUp = () => {
      resizeRef.current = null;
      window.removeEventListener('pointermove', handleResizePointerMove);
      window.removeEventListener('pointerup', handleResizePointerUp);
    };

    window.addEventListener('pointermove', handleResizePointerMove);
    window.addEventListener('pointerup', handleResizePointerUp);
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

  const getObstacleMeters = (obstacle: FloorObstacle) => {
    if (!activePlan) return { w: '0', h: '0' };
    const w = ((obstacle.width / 100) * activePlan.width).toFixed(1);
    const h = ((obstacle.height / 100) * activePlan.height).toFixed(1);
    return { w, h };
  };

  const renderObstacleGraphic = (item: FloorObstacle, isSelected: boolean) => {
    const isBar = item.label.toLowerCase().includes('bar') || item.label.toLowerCase().includes('comptoir');
    const isDoor = item.label.toLowerCase().includes('porte') || item.label.toLowerCase().includes('entrée');
    const meters = getObstacleMeters(item);

    if (isBar) {
      return (
        <div
          key={item.id}
          onPointerDown={(e) => pointerDown({ type: 'obstacle', id: item.id }, e)}
          style={{
            left: `${item.posX}%`,
            top: `${item.posY}%`,
            width: `${item.width}%`,
            height: `${item.height}%`,
            transform: 'translate(-50%,-50%)',
          }}
          className={`absolute touch-none cursor-move rounded-xl border-2 shadow-2xl flex items-center justify-between px-2 text-xs font-black transition-all ${
            isSelected
              ? 'bg-gradient-to-r from-amber-700 to-amber-900 border-amber-400 ring-4 ring-amber-500/30 z-30'
              : 'bg-gradient-to-r from-amber-900/90 to-[#3d1e08]/90 border-amber-600/70 hover:border-amber-400'
          } text-amber-200`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Wine className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </div>
          <span className="text-[9px] opacity-75 font-mono ml-1">{meters.w}m</span>
          {isSelected && renderResizeHandles(item.id)}
        </div>
      );
    }

    if (isDoor) {
      return (
        <div
          key={item.id}
          onPointerDown={(e) => pointerDown({ type: 'obstacle', id: item.id }, e)}
          style={{
            left: `${item.posX}%`,
            top: `${item.posY}%`,
            width: `${item.width}%`,
            height: `${item.height}%`,
            transform: 'translate(-50%,-50%)',
          }}
          className={`absolute touch-none cursor-move rounded-lg border-2 border-dashed flex items-center justify-center text-xs font-black transition-all ${
            isSelected
              ? 'bg-emerald-500/30 border-emerald-300 ring-4 ring-emerald-500/30 z-30 text-white'
              : 'bg-emerald-950/60 border-emerald-500/70 hover:border-emerald-300 text-emerald-300'
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5 mr-1" />
          <span>{item.label}</span>
          {isSelected && renderResizeHandles(item.id)}
        </div>
      );
    }

    // Default Wall / Partition
    return (
      <div
        key={item.id}
        onPointerDown={(e) => pointerDown({ type: 'obstacle', id: item.id }, e)}
        style={{
          left: `${item.posX}%`,
          top: `${item.posY}%`,
          width: `${item.width}%`,
          height: `${item.height}%`,
          transform: 'translate(-50%,-50%)',
        }}
        className={`absolute touch-none cursor-move bg-slate-800 border-2 flex items-center justify-center text-[10px] font-black text-slate-200 rounded-lg shadow-xl transition-all ${
          isSelected
            ? 'border-orange-400 ring-4 ring-orange-500/30 z-30 shadow-orange-500/20'
            : 'border-slate-600 hover:border-slate-400'
        }`}
      >
        <Square className="w-3 h-3 mr-1 text-slate-400" />
        <span className="truncate">{item.label}</span>
        <span className="text-[8px] opacity-75 font-mono ml-1">({meters.w}m)</span>
        {isSelected && renderResizeHandles(item.id)}
      </div>
    );
  };

  const renderResizeHandles = (obstacleId: string) => (
    <>
      <div
        onPointerDown={(e) => handleResizePointerDown(obstacleId, 'E', e)}
        className="resize-handle top-1/2 -right-2 -translate-y-1/2 cursor-e-resize"
        title="Largeur Est"
      />
      <div
        onPointerDown={(e) => handleResizePointerDown(obstacleId, 'W', e)}
        className="resize-handle top-1/2 -left-2 -translate-y-1/2 cursor-w-resize"
        title="Largeur Ouest"
      />
      <div
        onPointerDown={(e) => handleResizePointerDown(obstacleId, 'S', e)}
        className="resize-handle -bottom-2 left-1/2 -translate-x-1/2 cursor-s-resize"
        title="Épaisseur Sud"
      />
      <div
        onPointerDown={(e) => handleResizePointerDown(obstacleId, 'N', e)}
        className="resize-handle -top-2 left-1/2 -translate-x-1/2 cursor-n-resize"
        title="Épaisseur Nord"
      />
    </>
  );

  return (
    <div className="space-y-5">
      {/* Header Panel */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl flex flex-wrap items-center justify-between gap-3 border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg shadow-orange-500/20 text-white">
            <Layout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Éditeur de Plan 2D</h2>
              <span className="text-[10px] font-black uppercase bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                Architecte
              </span>
            </div>
            <p className="text-xs text-gray-400">Positionnez vos tables, dessinez les murs et comptoirs en direct.</p>
          </div>
        </div>

        {activePlan && (
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-emerald-400 text-xs font-black flex items-center gap-1 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/25 animate-fadeIn">
                <Check className="w-4 h-4" /> Plan Enregistré !
              </span>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-orange-500/25 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Sauvegarde…' : 'Sauvegarder le Plan'}</span>
            </button>
          </div>
        )}
      </div>

      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-xs font-bold">{error}</div>}

      {/* Plan Selector & New Plan Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setActivePlanId(plan.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black border transition-all ${
              activePlanId === plan.id
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400 text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
                : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            {plan.name} <span className="opacity-75 font-normal">({tables.filter((t) => t.floorPlanId === plan.id).length} tables)</span>
          </button>
        ))}

        <div className="flex flex-wrap gap-2 glass-panel p-1.5 rounded-2xl border border-white/[0.08] items-center">
          <input
            aria-label="Nom du nouvel espace"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            placeholder="Nouvel Espace (ex: Terrasse)"
            className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-orange-400"
          />
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <input
              aria-label="Largeur"
              type="number"
              min="4"
              max="50"
              value={newPlanWidth}
              onChange={(e) => setNewPlanWidth(Number(e.target.value))}
              className="w-12 bg-gray-950 border border-gray-800 rounded-xl px-2 py-1.5 text-xs text-white font-bold text-center"
            />
            <span>×</span>
            <input
              aria-label="Hauteur"
              type="number"
              min="4"
              max="50"
              value={newPlanHeight}
              onChange={(e) => setNewPlanHeight(Number(e.target.value))}
              className="w-12 bg-gray-950 border border-gray-800 rounded-xl px-2 py-1.5 text-xs text-white font-bold text-center"
            />
            <span className="text-gray-500 font-bold mr-1">m</span>
          </div>
          <button
            onClick={createPlan}
            className="bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Créer
          </button>
        </div>
      </div>

      {!activePlan ? (
        <div className="glass-panel rounded-3xl border border-dashed border-white/[0.1] py-24 text-center space-y-3">
          <Layout className="w-14 h-14 mx-auto text-gray-700 mb-2 animate-pulse" />
          <h3 className="font-black text-white text-lg">Aucun plan de salle sélectionné</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Créez votre premier espace ci-dessus pour modéliser votre salle en 2D.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Main Interactive Canvas Area */}
          <div className="lg:col-span-3 glass-panel p-3 sm:p-4 rounded-3xl border border-white/[0.08] space-y-3 overflow-hidden">
            {/* Toolbar Header */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Grid className="w-4 h-4 text-orange-400" />
                <input
                  aria-label="Nom du plan"
                  value={activePlan.name}
                  onChange={(e) => updateActivePlan({ name: e.target.value })}
                  className="bg-transparent font-black text-white text-base border-b border-white/10 focus:border-orange-400 outline-none px-1"
                />
              </div>

              {/* DRAW MODE TOGGLE BAR */}
              <div className="flex items-center gap-1 bg-gray-950/90 p-1 rounded-2xl border border-white/10 flex-wrap">
                <button
                  onClick={() => setEditorMode('SELECT')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    editorMode === 'SELECT'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>Sélectionner</span>
                </button>
                <button
                  onClick={() => setEditorMode('DRAW_WALL')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    editorMode === 'DRAW_WALL'
                      ? 'bg-amber-500 text-white shadow-md animate-pulse'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>✏️ Mur</span>
                </button>
                <button
                  onClick={() => setEditorMode('DRAW_BAR')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    editorMode === 'DRAW_BAR'
                      ? 'bg-amber-700 text-white shadow-md animate-pulse'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Wine className="w-3.5 h-3.5" />
                  <span>🍸 Bar</span>
                </button>
                <button
                  onClick={() => setEditorMode('DRAW_DOOR')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    editorMode === 'DRAW_DOOR'
                      ? 'bg-emerald-600 text-white shadow-md animate-pulse'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>🚪 Porte</span>
                </button>
              </div>

              {/* Snap & Metric Scale Controls */}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all ${
                    snapToGrid
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                      : 'bg-white/[0.04] text-gray-500 border-white/[0.06]'
                  }`}
                  title="Alignement automatique sur la grille"
                >
                  <Magnet className="w-3.5 h-3.5" />
                  <span>Grille {snapToGrid ? 'ON' : 'OFF'}</span>
                </button>

                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-white font-bold">{activePlan.width}m</span>
                  <span className="text-gray-600">×</span>
                  <span className="text-white font-bold">{activePlan.height}m</span>
                </div>
              </div>
            </div>

            {/* Instruction Tip */}
            {editorMode !== 'SELECT' && (
              <div className="bg-amber-500/15 border border-amber-500/30 text-amber-200 px-4 py-2 rounded-2xl text-xs font-bold flex items-center justify-between animate-fadeIn">
                <span className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>Cliquez et glissez sur le plan pour tracer un(e) {editorMode === 'DRAW_WALL' ? 'Mur' : editorMode === 'DRAW_BAR' ? 'Comptoir Bar' : 'Porte / Entrée'} !</span>
                </span>
                <button
                  onClick={() => setEditorMode('SELECT')}
                  className="text-[10px] underline hover:text-white font-black"
                >
                  Annuler
                </button>
              </div>
            )}

            {/* 2D CANVAS CONTAINER */}
            <div
              ref={canvasRef}
              onPointerDown={handleCanvasPointerDown}
              className={`relative w-full min-h-[420px] sm:min-h-[500px] bg-[#070a12] rounded-3xl border-2 border-white/10 overflow-hidden select-none touch-none shadow-2xl ${
                editorMode !== 'SELECT' ? 'canvas-crosshair border-amber-400/50' : ''
              }`}
              style={{
                aspectRatio: `${activePlan.width}/${activePlan.height}`,
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px',
              }}
            >
              {/* Metric Scale Guide Ticks at Top */}
              <div className="absolute top-0 left-0 right-0 h-4 border-b border-white/[0.08] flex justify-between px-2 text-[8px] font-mono text-gray-600 pointer-events-none">
                <span>0m</span>
                <span>{(activePlan.width / 4).toFixed(0)}m</span>
                <span>{(activePlan.width / 2).toFixed(0)}m</span>
                <span>{((activePlan.width * 3) / 4).toFixed(0)}m</span>
                <span>{activePlan.width}m</span>
              </div>

              {/* Drawing Preview Line */}
              {drawingBox && (
                <div
                  style={{
                    left: `${Math.min(drawingBox.startX, drawingBox.currentX)}%`,
                    top: `${Math.min(drawingBox.startY, drawingBox.currentY)}%`,
                    width: `${Math.max(2, Math.abs(drawingBox.currentX - drawingBox.startX))}%`,
                    height: `${Math.max(2, Math.abs(drawingBox.currentY - drawingBox.startY))}%`,
                  }}
                  className="absolute bg-amber-500/30 border-2 border-dashed border-amber-400 rounded-lg pointer-events-none z-30 flex items-center justify-center text-[10px] font-black text-amber-300"
                >
                  {drawingBox.type === 'DRAW_BAR' ? '🍸 Bar…' : drawingBox.type === 'DRAW_DOOR' ? '🚪 Porte…' : '🧱 Mur…'}
                </div>
              )}

              {/* OBSTACLES & WALLS */}
              {obstacles.map((item) => {
                const isSelected = selection?.type === 'obstacle' && selection.id === item.id;
                return renderObstacleGraphic(item, isSelected);
              })}

              {/* TABLES */}
              {planTables.map((table) => {
                const waiter = waiterFor(table.tableNumber);
                const color = waiter ? WAITER_COLORS[Math.max(0, waiters.findIndex((w) => w.id === waiter.id)) % WAITER_COLORS.length] : null;
                const isSelected = selection?.type === 'table' && selection.id === table.id;
                const seats = table.seatsCount || 4;

                return (
                  <div
                    key={table.id}
                    onPointerDown={(e) => pointerDown({ type: 'table', id: table.id }, e)}
                    style={{
                      left: `${table.posX}%`,
                      top: `${table.posY}%`,
                      transform: 'translate(-50%,-50%)',
                    }}
                    className={`absolute touch-none cursor-move flex flex-col items-center justify-center border-2 shadow-2xl transition-all ${
                      table.shape === 'ROUND'
                        ? 'w-18 h-18 rounded-full'
                        : table.shape === 'SOFA'
                        ? 'w-24 h-15 rounded-2xl'
                        : table.shape === 'RECTANGLE'
                        ? 'w-22 h-16 rounded-2xl'
                        : 'w-18 h-18 rounded-2xl'
                    } ${
                      isSelected
                        ? 'bg-orange-500/40 border-orange-400 ring-4 ring-orange-500/40 z-30 scale-105 shadow-orange-500/30'
                        : color
                        ? `${color.bg} ${color.border}`
                        : 'bg-[#151a28] border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {/* Seats Count Miniature Dots */}
                    <div className="absolute -top-1.5 flex gap-0.5">
                      {Array.from({ length: Math.min(seats, 6) }).map((_, si) => (
                        <span key={si} className="w-1.5 h-1.5 rounded-full bg-white/40 border border-black/40" />
                      ))}
                    </div>

                    <span className="text-xs font-black text-white tracking-tight">
                      {formatTableCode(table.tableCode, table.tableNumber)}
                    </span>
                    <span className="text-[9px] font-bold text-gray-300 truncate max-w-[54px] flex items-center gap-0.5">
                      {color && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.dot }} />}
                      {waiter?.name || 'Libre'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Control Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions Panel: Add Table */}
            <div className="glass-panel p-4 rounded-3xl border border-white/[0.08] space-y-3">
              <h3 className="font-black text-xs uppercase text-gray-300 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-orange-400" />
                <span>Ajouter une Table</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">N° Table</label>
                  <input
                    aria-label="Numéro de table"
                    type="number"
                    value={newTableNumber}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setNewTableNumber(value);
                      setNewTableCode(formatTableCode(undefined, value));
                    }}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Code</label>
                  <input
                    aria-label="Code de table"
                    value={newTableCode}
                    onChange={(e) => setNewTableCode(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs uppercase text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Forme</label>
                <select
                  aria-label="Forme de table"
                  value={newShape}
                  onChange={(e) => setNewShape(e.target.value as TableShape)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  <option value="SQUARE">Carrée ⬛</option>
                  <option value="ROUND">Ronde 🔴</option>
                  <option value="RECTANGLE">Rectangle 🟩</option>
                  <option value="SOFA">Banquette Lounge 🛋️</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Nombre de Places</label>
                <input
                  aria-label="Nombre de places"
                  type="number"
                  min="1"
                  max="30"
                  value={newSeats}
                  onChange={(e) => setNewSeats(Number(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <button
                onClick={addTable}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-2xl py-3 text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Poser la Table sur le Plan
              </button>
            </div>

            {/* Quick Obstacle Presets */}
            <div className="glass-panel p-4 rounded-3xl border border-white/[0.08] space-y-2.5">
              <h3 className="font-black text-xs uppercase text-gray-300 flex items-center gap-1.5">
                <Square className="w-4 h-4 text-slate-400" />
                <span>Objets d&apos;Aménagement</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => addPresetObstacle('WALL_H')}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600/80 rounded-xl py-2 px-2 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <Square className="w-3.5 h-3.5" /> Mur H
                </button>
                <button
                  onClick={() => addPresetObstacle('WALL_V')}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600/80 rounded-xl py-2 px-2 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <Square className="w-3.5 h-3.5 rotate-90" /> Mur V
                </button>
                <button
                  onClick={() => addPresetObstacle('BAR')}
                  className="bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 border border-amber-600/60 rounded-xl py-2 px-2 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <Wine className="w-3.5 h-3.5 text-amber-400" /> Bar / Comptoir
                </button>
                <button
                  onClick={() => addPresetObstacle('DOOR')}
                  className="bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300 border border-emerald-500/60 rounded-xl py-2 px-2 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-400" /> Porte Entrée
                </button>
              </div>
            </div>

            {/* Selected Obstacle Inspector */}
            {selectedObstacle && (
              <div className="glass-panel p-4 rounded-3xl border border-orange-500/40 space-y-3 animate-scaleUp">
                <div className="flex items-center justify-between border-b border-orange-500/20 pb-2">
                  <h3 className="text-xs font-black text-orange-400 flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5" /> {selectedObstacle.label}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono font-bold">
                    {getObstacleMeters(selectedObstacle).w}m × {getObstacleMeters(selectedObstacle).h}m
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Nom / Libellé</label>
                  <input
                    value={selectedObstacle.label}
                    onChange={(e) =>
                      setObstacles((current) =>
                        current.map((item) => (item.id === selectedObstacle.id ? { ...item, label: e.target.value } : item))
                      )
                    }
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] text-gray-400">
                    Largeur (%)
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={selectedObstacle.width}
                      onChange={(e) =>
                        setObstacles((current) =>
                          current.map((item) => (item.id === selectedObstacle.id ? { ...item, width: Number(e.target.value) } : item))
                        )
                      }
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2 py-1.5 text-xs text-white"
                    />
                  </label>
                  <label className="text-[10px] text-gray-400">
                    Hauteur (%)
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={selectedObstacle.height}
                      onChange={(e) =>
                        setObstacles((current) =>
                          current.map((item) => (item.id === selectedObstacle.id ? { ...item, height: Number(e.target.value) } : item))
                        )
                      }
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2 py-1.5 text-xs text-white"
                    />
                  </label>
                </div>

                <button
                  onClick={() => {
                    setObstacles((current) => current.filter((item) => item.id !== selectedObstacle.id));
                    setSelection(null);
                  }}
                  className="w-full text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer cet Objet
                </button>
              </div>
            )}

            {/* Selected Table Inspector */}
            {selectedTable && (
              <div className="glass-panel p-4 rounded-3xl border border-orange-500/40 space-y-3 animate-scaleUp">
                <div className="flex items-center justify-between border-b border-orange-500/20 pb-2">
                  <h3 className="text-xs font-black text-orange-400">
                    Table {formatTableCode(selectedTable.tableCode, selectedTable.tableNumber)}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono font-bold">
                    Position {selectedTable.posX}% / {selectedTable.posY}%
                  </span>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-purple-400" /> Assignation Serveur
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {waiters.map((waiter) => {
                      const isAssigned = waiter.assignedTables?.includes(selectedTable.tableNumber);
                      return (
                        <button
                          key={waiter.id}
                          onClick={() => void assignWaiter(selectedTable.tableNumber, waiter.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                            isAssigned
                              ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40'
                              : 'bg-white/[0.02] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200'
                          }`}
                        >
                          <span>{waiter.name}</span>
                          {isAssigned && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTables((current) => current.filter((t) => t.id !== selectedTable.id));
                    setSelection(null);
                  }}
                  className="w-full text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Retirer cette Table
                </button>
              </div>
            )}

            {/* Plan Delete Option */}
            <div className="pt-2">
              <button
                onClick={deletePlan}
                className="w-full text-red-400/80 hover:text-red-300 text-[11px] font-bold py-2 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Supprimer ce plan de salle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
