import { useState, useCallback } from 'react';
import { ApiError, tablesApi, ordersApi } from '@/lib/api';
import type { Table, Order, OrderItem, MenuItem } from '@/types';

export function useTableOrders() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeOrder, setActiveOrderState] = useState<Order | null>(null);
  const [tableOrders, setTableOrders] = useState<Map<number, Order>>(new Map());
  
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectTable = useCallback(async (table: Table) => {
    setLoadingOrder(true);
    setError(null);

    try {
      // Check if we already have this table's order in memory
      if (tableOrders.has(table.id)) {
        const existingOrder = tableOrders.get(table.id)!;
        setActiveOrderState(existingOrder);
        setSelectedTable(table);
        setLoadingOrder(false);
        return { order: existingOrder, table };
      }

      // Get or create order for this table
      const response = await tablesApi.getOrCreateOrder(table.id);
      const order = response.data;
      
      // Store in memory
      setTableOrders((prev) => new Map(prev).set(table.id, order));
      setActiveOrderState(order);
      setSelectedTable(table);
      
      return { order, table };
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not open table.');
      throw caught;
    } finally {
      setLoadingOrder(false);
    }
  }, [tableOrders]);

  const addItemToOrder = useCallback(async (item: MenuItem, order: Order, table: Table) => {
    setBusyItemId(item.id);
    setError(null);

    try {
      const existingItem = order.order_items?.find((orderItem) => orderItem.menu_item_id === item.id);

      if (existingItem) {
        const response = await ordersApi.updateItem(order.id, existingItem.id, {
          quantity: existingItem.quantity + 1,
        });
        const updatedOrder = response.data;
        setActiveOrderState(updatedOrder);
        setTableOrders((prev) => new Map(prev).set(table.id, updatedOrder));
        return updatedOrder;
      } else {
        const response = await ordersApi.addItem(order.id, {
          menu_item_id: item.id,
          quantity: 1,
        });
        const updatedOrder = response.data;
        setActiveOrderState(updatedOrder);
        setTableOrders((prev) => new Map(prev).set(table.id, updatedOrder));
        return updatedOrder;
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not add item to the order.');
      throw caught;
    } finally {
      setBusyItemId(null);
    }
  }, []);

  const updateItemQuantity = useCallback(async (item: OrderItem, quantity: number, order: Order, table: Table) => {
    if (quantity <= 0) {
      return removeItemFromOrder(item, order, table);
    }

    setBusyItemId(item.id);
    setError(null);

    try {
      const response = await ordersApi.updateItem(order.id, item.id, { quantity });
      const updatedOrder = response.data;
      setActiveOrderState(updatedOrder);
      setTableOrders((prev) => new Map(prev).set(table.id, updatedOrder));
      return updatedOrder;
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not update item quantity.');
      throw caught;
    } finally {
      setBusyItemId(null);
    }
  }, []);

  const removeItemFromOrder = useCallback(async (item: OrderItem, order: Order, table: Table) => {
    setBusyItemId(item.id);
    setError(null);

    try {
      const response = await ordersApi.deleteItem(order.id, item.id);
      const updatedOrder = response.data;
      setActiveOrderState(updatedOrder);
      setTableOrders((prev) => new Map(prev).set(table.id, updatedOrder));
      return updatedOrder;
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not remove item.');
      throw caught;
    } finally {
      setBusyItemId(null);
    }
  }, []);

  const clearOrder = useCallback(async (order: Order, table: Table) => {
    setLoadingOrder(true);
    setError(null);

    try {
      await ordersApi.delete(order.id);
      setActiveOrderState(null);
      setTableOrders((prev) => {
        const newMap = new Map(prev);
        newMap.delete(table.id);
        return newMap;
      });
      
      // Update table status back to available
      await tablesApi.updateStatus(table.id, 'available');
      
      setSelectedTable(null);
      return true;
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not clear the order.');
      throw caught;
    } finally {
      setLoadingOrder(false);
    }
  }, []);

  const backToTables = useCallback(() => {
    setSelectedTable(null);
    setActiveOrderState(null);
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2000);
  }, []);

  const updateActiveOrder = useCallback((order: Order | null) => {
    setActiveOrderState(order);
  }, []);

  return {
    // State
    selectedTable,
    activeOrder,
    setActiveOrder: updateActiveOrder,
    tableOrders,
    loadingOrder,
    busyItemId,
    error,
    notice,
    
    // Actions
    selectTable,
    addItemToOrder,
    updateItemQuantity,
    removeItemFromOrder,
    clearOrder,
    backToTables,
    showNotice,
    setError,
  };
}
