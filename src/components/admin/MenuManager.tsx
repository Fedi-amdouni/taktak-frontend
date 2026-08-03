import React, { useState, useEffect } from 'react';
import { Plus, Edit, Eye, EyeOff, Upload, Sparkles, Tag, UtensilsCrossed, Trash2, Coffee, Layers } from 'lucide-react';
import { Category, Product, Cafe, ProductBadge, ComboSlot } from '../../types';
import { api } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';

interface MenuManagerProps {
  cafeSlug: string;
}

const CREATE_CATEGORY_VALUE = '__create_category__';

export const MenuManager: React.FC<MenuManagerProps> = ({ cafeSlug }) => {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [comboSlots, setComboSlots] = useState<ComboSlot[]>([]);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const loadMenu = async () => {
    const cafeData = await api.getCafeBySlug(cafeSlug);
    const data = await api.getMenu(cafeSlug);
    setCafe(cafeData);
    setCategories(data.categories);
    setProducts(data.products);
  };

  useEffect(() => {
    loadMenu();
  }, [cafeSlug]);

  const handleToggleAvailability = async (productId: string) => {
    const updated = await api.toggleProductAvailability(productId);
    setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        setEditingProduct((prev) => (prev ? { ...prev, imageUrl: base64Url } : null));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Erreur lors de l'upload de la photo");
      setIsUploading(false);
    }
  };

  const openNewProduct = () => {
    setIsCategoryFormOpen(false);
    setNewCategoryName('');
    setComboSlots([]);
    setEditingProduct({
      cafeId: cafe?.id || 'a1b2c3d4-e5f6-7890-abcd-111111111111',
      categoryId: categories[0]?.id || '',
      name: '',
      description: '',
      price: 4.500,
      promoPrice: undefined,
      badge: undefined,
      isAvailable: true,
      isCombo: false,
      imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80',
    });
  };

  const openNewCombo = () => {
    setIsCategoryFormOpen(false);
    setNewCategoryName('');

    // Ensure a "Petits Déjeuners & Formules" category exists or pick first
    let comboCategory = categories.find((c) =>
      c.name.toLowerCase().includes('petit') || c.name.toLowerCase().includes('formule') || c.name.toLowerCase().includes('combo')
    );

    const defaultSlots: ComboSlot[] = [
      {
        id: `slot_${Date.now()}_1`,
        title: 'Choix de la boisson chaude',
        selectionType: 'CATEGORY',
        categoryId: categories[0]?.id || '',
        requiredQuantity: 1,
      },
      {
        id: `slot_${Date.now()}_2`,
        title: 'Choix de la viennoiserie',
        selectionType: 'CATEGORY',
        categoryId: categories[1]?.id || categories[0]?.id || '',
        requiredQuantity: 1,
      },
    ];

    setComboSlots(defaultSlots);
    setEditingProduct({
      cafeId: cafe?.id || 'a1b2c3d4-e5f6-7890-abcd-111111111111',
      categoryId: comboCategory?.id || categories[0]?.id || '',
      name: 'Petit-Déjeuner Express',
      description: '1 Boisson chaude au choix + 1 Viennoiserie au choix + Omelette maison',
      price: 8.500,
      promoPrice: undefined,
      badge: 'BREAKFAST',
      isAvailable: true,
      isCombo: true,
      imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=500&q=80',
    });
  };

  const openEditProduct = (product: Product) => {
    setIsCategoryFormOpen(false);
    setNewCategoryName('');

    const rawPrice = product.price;
    const numPrice = rawPrice !== null && rawPrice !== undefined ? Number(rawPrice) : NaN;
    const finalPrice = Number.isFinite(numPrice) ? numPrice : 0;

    const rawPromo = product.promoPrice;
    const numPromo = rawPromo !== null && rawPromo !== undefined ? Number(rawPromo) : NaN;
    const finalPromo = Number.isFinite(numPromo) && numPromo > 0 ? numPromo : undefined;

    // Parse existing combo slots
    let parsedSlots: ComboSlot[] = [];
    if (product.comboSlotsJson) {
      if (Array.isArray(product.comboSlotsJson)) {
        parsedSlots = product.comboSlotsJson;
      } else if (typeof product.comboSlotsJson === 'string') {
        try {
          parsedSlots = JSON.parse(product.comboSlotsJson);
        } catch (e) {
          parsedSlots = [];
        }
      }
    }
    setComboSlots(parsedSlots);

    setEditingProduct({
      ...product,
      cafeId: product.cafeId || cafe?.id || 'a1b2c3d4-e5f6-7890-abcd-111111111111',
      categoryId: product.categoryId || (categories.length > 0 ? categories[0].id : ''),
      name: product.name || '',
      description: product.description || '',
      price: finalPrice,
      promoPrice: finalPromo,
      badge: product.badge,
      isAvailable: product.isAvailable ?? true,
      isCombo: product.isCombo || parsedSlots.length > 0,
      imageUrl: product.imageUrl || '',
      optionsJson: product.optionsJson,
    });
  };

  const addComboSlot = () => {
    const newSlot: ComboSlot = {
      id: `slot_${Date.now()}`,
      title: 'Boisson / Produit au choix',
      selectionType: 'CATEGORY',
      categoryId: categories[0]?.id || '',
      requiredQuantity: 1,
    };
    setComboSlots((prev) => [...prev, newSlot]);
  };

  const updateComboSlot = (id: string, patch: Partial<ComboSlot>) => {
    setComboSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeComboSlot = (id: string) => {
    setComboSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCategoryChange = (value: string) => {
    if (value === CREATE_CATEGORY_VALUE) {
      setIsCategoryFormOpen(true);
      return;
    }

    setIsCategoryFormOpen(false);
    setEditingProduct((previous) => (previous ? { ...previous, categoryId: value } : previous));
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || !cafe?.id || isCreatingCategory) return;

    setIsCreatingCategory(true);
    try {
      const created = await api.createCategory({
        cafeId: cafe.id,
        name,
        sortOrder: categories.length + 1,
      });
      setCategories((previous) =>
        previous.some((category) => category.id === created.id) ? previous : [...previous, created]
      );
      setEditingProduct((previous) => (previous ? { ...previous, categoryId: created.id } : previous));
      setIsCategoryFormOpen(false);
      setNewCategoryName('');
    } catch (err) {
      alert('Erreur lors de la création de la catégorie. Veuillez réessayer.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || isSubmitting) return;

    const name = editingProduct.name?.trim() || '';
    if (!name) {
      alert('Veuillez renseigner le nom du produit.');
      return;
    }

    const priceVal = Number(editingProduct.price);
    if (!Number.isFinite(priceVal) || priceVal <= 0) {
      alert('Veuillez indiquer un prix valide supérieur à 0.');
      return;
    }

    let promoVal: number | undefined = undefined;
    if (editingProduct.promoPrice !== undefined && editingProduct.promoPrice !== null) {
      const parsedPromo = Number(editingProduct.promoPrice);
      if (Number.isFinite(parsedPromo) && parsedPromo > 0) {
        promoVal = parsedPromo;
      }
    }

    setIsSubmitting(true);
    try {
      const isComboProduct = editingProduct.isCombo || comboSlots.length > 0;
      const payload: Partial<Product> = {
        ...editingProduct,
        cafeId: cafe?.id || 'a1b2c3d4-e5f6-7890-abcd-111111111111',
        name,
        price: priceVal,
        promoPrice: promoVal,
        isCombo: isComboProduct,
        comboSlotsJson: isComboProduct && comboSlots.length > 0 ? JSON.stringify(comboSlots) : undefined,
      };
      await api.saveProduct(payload);
      await loadMenu();
      setEditingProduct(null);
    } catch (err) {
      alert('Erreur lors de la sauvegarde du produit. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBadgeTag = (badge?: ProductBadge, isCombo?: boolean) => {
    if (isCombo || badge === 'BREAKFAST' || badge === 'COMBO') {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">🥐 Formule Petit-Déj</span>;
    }
    if (!badge) return null;
    switch (badge) {
      case 'CHEF_SUGGESTION':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">⭐ Chef</span>;
      case 'BEST_SELLER':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">🔥 Top</span>;
      case 'PROMO':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">🏷️ Promo</span>;
      case 'NEW':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">✨ Nouveau</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Gestion du Menu</h2>
          <p className="text-xs text-gray-400">Gérez vos produits individuels ainsi que vos formules & petits-déjeuners personnalisables</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={openNewCombo}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>🥐 + Créer Petit-Déjeuner / Formule</span>
          </button>
          <button
            onClick={openNewProduct}
            className="bg-white/[0.06] hover:bg-white/[0.1] text-gray-200 border border-white/10 text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Produit Standard</span>
          </button>
        </div>
      </div>

      {/* Product / Combo Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleSaveProduct}
            className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                {editingProduct.isCombo ? '🥐 Éditer le Petit-Déjeuner / Formule' : editingProduct.id ? 'Éditer le Produit' : 'Créer un Produit'}
              </h3>
              <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-xl border border-orange-500/20">
                {editingProduct.isCombo ? 'Pack / Formule Combo' : 'Produit Simple'}
              </span>
            </div>

            {/* Formule / Combo Switcher */}
            <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
              <div>
                <span className="text-xs font-bold text-white block">Formule Petit-Déjeuner ou Pack Combo</span>
                <span className="text-[10px] text-gray-400">Permet au client de choisir ses boissons et produits au choix dans le pack</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct({ ...editingProduct, isCombo: !editingProduct.isCombo })}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  editingProduct.isCombo
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {editingProduct.isCombo ? 'Oui (Formule Active)' : 'Non (Produit Simple)'}
              </button>
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400">Catégorie</label>
                {!isCategoryFormOpen && (
                  <button
                    type="button"
                    onClick={() => setIsCategoryFormOpen(true)}
                    className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Créer une catégorie</span>
                  </button>
                )}
              </div>

              <select
                value={isCategoryFormOpen ? CREATE_CATEGORY_VALUE : (editingProduct.categoryId || '')}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-gray-800 text-xs text-white p-3 rounded-xl border border-gray-700 focus:outline-none focus:border-orange-500/50"
              >
                {categories.length === 0 ? (
                  <option value="" disabled>
                    Aucune catégorie disponible
                  </option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      📁 {c.name}
                    </option>
                  ))
                )}
                <option value={CREATE_CATEGORY_VALUE}>➕ Ajouter une nouvelle catégorie...</option>
              </select>

              {isCategoryFormOpen && (
                <div className="p-3 bg-gray-800/90 border border-orange-500/40 rounded-2xl space-y-2 mt-2 shadow-inner">
                  <div className="text-[11px] font-bold text-orange-400 flex items-center space-x-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Créer une nouvelle catégorie</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      autoFocus
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleCreateCategory();
                        }
                      }}
                      placeholder="Nom (ex: Petits Déjeuners)"
                      className="flex-1 bg-gray-900 text-xs text-white p-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreateCategory()}
                      disabled={!newCategoryName.trim() || isCreatingCategory}
                      className="px-3 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all"
                    >
                      {isCreatingCategory ? '...' : 'Ajouter'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCategoryFormOpen(false);
                        setNewCategoryName('');
                      }}
                      className="px-3 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-bold rounded-xl transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Product Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Nom de la Formule / Produit</label>
              <input
                type="text"
                required
                value={editingProduct.name || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                placeholder="Ex: Petit-Déjeuner Gourmand"
                className="w-full bg-gray-800 text-xs text-white p-3 rounded-xl border border-gray-700 focus:outline-none"
              />
            </div>

            {/* Description (Indispensable pour petits dej / combos) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Description Détaillée</label>
              <textarea
                rows={2}
                value={editingProduct.description || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                placeholder="Ex: 1 Boisson chaude au choix + 1 Jus d'orange + 1 Omelette au fromage + Toast au beurre"
                className="w-full bg-gray-800 text-xs text-white p-3 rounded-xl border border-gray-700 focus:outline-none resize-none"
              />
            </div>

            {/* DYNAMIC COMBO SLOTS BUILDER (FOR PETITS DEJEUNERS & COMBOS) */}
            {editingProduct.isCombo && (
              <div className="bg-amber-500/[0.04] p-4 rounded-2xl border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-amber-400">
                    <Layers className="w-4 h-4" />
                    <span>Groupes de Choix Dynamiques (Choix Client)</span>
                  </div>
                  <button
                    type="button"
                    onClick={addComboSlot}
                    className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold rounded-xl border border-amber-500/30 flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Ajouter un Choix
                  </button>
                </div>

                {comboSlots.length === 0 ? (
                  <p className="text-[11px] text-gray-500 text-center py-3 italic">
                    Aucun créneau de choix ajouté. Cliquez sur "+ Ajouter un Choix" pour lier des boissons ou viennoiseries au choix.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {comboSlots.map((slot, index) => (
                      <div key={slot.id} className="p-3 bg-gray-950/80 rounded-xl border border-gray-800 space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                            Créneau {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeComboSlot(slot.id)}
                            className="text-red-400 hover:text-red-300 text-xs p-1"
                            title="Supprimer ce créneau"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] text-gray-500 block mb-0.5">Titre du choix</label>
                            <input
                              type="text"
                              value={slot.title}
                              onChange={(e) => updateComboSlot(slot.id, { title: e.target.value })}
                              placeholder="Ex: Choix de la boisson chaude"
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 block mb-0.5">Qté requise</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={slot.requiredQuantity}
                              onChange={(e) => updateComboSlot(slot.id, { requiredQuantity: Number(e.target.value) })}
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-500 block mb-0.5">Lié à la Catégorie Dynamique</label>
                          <select
                            value={slot.categoryId || ''}
                            onChange={(e) => updateComboSlot(slot.id, { categoryId: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                📁 {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Badge Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Badge / Mise en Avant</span>
              </label>
              <select
                value={editingProduct.badge || ''}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    badge: (e.target.value || undefined) as ProductBadge | undefined,
                  })
                }
                className="w-full bg-gray-800 text-xs text-white p-3 rounded-xl border border-gray-700 focus:outline-none"
              >
                <option value="">Aucun Badge (Standard)</option>
                <option value="BREAKFAST">🥐 Petit-Déjeuner / Formule</option>
                <option value="COMBO">🎁 Pack Combo</option>
                <option value="CHEF_SUGGESTION">⭐ Suggestion du Chef</option>
                <option value="BEST_SELLER">🔥 Best-Seller</option>
                <option value="PROMO">🏷️ Produit en Promo</option>
                <option value="NEW">✨ Nouveauté</option>
              </select>
            </div>

            {/* Preparation Time */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 flex items-center space-x-1">
                <span className="text-amber-400">⏱️</span>
                <span>Temps de Préparation Estimé (minutes)</span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={editingProduct.prepTimeMinutes ?? ''}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    prepTimeMinutes: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                placeholder="Ex: 5 min, 10 min, 15 min"
                className="w-full bg-gray-800 text-xs text-white p-3 rounded-xl border border-gray-700 focus:outline-none"
              />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Prix Formule / Produit (TND)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={editingProduct.price ?? ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  placeholder="Ex: 3, 3.5, 8.500"
                  className="w-full bg-gray-800 text-xs text-white p-3 rounded-xl border border-gray-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-red-400" />
                  <span>Prix Promo (Optionnel)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Ex: 2.5, 7.500"
                  value={editingProduct.promoPrice ?? ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      promoPrice: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  className="w-full bg-gray-800 text-xs text-white p-3 rounded-xl border border-gray-700 focus:outline-none placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Direct Device Image Upload */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-gray-400 block">Photo de la Formule / Produit</label>
              
              {editingProduct.imageUrl && (
                <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-gray-800 border border-gray-700">
                  <img src={editingProduct.imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <label className="flex-1 cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all">
                  <Upload className="w-4 h-4 text-orange-400" />
                  <span>{isUploading ? 'Chargement...' : '📷 Téléverser photo'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <input
                type="text"
                placeholder="Ou coller une URL d'image..."
                value={editingProduct.imageUrl || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                className="w-full bg-gray-800/60 text-xs text-gray-400 p-2.5 rounded-xl border border-gray-700/60 focus:outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2.5 bg-gray-800 text-gray-400 text-xs font-bold rounded-xl"
              >
                Annuler
              </button>
              <button
                disabled={isSubmitting}
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="glass-panel rounded-3xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/90 text-gray-400 uppercase text-[10px] border-b border-gray-800">
              <tr>
                <th className="p-4">Produit / Formule</th>
                <th className="p-4">Prix</th>
                <th className="p-4">Type</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/30 transition-all">
                  <td className="p-4 flex items-center space-x-3">
                    <img
                      src={p.imageUrl || 'https://via.placeholder.com/40'}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-white">{p.name}</span>
                        {renderBadgeTag(p.badge, p.isCombo)}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                        📁 {categoryMap.get(p.categoryId) || 'Catégorie non spécifiée'}
                      </span>
                      {p.description && (
                        <span className="text-[10px] text-gray-500 block italic truncate max-w-xs">
                          {p.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {p.promoPrice ? (
                      <div>
                        <span className="line-through text-gray-500 text-[10px] mr-1">
                          {formatPrice(p.price)}
                        </span>
                        <span className="font-bold text-red-400">
                          {formatPrice(p.promoPrice)} TND
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-orange-400">
                        {formatPrice(p.price)} TND
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {p.isCombo || p.comboSlotsJson ? (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                        🥐 Formule / Combo
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-white/[0.04] text-gray-400 border border-white/[0.06] text-[10px]">
                        Simple
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleAvailability(p.id)}
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        p.isAvailable
                          ? 'bg-green-500/10 text-green-400 border-green-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {p.isAvailable ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{p.isAvailable ? 'En Stock' : 'Épuisé'}</span>
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openEditProduct(p)}
                      className="p-2 text-gray-400 hover:text-white bg-gray-800/80 rounded-xl transition-all active:scale-95"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
