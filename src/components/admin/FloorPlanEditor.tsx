import React, { useEffect, useRef, useState } from 'react';
import { Check, Grid, Layout, Plus, Save, Square, Trash2, UserCheck, Edit3, MousePointer, Maximize2 } from 'lucide-react';
import { FloorObstacle, FloorPlan, TableEntity, TableShape, Waiter } from '../../types';
import { api } from '../../services/api';
import { formatTableCode } from '../../utils/tableCode';

interface Props { cafeSlug: string }
type Selection = { type: 'table' | 'obstacle'; id: string } | null;
type EditorMode = 'SELECT' | 'DRAW_WALL';

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
  const [editorMode, setEditorMode] = useState<EditorMode>('SELECT');

  // Drawing & Resizing state
  const [drawingWall, setDrawingWall] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

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
      width: orientation === 'HORIZONTAL' ? 30 : 4,
      height: orientation === 'HORIZONTAL' ? 4 : 30,
    };
    setObstacles((current) => [...current, item]);
    setSelection({ type: 'obstacle', id: item.id });
  };

  // --- CANVAS POINTER EVENT HANDLERS (Drawing Wall & Moving Elements) ---
  const handleCanvasPointerDown = (event: React.PointerEvent) => {
    if (editorMode === 'DRAW_WALL') {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas || !activePlan) return;
      const rect = canvas.getBoundingClientRect();
      const startX = Math.round(Math.max(2, Math.min(98, ((event.clientX - rect.left) / rect.width) * 100)) / 2) * 2;
      const startY = Math.round(Math.max(2, Math.min(98, ((event.clientY - rect.top) / rect.height) * 100)) / 2) * 2;

      setDrawingWall({ startX, startY, currentX: startX, currentY: startY });

      const handlePointerMove = (e: PointerEvent) => {
        const currentX = Math.round(Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100)) / 2) * 2;
        const currentY = Math.round(Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100)) / 2) * 2;
        setDrawingWall((prev) => prev ? { ...prev, currentX, currentY } : null);
      };

      const handlePointerUp = (e: PointerEvent) => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);

        const endX = Math.round(Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100)) / 2) * 2;
        const endY = Math.round(Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100)) / 2) * 2;

        const deltaX = Math.abs(endX - startX);
        const deltaY = Math.abs(endY - startY);

        if (deltaX > 2 || deltaY > 2) {
          const width = Math.max(3, deltaX);
          const height = Math.max(3, deltaY);
          const posX = Math.min(startX, endX) + width / 2;
          const posY = Math.min(startY, endY) + height / 2;

          const newWall: FloorObstacle = {
            id: `temp_${Date.now()}`,
            floorPlanId: activePlan.id,
            label: 'Mur',
            posX,
            posY,
            width,
            height,
          };
          setObstacles((current) => [...current, newWall]);
          setSelection({ type: 'obstacle', id: newWall.id });
        }
        setDrawingWall(null);
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
    if (editorMode === 'DRAW_WALL') return;
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
            newWidth = Math.round(Math.max(2, Math.min(95, resize.initialW + deltaXPercent)) / 2) * 2;
            newPosX = resize.initialPosX + (newWidth - resize.initialW) / 2;
          } else if (resize.handle === 'W') {
            newWidth = Math.round(Math.max(2, Math.min(95, resize.initialW - deltaXPercent)) / 2) * 2;
            newPosX = resize.initialPosX - (newWidth - resize.initialW) / 2;
          } else if (resize.handle === 'S') {
            newHeight = Math.round(Math.max(2, Math.min(95, resize.initialH + deltaYPercent)) / 2) * 2;
            newPosY = resize.initialPosY + (newHeight - resize.initialH) / 2;
          } else if (resize.handle === 'N') {
            newHeight = Math.round(Math.max(2, Math.min(95, resize.initialH - deltaYPercent)) / 2) * 2;
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

  // Convert percentages to approximate real meters for display
  const getObstacleMeters = (obstacle: FloorObstacle) => {
    if (!activePlan) return { w: '0', h: '0' };
    const w = ((obstacle.width / 100) * activePlan.width).toFixed(1);
    const h = ((obstacle.height / 100) * activePlan.height).toFixed(1);
    return { w, h };
  };

  return (
    <div className="space-y-5">
      {/* Header Panel */}
      <div className="glass-panel p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg shadow-orange-500/20">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Éditeur de Plan de Salle 2D</h2>
            <p className="text-xs text-gray-400">Dessinez vos murs directement à l'écran et posez les tables.</p>
          </div>
        </div>
        {activePlan && (
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-emerald-400 text-xs font-extrabold flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <Check className="w-4 h-4" /> Plan Enregistré !
              </span>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-lg shadow-orange-500/20 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Sauvegarde…' : 'Sauvegarder Plan'}
            </button>
          </div>
        )}
      </div>

      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-xs font-bold">{error}</div>}

      {/* Plan Selector & New Plan bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setActivePlanId(plan.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              activePlanId === plan.id
                ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20 scale-105'
                : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            {plan.name} <span className="opacity-60">({tables.filter((t) => t.floorPlanId === plan.id).length} tables)</span>
          </button>
        ))}
        <div className="flex flex-wrap gap-2 glass-panel p-2 rounded-2xl border border-white/[0.08] items-center">
          <input
            aria-label="Nom du nouveau plan"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            placeholder="Nom: Terrasse, Étage…"
            className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
          />
          <input
            aria-label="Largeur du nouveau plan"
            type="number"
            min="4"
            max="50"
            value={newPlanWidth}
            onChange={(e) => setNewPlanWidth(Number(e.target.value))}
            className="w-16 bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-white"
          />
          <span className="self-center text-gray-500 text-xs">×</span>
          <input
            aria-label="Hauteur du nouveau plan"
            type="number"
            min="4"
            max="50"
            value={newPlanHeight}
            onChange={(e) => setNewPlanHeight(Number(e.target.value))}
            className="w-16 bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-white"
          />
          <span className="text-xs text-gray-500 mr-1">m</span>
          <button
            onClick={createPlan}
            className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Créer un espace
          </button>
        </div>
      </div>

      {!activePlan ? (
        <div className="glass-panel rounded-3xl border border-dashed border-white/[0.1] py-24 text-center space-y-3">
          <Layout className="w-14 h-14 mx-auto text-gray-700 mb-2 animate-pulse" />
          <h3 className="font-black text-white text-lg">Aucun plan de salle créé</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Créez votre premier espace (ex: Salle Principale 12m × 8m) ci-dessus pour commencer à dessiner vos murs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          {/* Main Interactive Canvas Area */}
          <div className="xl:col-span-3 glass-panel p-4 rounded-3xl border border-white/[0.08] space-y-3 overflow-hidden">
            {/* Toolbar Header */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Grid className="w-4 h-4 text-orange-400" />
                <input
                  aria-label="Nom du plan"
                  value={activePlan.name}
                  onChange={(e) => updateActivePlan({ name: e.target.value })}
                  className="bg-transparent font-black text-white text-base border-b border-white/10 focus:border-orange-400"
                />
              </div>

              {/* DRAW MODE TOGGLE BAR */}
              <div className="flex items-center bg-gray-950/80 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setEditorMode('SELECT')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    editorMode === 'SELECT'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>Sélection / Déplacer</span>
                </button>
                <button
                  onClick={() => setEditorMode('DRAW_WALL')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    editorMode === 'DRAW_WALL'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md animate-pulse'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>✏️ Dessiner un Mur</span>
                </button>
              </div>

              {/* Dimensions Control */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <label className="flex items-center">
                  L:
                  <input
                    type="number"
                    min="4"
                    max="50"
                    value={activePlan.width}
                    onChange={(e) => updateActivePlan({ width: Number(e.target.value) })}
                    className="w-14 ml-1 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-white font-bold"
                  />
                </label>
                <span>×</span>
                <label className="flex items-center">
                  H:
                  <input
                    type="number"
                    min="4"
                    max="50"
                    value={activePlan.height}
                    onChange={(e) => updateActivePlan({ height: Number(e.target.value) })}
                    className="w-14 ml-1 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-white font-bold"
                  />
                </label>
                <span className="text-gray-500 font-bold">m</span>
              </div>
            </div>

            {/* Instruction Tip */}
            {editorMode === 'DRAW_WALL' && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <Edit3 className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Mode Dessin Actif : Cliquez et glissez sur le plan pour tracer un mur directement !</span>
              </div>
            )}

            {/* 2D CANVAS CONTAINER */}
            <div
              ref={canvasRef}
              onPointerDown={handleCanvasPointerDown}
              className={`relative w-full min-h-[460px] bg-gray-950/95 rounded-2xl border-2 border-white/10 overflow-hidden select-none touch-none ${
                editorMode === 'DRAW_WALL' ? 'canvas-crosshair border-amber-500/50' : ''
              }`}
              style={{
                aspectRatio: `${activePlan.width}/${activePlan.height}`,
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.08) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              {/* Drawing Preview Line */}
              {drawingWall && (
                <div
                  style={{
                    left: `${Math.min(drawingWall.startX, drawingWall.currentX)}%`,
                    top: `${Math.min(drawingWall.startY, drawingWall.currentY)}%`,
                    width: `${Math.max(3, Math.abs(drawingWall.currentX - drawingWall.startX))}%`,
                    height: `${Math.max(3, Math.abs(drawingWall.currentY - drawingWall.startY))}%`,
                  }}
                  className="absolute bg-amber-500/40 border-2 border-dashed border-amber-400 rounded-lg pointer-events-none z-20 flex items-center justify-center text-[10px] font-black text-amber-300"
                >
                  Mur en cours...
                </div>
              )}

              {/* OBSTACLES / WALLS */}
              {obstacles.map((item) => {
                const isSelected = selection?.type === 'obstacle' && selection.id === item.id;
                const meters = getObstacleMeters(item);

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
                    className={`absolute touch-none cursor-move bg-slate-700/80 border-2 flex items-center justify-center text-[10px] font-bold text-slate-200 rounded-lg shadow-lg transition-shadow ${
                      isSelected
                        ? 'border-orange-400 ring-4 ring-orange-500/30 z-30 shadow-orange-500/20'
                        : 'border-slate-500/80 hover:border-slate-300'
                    }`}
                  >
                    <Square className="w-3 h-3 mr-1 text-slate-400" />
                    <span>{item.label}</span>
                    <span className="text-[8px] opacity-75 ml-1">({meters.w}m)</span>

                    {/* INTERACTIVE RESIZE HANDLES FOR SELECTED WALL */}
                    {isSelected && (
                      <>
                        {/* Right Edge (East) */}
                        <div
                          onPointerDown={(e) => handleResizePointerDown(item.id, 'E', e)}
                          className="resize-handle top-1/2 -right-2 -translate-y-1/2 cursor-e-resize"
                          title="Redimensionner Largeur (Est)"
                        />
                        {/* Left Edge (West) */}
                        <div
                          onPointerDown={(e) => handleResizePointerDown(item.id, 'W', e)}
                          className="resize-handle top-1/2 -left-2 -translate-y-1/2 cursor-w-resize"
                          title="Redimensionner Largeur (Ouest)"
                        />
                        {/* Bottom Edge (South) */}
                        <div
                          onPointerDown={(e) => handleResizePointerDown(item.id, 'S', e)}
                          className="resize-handle -bottom-2 left-1/2 -translate-x-1/2 cursor-s-resize"
                          title="Redimensionner Épaisseur (Sud)"
                        />
                        {/* Top Edge (North) */}
                        <div
                          onPointerDown={(e) => handleResizePointerDown(item.id, 'N', e)}
                          className="resize-handle -top-2 left-1/2 -translate-x-1/2 cursor-n-resize"
                          title="Redimensionner Épaisseur (Nord)"
                        />
                      </>
                    )}
                  </div>
                );
              })}

              {/* TABLES */}
              {planTables.map((table) => {
                const waiter = waiterFor(table.tableNumber);
                const color = waiter ? WAITER_COLORS[Math.max(0, waiters.findIndex((w) => w.id === waiter.id)) % WAITER_COLORS.length] : null;
                const isSelected = selection?.type === 'table' && selection.id === table.id;

                return (
                  <div
                    key={table.id}
                    onPointerDown={(e) => pointerDown({ type: 'table', id: table.id }, e)}
                    style={{
                      left: `${table.posX}%`,
                      top: `${table.posY}%`,
                      transform: 'translate(-50%,-50%)',
                    }}
                    className={`absolute w-16 h-16 touch-none cursor-move flex flex-col items-center justify-center border shadow-xl transition-all ${
                      table.shape === 'ROUND'
                        ? 'rounded-full'
                        : table.shape === 'SOFA'
                        ? 'w-24 h-14 rounded-2xl'
                        : 'rounded-2xl'
                    } ${
                      isSelected
                        ? 'bg-orange-500/30 border-orange-400 ring-4 ring-orange-500/30 z-30 scale-110 shadow-orange-500/30'
                        : color
                        ? `${color.bg} ${color.border}`
                        : 'bg-gray-800/90 border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-xs font-black text-white">{formatTableCode(table.tableCode, table.tableNumber)}</span>
                    <span className="text-[8px] font-bold text-gray-400 truncate max-w-[50px]">{waiter?.name || 'Libre'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Control Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions Panel */}
            <div className="glass-panel p-4 rounded-3xl border border-white/[0.08] space-y-3">
              <h3 className="font-black text-xs uppercase text-gray-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-orange-400" />
                <span>Ajouter une table</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">N° Table</label>
                  <input
                    aria-label="Numéro de table"
                    type="number"
                    value={newTableNumber}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setNewTableNumber(value);
                      setNewTableCode(formatTableCode(undefined, value));
                    }}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Code</label>
                  <input
                    aria-label="Code de table"
                    value={newTableCode}
                    onChange={(e) => setNewTableCode(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs uppercase text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Forme</label>
                <select
                  aria-label="Forme de table"
                  value={newShape}
                  onChange={(e) => setNewShape(e.target.value as TableShape)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="SQUARE">Carrée ⬛</option>
                  <option value="ROUND">Ronde 🔴</option>
                  <option value="RECTANGLE">Rectangle 🟩</option>
                  <option value="SOFA">Banquette / Lounge 🛋️</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Nombre de places</label>
                <input
                  aria-label="Nombre de places"
                  type="number"
                  min="1"
                  max="30"
                  value={newSeats}
                  onChange={(e) => setNewSeats(Number(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                onClick={addTable}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-xl py-2.5 text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Poser la Table
              </button>
            </div>

            {/* Manual Wall Addition Shortcuts */}
            <div className="glass-panel p-4 rounded-3xl border border-white/[0.08] space-y-2">
              <h3 className="font-black text-xs uppercase text-gray-400 flex items-center gap-1.5">
                <Square className="w-4 h-4 text-slate-400" />
                <span>Raccourcis Murs</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => addWall('HORIZONTAL')}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Square className="w-3.5 h-3.5" /> Mur H
                </button>
                <button
                  onClick={() => addWall('VERTICAL')}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 rotate-90" /> Mur V
                </button>
              </div>
            </div>

            {/* Selected Wall Inspector */}
            {selectedObstacle && (
              <div className="glass-panel p-4 rounded-3xl border border-orange-500/40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-orange-500/20 pb-2">
                  <h3 className="text-xs font-black text-orange-400 flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5" /> Mur Sélectionné
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold">
                    {getObstacleMeters(selectedObstacle).w}m × {getObstacleMeters(selectedObstacle).h}m
                  </span>
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
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </label>
                  <label className="text-[10px] text-gray-400">
                    Épaisseur (%)
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
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </label>
                </div>

                <div className="text-[10px] text-orange-300/80 italic">
                  💡 Astuce: Vous pouvez aussi faire glisser les poignées orange autour du mur sur le canvas pour le redimensionner !
                </div>

                <button
                  onClick={() => {
                    setObstacles((current) => current.filter((item) => item.id !== selectedObstacle.id));
                    setSelection(null);
                  }}
                  className="w-full text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer ce Mur
                </button>
              </div>
            )}

            {/* Selected Table Inspector */}
            {selectedTable && (
              <div className="glass-panel p-4 rounded-3xl border border-orange-500/40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-orange-500/20 pb-2">
                  <h3 className="text-xs font-black text-orange-400">
                    Table {formatTableCode(selectedTable.tableCode, selectedTable.tableNumber)}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold">
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
                              ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                              : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <span>{waiter.name}</span>
                          {isAssigned && <Check className="w-3 h-3 text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTables((current) => current.filter((table) => table.id !== selectedTable.id));
                    setSelection(null);
                  }}
                  className="w-full text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer la Table
                </button>
              </div>
            )}

            <button
              onClick={deletePlan}
              className="w-full text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Supprimer ce Plan de Salle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
