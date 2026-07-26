'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { menuCategoriesApi, menuItemsApi, ApiError } from '@/lib/api';
import type { MenuCategory, MenuItem } from '@/types';
import { 
  FolderPlus, 
  Plus, 
  Edit, 
  Trash2, 
  Sparkles, 
  Clock, 
  Coins, 
  Eye, 
  EyeOff, 
  Search, 
  UtensilsCrossed,
  SlidersHorizontal,
  LayoutGrid
} from 'lucide-react';
import { formatCurrency } from '@/lib/money';

export default function MenuSetupPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { can } = usePermissions();

  // Tab State
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

  // Data State
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [itemSearch, setItemSearch] = useState('');
  const [itemCategoryFilter, setItemCategoryFilter] = useState<number | 'all'>('all');
  const [categorySearch, setCategorySearch] = useState('');

  // Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [editCategory, setEditCategory] = useState<MenuCategory | null>(null);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'item'; id: number } | null>(null);

  // Form States
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    sort_order: 0,
    is_active: true,
    image_url: '',
  });

  const [itemForm, setItemForm] = useState({
    menu_category_id: 0,
    name: '',
    description: '',
    price: '',
    cost: '',
    image_url: '',
    is_active: true,
    sort_order: 0,
    track_inventory: true,
    preparation_time_minutes: 10,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (can('pos.manage_menu')) {
      loadData();
    }
  }, [can]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        menuCategoriesApi.list(),
        menuItemsApi.list(),
      ]);
      setCategories(catsRes.data);
      setItems(itemsRes.data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to load menu setup data.');
    } finally {
      setLoading(false);
    }
  };

  // Open Add/Edit Category Modal
  const openCategoryModal = (category: MenuCategory | null = null) => {
    setFormError(null);
    if (category) {
      setEditCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description ?? '',
        sort_order: category.sort_order,
        is_active: category.is_active,
        image_url: category.image_url ?? '',
      });
    } else {
      setEditCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        sort_order: categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 0,
        is_active: true,
        image_url: '',
      });
    }
    setShowCategoryModal(true);
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        ...categoryForm,
        image_url: categoryForm.image_url.trim() || undefined,
      };

      if (editCategory) {
        await menuCategoriesApi.update(editCategory.id, payload);
      } else {
        await menuCategoriesApi.create(payload);
      }
      
      await loadData();
      setShowCategoryModal(false);
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Add/Edit Item Modal
  const openItemModal = (item: MenuItem | null = null) => {
    setFormError(null);
    if (item) {
      setEditItem(item);
      setItemForm({
        menu_category_id: item.menu_category_id,
        name: item.name,
        description: item.description ?? '',
        price: item.price.toString(),
        cost: item.cost ? item.cost.toString() : '',
        image_url: item.image_url ?? '',
        is_active: item.is_active,
        sort_order: item.sort_order,
        track_inventory: item.track_inventory,
        preparation_time_minutes: item.preparation_time_minutes ?? 10,
      });
    } else {
      setEditItem(null);
      setItemForm({
        menu_category_id: categories[0]?.id ?? 0,
        name: '',
        description: '',
        price: '',
        cost: '',
        image_url: '',
        is_active: true,
        sort_order: items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0,
        track_inventory: true,
        preparation_time_minutes: 10,
      });
    }
    setShowItemModal(true);
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      setFormError('Item name is required.');
      return;
    }
    if (!itemForm.menu_category_id) {
      setFormError('Category is required.');
      return;
    }
    if (!itemForm.price || isNaN(Number(itemForm.price)) || Number(itemForm.price) < 0) {
      setFormError('A valid price is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        ...itemForm,
        menu_category_id: Number(itemForm.menu_category_id),
        price: Number(itemForm.price),
        cost: itemForm.cost ? Number(itemForm.cost) : undefined,
        image_url: itemForm.image_url.trim() || undefined,
        preparation_time_minutes: Number(itemForm.preparation_time_minutes),
      };

      if (editItem) {
        await menuItemsApi.update(editItem.id, payload);
      } else {
        await menuItemsApi.create(payload);
      }

      await loadData();
      setShowItemModal(false);
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'Failed to save menu item.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Dialog
  const triggerDelete = (type: 'category' | 'item', id: number) => {
    setDeleteTarget({ type, id });
    setShowDeleteConfirm(true);
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      if (deleteTarget.type === 'category') {
        await menuCategoriesApi.delete(deleteTarget.id);
      } else {
        await menuItemsApi.delete(deleteTarget.id);
      }
      await loadData();
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (caught) {
      alert(caught instanceof ApiError ? caught.message : 'Deletion failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Memoized Filtered Categories
  const filteredCategories = useMemo(() => {
    const query = categorySearch.toLowerCase().trim();
    if (!query) return categories;
    return categories.filter(c => 
      c.name.toLowerCase().includes(query) || 
      (c.description && c.description.toLowerCase().includes(query))
    );
  }, [categories, categorySearch]);

  // Memoized Filtered Items
  const filteredItems = useMemo(() => {
    const query = itemSearch.toLowerCase().trim();
    return items.filter(item => {
      const matchesCategory = itemCategoryFilter === 'all' || item.menu_category_id === Number(itemCategoryFilter);
      const matchesSearch = !query || 
        item.name.toLowerCase().includes(query) || 
        (item.description && item.description.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [items, itemSearch, itemCategoryFilter]);

  if (!can('pos.manage_menu')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">{t('errors.noPermission')}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 min-h-screen pb-12 ${isRtl ? 'rtl' : 'ltr'}`}>
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary tracking-tight">
            {t('menuSetup.title')}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {t('menuSetup.subtitle')}
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          {activeTab === 'items' ? (
            <button
              onClick={() => openItemModal(null)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 shadow-soft transition"
            >
              <Plus className="w-4 h-4" />
              {t('menuSetup.addItem')}
            </button>
          ) : (
            <button
              onClick={() => openCategoryModal(null)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 shadow-soft transition"
            >
              <FolderPlus className="w-4 h-4" />
              {t('menuSetup.addCategory')}
            </button>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 text-sm font-semibold transition relative ${
            activeTab === 'items' 
              ? 'text-text-accent' 
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {t('menuSetup.items')}
          {activeTab === 'items' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-accent rounded-full animate-fade-in" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-sm font-semibold transition relative ${
            activeTab === 'categories' 
              ? 'text-text-accent' 
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {t('menuSetup.categories')}
          {activeTab === 'categories' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-accent rounded-full animate-fade-in" />
          )}
        </button>
      </div>

      {/* Main Tab Views */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-44 rounded-2xl bg-surface-elevated border border-border" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-error/20 bg-error/10 p-5 text-sm text-error">
          {error}
        </div>
      ) : (
        <>
          {activeTab === 'items' && (
            <div className="flex flex-col gap-6">
              {/* Item Filters bar */}
              <div className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Filter:
                  </span>
                  <select
                    value={itemCategoryFilter}
                    onChange={(e) => setItemCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="px-3 py-2 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary focus:outline-none focus:border-text-accent"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Grid/Table */}
              <div className="glass rounded-2xl overflow-hidden border border-border">
                {filteredItems.length === 0 ? (
                  <div className="p-12 text-center text-text-muted">
                    <UtensilsCrossed className="w-10 h-10 mx-auto opacity-30 mb-3" />
                    <p>No menu items found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-text-secondary text-left font-medium">
                          <th className="py-4 px-6">Name</th>
                          <th className="py-4 px-6">Category</th>
                          <th className="py-4 px-6">Price</th>
                          <th className="py-4 px-6">Cost</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Inventory</th>
                          <th className="py-4 px-6">Prep Time</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredItems.map((item) => (
                          <tr key={item.id} className="hover:bg-surface-hover/30 transition">
                            <td className="py-4 px-6 font-medium text-text-primary">
                              <div className="flex items-center gap-3">
                                {item.image_url ? (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.name} 
                                    className="w-9 h-9 rounded-lg object-cover border border-border"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center border border-border">
                                    <UtensilsCrossed className="w-4 h-4 text-text-muted" />
                                  </div>
                                )}
                                <div>
                                  <p>{item.name}</p>
                                  {item.description && (
                                    <p className="text-xs text-text-muted line-clamp-1 mt-0.5 max-w-xs">{item.description}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-text-secondary">
                              <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-accent/10 text-accent">
                                {item.category?.name ?? 'Uncategorized'}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-semibold text-text-primary">
                              {formatCurrency(Number(item.price))}
                            </td>
                            <td className="py-4 px-6 text-text-secondary">
                              {item.cost ? formatCurrency(Number(item.cost)) : '-'}
                            </td>
                            <td className="py-4 px-6">
                              {item.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success bg-opacity-10 text-success">
                                  <Eye className="w-3 h-3" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-text-muted/10 text-text-muted">
                                  <EyeOff className="w-3 h-3" /> Inactive
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {item.track_inventory ? (
                                <span className="text-xs font-medium text-text-accent">Tracked</span>
                              ) : (
                                <span className="text-xs text-text-muted">Off</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-text-secondary">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 opacity-60" />
                                {item.preparation_time_minutes ?? 0}m
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openItemModal(item)}
                                  className="p-1.5 rounded bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition"
                                  title="Edit Item"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => triggerDelete('item', item.id)}
                                  className="p-1.5 rounded bg-surface hover:bg-error/15 text-text-secondary hover:text-error transition"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="flex flex-col gap-6">
              {/* Category Search bar */}
              <div className="glass rounded-xl p-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition"
                  />
                </div>
              </div>

              {/* Categories Grid/Table */}
              <div className="glass rounded-2xl overflow-hidden border border-border">
                {filteredCategories.length === 0 ? (
                  <div className="p-12 text-center text-text-muted">
                    <LayoutGrid className="w-10 h-10 mx-auto opacity-30 mb-3" />
                    <p>No categories found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-text-secondary text-left font-medium">
                          <th className="py-4 px-6">Category Name</th>
                          <th className="py-4 px-6">Description</th>
                          <th className="py-4 px-6">Sort Order</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredCategories.map((cat) => (
                          <tr key={cat.id} className="hover:bg-surface-hover/30 transition">
                            <td className="py-4 px-6 font-medium text-text-primary">
                              <div className="flex items-center gap-3">
                                {cat.image_url ? (
                                  <img 
                                    src={cat.image_url} 
                                    alt={cat.name} 
                                    className="w-9 h-9 rounded-lg object-cover border border-border"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center border border-border">
                                    <LayoutGrid className="w-4 h-4 text-text-muted" />
                                  </div>
                                )}
                                <span>{cat.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-text-secondary max-w-sm truncate">
                              {cat.description ?? '-'}
                            </td>
                            <td className="py-4 px-6 text-text-secondary">
                              {cat.sort_order}
                            </td>
                            <td className="py-4 px-6">
                              {cat.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success bg-opacity-10 text-success">
                                  <Eye className="w-3 h-3" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-text-muted/10 text-text-muted">
                                  <EyeOff className="w-3 h-3" /> Inactive
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openCategoryModal(cat)}
                                  className="p-1.5 rounded bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition"
                                  title="Edit Category"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => triggerDelete('category', cat.id)}
                                  className="p-1.5 rounded bg-surface hover:bg-error/15 text-text-secondary hover:text-error transition"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── ADD/EDIT CATEGORY MODAL ─── */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg overflow-hidden shadow-large">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-text-primary">
                {editCategory ? t('menuSetup.editCategory') : t('menuSetup.addCategory')}
              </h3>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="text-text-muted hover:text-text-primary text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-xs text-error">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Category Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Hot Beverages, Desserts"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Brief description of the category..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-3 h-10">
                    <button
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, is_active: !categoryForm.is_active })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        categoryForm.is_active ? 'bg-primary' : 'bg-surface-hover border border-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          categoryForm.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-text-secondary">
                      {categoryForm.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Image URL
                </label>
                <input
                  type="text"
                  value={categoryForm.image_url}
                  onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })}
                  placeholder="https://example.com/category-image.jpg"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition"
                />
              </div>

              <div className="flex gap-3 mt-4 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-sm font-medium text-text-secondary transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition shadow-soft flex items-center justify-center gap-2"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD/EDIT MENU ITEM MODAL ─── */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-xl overflow-hidden shadow-large">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-text-primary">
                {editItem ? t('menuSetup.editItem') : t('menuSetup.addItem')}
              </h3>
              <button 
                onClick={() => setShowItemModal(false)}
                className="text-text-muted hover:text-text-primary text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-xs text-error">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Category <span className="text-error">*</span>
                  </label>
                  <select
                    value={itemForm.menu_category_id}
                    onChange={(e) => setItemForm({ ...itemForm, menu_category_id: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary focus:outline-none focus:border-text-accent transition"
                  >
                    <option value={0} disabled>Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Item Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g. Espresso Single, Chocolate Cake"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Description details (allergens, ingredients list)..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Price <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Cost Price
                  </label>
                  <input
                    type="text"
                    value={itemForm.cost}
                    onChange={(e) => setItemForm({ ...itemForm, cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Preparation Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={itemForm.preparation_time_minutes}
                    onChange={(e) => setItemForm({ ...itemForm, preparation_time_minutes: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={itemForm.sort_order}
                    onChange={(e) => setItemForm({ ...itemForm, sort_order: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Track Stock Level
                  </label>
                  <div className="flex items-center gap-3 h-8">
                    <button
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, track_inventory: !itemForm.track_inventory })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        itemForm.track_inventory ? 'bg-primary' : 'bg-surface-hover border border-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          itemForm.track_inventory ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-text-secondary">
                      {itemForm.track_inventory ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-3 h-8">
                    <button
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, is_active: !itemForm.is_active })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        itemForm.is_active ? 'bg-primary' : 'bg-surface-hover border border-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          itemForm.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-text-secondary">
                      {itemForm.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Image URL
                </label>
                <input
                  type="text"
                  value={itemForm.image_url}
                  onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                  placeholder="https://example.com/menu-item-image.jpg"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary outline-none focus:border-text-accent transition"
                />
              </div>

              <div className="flex gap-3 mt-4 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-sm font-medium text-text-secondary transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition shadow-soft flex items-center justify-center gap-2"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DELETE DIALOG ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-sm overflow-hidden shadow-large p-6">
            <h4 className="font-display text-lg font-bold text-text-primary mb-2">
              Are you sure?
            </h4>
            <p className="text-sm text-text-secondary mb-6">
              {t('menuSetup.deleteConfirm')} This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-sm font-medium text-text-secondary transition"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-error hover:bg-error-dark text-white font-semibold text-sm transition flex items-center justify-center gap-1.5"
              >
                {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
