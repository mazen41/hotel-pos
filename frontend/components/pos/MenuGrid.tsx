'use client';

import { useState, memo } from 'react';
import type { MenuCategory, MenuItem } from '@/types';
import { Search, UtensilsCrossed } from 'lucide-react';
import { formatCurrency } from '@/lib/money';

interface MenuGridProps {
  categories: MenuCategory[];
  items: MenuItem[]; // Now expects already filtered items
  selectedCategory: number | null;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  busyItemId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  onSearchChange: (query: string) => void;
  onItemClick: (item: MenuItem) => void;
}

export const MenuGrid = memo(function MenuGrid({
  categories,
  items,
  selectedCategory,
  searchQuery,
  loading,
  error,
  busyItemId,
  onSelectCategory,
  onSearchChange,
  onItemClick,
}: MenuGridProps) {
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);

  const handleItemClick = (item: MenuItem) => {
    setLastAddedId(item.id);
    window.setTimeout(() => setLastAddedId((current) => (current === item.id ? null : current)), 700);
    onItemClick(item);
  };

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Menu</h2>
          <p className="text-sm text-text-muted">Tap an item to add it to the active order.</p>
        </div>

        <label className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search products"
            className="h-11 w-full rounded-lg border border-border bg-surface px-10 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => onSelectCategory(null)}
          className={`h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition ${
            selectedCategory === null
              ? 'bg-primary text-white shadow-medium'
              : 'bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition ${
              selectedCategory === category.id
                ? 'bg-primary text-white shadow-medium'
                : 'bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-lg bg-surface" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface/60 p-8 text-center">
            <UtensilsCrossed className="mb-3 h-10 w-10 text-text-muted" />
            <p className="font-medium text-text-primary">No products found</p>
            <p className="mt-1 text-sm text-text-muted">Try another category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {items.map((item) => {
              const isBusy = busyItemId === item.id;
              const wasAdded = lastAddedId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={isBusy}
                  className={`group flex min-h-40 flex-col justify-between rounded-lg border bg-surface p-4 text-left shadow-sm transition-all duration-200 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 ${
                    wasAdded
                      ? 'border-success bg-success/10 ring-2 ring-success/25 shadow-success/20'
                      : 'border-border hover:border-primary/50 hover:bg-surface-hover hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary">
                        {item.name}
                      </h3>
                      <span className="shrink-0 rounded-md bg-background px-2 py-1 text-xs font-semibold text-text-accent">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="line-clamp-3 text-xs leading-relaxed text-text-muted">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="rounded-md bg-background px-2 py-1 text-text-muted">
                      {item.preparation_time_minutes || 0} min
                    </span>
                    <span className={`font-semibold ${wasAdded ? 'text-success' : 'text-primary'}`}>
                      {isBusy ? 'Adding...' : wasAdded ? '✓ Added' : 'Tap to add'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
});
