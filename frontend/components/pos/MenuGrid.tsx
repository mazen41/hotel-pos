'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { menuCategoriesApi, menuItemsApi } from '@/lib/api';
import type { MenuCategory, MenuItem } from '@/types';
import { Plus } from 'lucide-react';

export function MenuGrid() {
  const t = useTranslations();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadItems();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await menuCategoriesApi.list();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const { data } = await menuItemsApi.list({ active: true });
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  const filteredItems = selectedCategory
    ? items.filter(item => item.menu_category_id === selectedCategory)
    : items;

  const addToCart = (item: MenuItem) => {
    // This will be connected to cart context later
    console.log('Add to cart:', item);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-primary text-white shadow-medium'
                : 'bg-surface text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => addToCart(item)}
            className="group relative bg-surface rounded-xl overflow-hidden hover:shadow-medium transition-all hover:scale-105"
          >
            {item.image_url && (
              <div className="aspect-video bg-surface-elevated">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-4">
              <h3 className="font-medium text-text-primary mb-1">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-text-muted mb-2 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold text-text-accent">
                  ${(item.price).toFixed(2)}
                </span>
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}