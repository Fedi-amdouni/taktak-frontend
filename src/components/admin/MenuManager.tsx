import React, { useState, useEffect } from 'react';
import { Plus, Edit, Eye, EyeOff, Upload, Star, Sparkles, Flame, Tag } from 'lucide-react';
import { Category, Product, Cafe, ProductBadge } from '../../types';
import { api } from '../../services/api';

interface MenuManagerProps {
  cafeSlug: string;
}

const CREATE_CATEGORY_VALUE = '__create_category__';

export const MenuManager: React.FC<MenuManagerProps> = ({ cafeSlug }) => {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
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
    setEditingProduct({
      cafeId: cafe?.id || 'a1b2c3d4-e5f6-7890-abcd-111111111111',
      categoryId: categories[0]?.id || '',
      name: '',
      price: 4.500,
      promoPrice: undefined,
      badge: undefined,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80',
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

    setEditingProduct({
      ...product,
      cafeId: product.cafeId || cafe?.id || 'a1b2c3d4-e5f6-7890-abcd-111111111111',
      categoryId: product.categoryId || (categories.length > 0 ? categories[0].id : ''),
      name: product.name || '',
      price: finalPrice,
      promoPrice: finalPromo,
      badge: product.badge,
      isAvailable: product.isAvailable ?? true,
      imageUrl: product.imageUrl || '',
      optionsJson: product.optionsJson,
    });
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
      const payload: Partial<Product> = {
        ...editingProduct,
        cafeId: cafe?.id || 'a1b2c3d4-e5f6-7890-abcd-111111111111',
        name,
        price: priceVal,
        promoPrice: promoVal,
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

  const renderBadgeTag = (badge?: ProductBadge) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Gestion du Menu</h2>
          <p className="text-xs text-gray-400">Ajoutez des photos, fixez les prix promos et définissez les catégories</p>
        </div>
        <button
          onClick={openNewProduct}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Produit</span>
        </button>
      </div>

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSaveProduct}
            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <h3 className="text-base font-bold text-white">
              {editingProduct.id ? 'Éditer le Produit' : 'Créer un Produit'}
            </h3>

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
                      placeholder="Nom de la catégorie (ex: Jus Frais)"
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
              <label className="text-xs font-semibold text-gray-400">Nom du Produit</label>
              <input
                type="text"
                required
                value={editingProduct.name || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                placeholder="Ex: Café Crème"
                className="w-full bg-gray-800 text-xs text-white p-3 rounded-xl border border-gray-700 focus:outline-none"
              />
            </div>

            {/* Badge / Attraction Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Badge Spécial / Mise en Avant</span>
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
                <option value="CHEF_SUGGESTION">⭐ Suggestion du Chef</option>
                <option value="BEST_SELLER">🔥 Best-Seller</option>
                <option value="PROMO">🏷️ Produit en Promo</option>
                <option value="NEW">✨ Nouveauté</option>
                <option value="SPICY">🌶️ Recette Épicée</option>
                <option value="VEGETARIAN">🌿 Végétarien</option>
              </select>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Prix Normal (TND)</label>
                <input
                  type="number"
                  step="0.100"
                  min="0.001"
                  required
                  value={editingProduct.price ?? ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  placeholder="Ex: 3.500"
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
                  step="0.100"
                  min="0.001"
                  placeholder="Ex: 2.500"
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
              <label className="text-xs font-semibold text-gray-400 block">Photo du Produit</label>
              
              {/* Preview */}
              {editingProduct.imageUrl && (
                <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-gray-800 border border-gray-700">
                  <img src={editingProduct.imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <label className="flex-1 cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all">
                  <Upload className="w-4 h-4 text-orange-400" />
                  <span>{isUploading ? 'Chargement...' : '📷 Téléverser depuis appareil'}</span>
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
            <div className="flex items-center justify-end space-x-2 pt-3">
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
                className="px-5 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50"
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
                <th className="p-4">Produit</th>
                <th className="p-4">Prix</th>
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
                        {renderBadgeTag(p.badge)}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                        📁 {categoryMap.get(p.categoryId) || 'Catégorie non spécifiée'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {p.promoPrice ? (
                      <div>
                        <span className="line-through text-gray-500 text-[10px] mr-1">
                          {Number(p.price).toFixed(3)}
                        </span>
                        <span className="font-bold text-red-400">
                          {Number(p.promoPrice).toFixed(3)} TND
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-orange-400">
                        {Number(p.price).toFixed(3)} TND
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

