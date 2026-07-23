'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { ApiError, ordersApi, tablesApi } from '@/lib/api';
import { usePOS } from '@/hooks/usePOS';
import { useTableOrders } from '@/hooks/useTableOrders';
import { TableGrid } from '@/components/pos/TableGrid';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { Receipt } from '@/components/pos/Receipt';
import { ArrowLeft, X, Receipt as ReceiptIcon } from 'lucide-react';
import type { MenuItem, OrderItem, Order } from '@/types';

// Laravel serializes camelCase relations as snake_case in JSON (order_items, not orderItems)
function getOrderItems(order: Order | null) {
  return order?.order_items ?? order?.orderItems ?? [];
}

export default function POSPage() {
  const t = useTranslations();
  const { can } = usePermissions();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const hasLoadedData = useRef(false);

  // Custom hooks for better organization
  const pos = usePOS();
  const { loadInitialData } = pos;
  const tableOrders = useTableOrders();

  // Memoized filtered items for performance
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return pos.items.filter((item) => {
      const matchesCategory = selectedCategory ? item.menu_category_id === selectedCategory : true;
      const matchesSearch = query
        ? `${item.name} ${item.description ?? ''}`.toLowerCase().includes(query)
        : true;
      return matchesCategory && matchesSearch;
    });
  }, [pos.items, searchQuery, selectedCategory]);

  const itemCount = useMemo(
    () => getOrderItems(tableOrders.activeOrder).reduce((sum: number, item: any) => sum + item.quantity, 0),
    [tableOrders.activeOrder],
  );

  useEffect(() => {
    if (!can('pos.view') || hasLoadedData.current) return;

    hasLoadedData.current = true;
    loadInitialData();
  }, [can, loadInitialData]);

  const handleTableSelect = async (table: any) => {
    try {
      const { order } = await tableOrders.selectTable(table);
      
      // Update tables list to reflect new order
      pos.setTables((prev) => 
        prev.map((t) => 
          t.id === table.id ? { ...t, activeOrder: order } : t
        )
      );
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleBackToTables = () => {
    tableOrders.backToTables();
  };

  const handleItemClick = async (item: MenuItem) => {
    if (!tableOrders.activeOrder || !tableOrders.selectedTable) return;

    try {
      await tableOrders.addItemToOrder(item, tableOrders.activeOrder, tableOrders.selectedTable);
      tableOrders.showNotice(`${item.name} added to ${tableOrders.selectedTable.name ?? tableOrders.selectedTable.number}`);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleQuantityChange = async (item: OrderItem, quantity: number) => {
    if (!tableOrders.activeOrder || !tableOrders.selectedTable) return;

    try {
      await tableOrders.updateItemQuantity(item, quantity, tableOrders.activeOrder, tableOrders.selectedTable);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleRemoveItem = async (item: OrderItem) => {
    if (!tableOrders.activeOrder || !tableOrders.selectedTable) return;

    try {
      await tableOrders.removeItemFromOrder(item, tableOrders.activeOrder, tableOrders.selectedTable);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleClearOrder = async () => {
    if (!tableOrders.activeOrder || !tableOrders.selectedTable) return;

    try {
      await tableOrders.clearOrder(tableOrders.activeOrder, tableOrders.selectedTable);
      
      // Update table status in the tables list
      pos.setTables((prev) => 
        prev.map((t) => 
          t.id === tableOrders.selectedTable?.id ? { ...t, status: 'available', activeOrder: undefined } : t
        )
      );
      
      tableOrders.showNotice('Order cleared');
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'guest') => {
    if (!tableOrders.activeOrder || !tableOrders.selectedTable) return;

    try {
      if (paymentMethod === 'guest') {
        // Mark as pending payment
        const response = await ordersApi.update(tableOrders.activeOrder.id, {
          status: 'pending_payment',
        });
        const updatedOrder = response.data;
        tableOrders.setActiveOrder(updatedOrder);
        
        // Update table status
        await tablesApi.updateStatus(tableOrders.selectedTable.id, 'pending_payment');
        pos.setTables((prev) => 
          prev.map((t) => 
            t.id === tableOrders.selectedTable?.id ? { ...t, status: 'pending_payment' } : t
          )
        );
        
        tableOrders.backToTables();
        tableOrders.showNotice('Order saved as pending payment');
      } else {
        // Complete the order with payment
        const paymentMethodObj = pos.paymentMethods.find((pm: any) => pm.code === paymentMethod);
        if (!paymentMethodObj) {
          throw new Error('Payment method not found');
        }
        
        const total = Number(tableOrders.activeOrder.total);
        
        await ordersApi.addPayment(tableOrders.activeOrder.id, {
          payment_method_id: paymentMethodObj.id,
          amount: total,
        });
        
        const response = await ordersApi.complete(tableOrders.activeOrder.id);
        const updatedOrder = response.data;
        tableOrders.setActiveOrder(updatedOrder);
        
        // Update table status back to available
        await tablesApi.updateStatus(tableOrders.selectedTable.id, 'available');
        pos.setTables((prev) => 
          prev.map((t) => 
            t.id === tableOrders.selectedTable?.id ? { ...t, status: 'available', activeOrder: undefined } : t
          )
        );
        
        tableOrders.backToTables();
        tableOrders.showNotice(`Payment completed via ${paymentMethod === 'cash' ? 'Cash' : 'Visa/Card'}`);
      }
    } catch (error) {
      tableOrders.setError?.(error instanceof ApiError ? error.message : 'Could not complete payment.');
    }
  };

  if (!can('pos.view')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-muted">{t('errors.noPermission')}</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh-116px)] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-soft">
      {/* Header */}
      <div className="border-b border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tableOrders.selectedTable && (
              <button
                onClick={handleBackToTables}
                className="rounded-lg p-2 text-text-secondary transition-all duration-200 hover:bg-surface-hover hover:text-text-primary hover:shadow-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                {tableOrders.selectedTable ? `${tableOrders.selectedTable.name ?? tableOrders.selectedTable.number} - Order` : 'Table Selection'}
              </h1>
              <p className="text-sm text-text-muted">
                {tableOrders.selectedTable 
                  ? `Table ${tableOrders.selectedTable.number} • ${itemCount} items`
                  : 'Select a table to start an order'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tableOrders.selectedTable && tableOrders.activeOrder && (
              <button
                onClick={() => setShowReceipt(true)}
                className="rounded-lg p-2 text-text-secondary transition-all duration-200 hover:bg-surface-hover hover:text-text-primary hover:shadow-md"
                title="View receipt"
              >
                <ReceiptIcon className="h-5 w-5" />
              </button>
            )}
            {tableOrders.selectedTable && (
              <button
                onClick={handleBackToTables}
                className="rounded-lg p-2 text-text-secondary transition-all duration-200 hover:bg-surface-hover hover:text-text-primary hover:shadow-md"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {tableOrders.notice && (
        <div className="absolute right-5 top-20 z-20 rounded-lg border border-success/30 bg-success px-4 py-2 text-sm font-semibold text-white shadow-medium">
          {tableOrders.notice}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Main Content Area */}
        <main className="min-h-0 flex-1 p-4 lg:p-6">
          {!tableOrders.selectedTable ? (
            <TableGrid
              tables={pos.tables}
              loading={pos.loadingTables}
              error={pos.error}
              onTableSelect={handleTableSelect}
            />
          ) : (
            <MenuGrid
              categories={pos.categories}
              items={filteredItems}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              loading={pos.loadingMenu}
              error={pos.error}
              busyItemId={tableOrders.busyItemId}
              onSelectCategory={setSelectedCategory}
              onSearchChange={setSearchQuery}
              onItemClick={handleItemClick}
            />
          )}
        </main>

        {/* Cart Panel - Only show when table is selected */}
        {tableOrders.selectedTable && (
          <CartPanel
            order={tableOrders.activeOrder}
            loading={tableOrders.loadingOrder}
            savingItemId={tableOrders.busyItemId}
            onQuantityChange={handleQuantityChange}
            onRemoveItem={handleRemoveItem}
            onClearOrder={handleClearOrder}
            onCheckout={handleCheckout}
          />
        )}
      </div>

      {/* Receipt Modal */}
      {showReceipt && tableOrders.activeOrder && tableOrders.selectedTable && (
        <Receipt
          order={tableOrders.activeOrder}
          tableNumber={tableOrders.selectedTable.number}
          onClose={() => setShowReceipt(false)}
          onPrint={() => {
            window.print();
            setShowReceipt(false);
          }}
        />
      )}
    </div>
  );
}
