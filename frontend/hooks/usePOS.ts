import { useState, useCallback } from 'react';
import { ApiError, menuCategoriesApi, menuItemsApi, tablesApi, paymentMethodsApi } from '@/lib/api';
import type { MenuCategory, MenuItem, Table, PosPaymentMethod } from '@/types';

export function usePOS() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PosPaymentMethod[]>([]);
  
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setLoadingMenu(true);
    setLoadingTables(true);
    setError(null);

    try {
      const [tablesResponse, categoryResponse, itemResponse, paymentMethodsResponse] = await Promise.all([
        tablesApi.list(),
        menuCategoriesApi.list(),
        menuItemsApi.list({ active: true }),
        paymentMethodsApi.list(),
      ]);

      setTables(tablesResponse.data);
      setCategories(categoryResponse.data.filter((category) => category.is_active));
      setItems(itemResponse.data);
      setPaymentMethods(paymentMethodsResponse.data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to load POS data.');
    } finally {
      setLoadingMenu(false);
      setLoadingTables(false);
    }
  }, []);

  const refreshTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const response = await tablesApi.list();
      setTables(response.data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to refresh tables.');
    } finally {
      setLoadingTables(false);
    }
  }, []);

  return {
    // Data
    categories,
    items,
    tables,
    paymentMethods,
    setTables,
    
    // Loading states
    loadingMenu,
    loadingTables,
    error,
    
    // Actions
    loadInitialData,
    refreshTables,
    setError,
  };
}
