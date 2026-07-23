'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { ApiError, cashShiftsApi, ordersApi, tablesApi } from '@/lib/api';
import { usePOS } from '@/hooks/usePOS';
import { useTableOrders } from '@/hooks/useTableOrders';
import { TableGrid } from '@/components/pos/TableGrid';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { Receipt } from '@/components/pos/Receipt';
import { ArrowLeft, DollarSign, X, Receipt as ReceiptIcon, ShoppingCart } from 'lucide-react';
import type { CashShift, MenuItem, OrderItem, Order } from '@/types';
import { formatCurrency, toMoneyNumber } from '@/lib/money';
import { usePosSettings } from '@/contexts/PosSettingsContext';

// Laravel serializes camelCase relations as snake_case in JSON (order_items, not orderItems)
function getOrderItems(order: Order | null) {
  return order?.order_items ?? order?.orderItems ?? [];
}

export default function POSPage() {
  const t = useTranslations();
  const { can } = usePermissions();
  const { settings } = usePosSettings();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptTableNumber, setReceiptTableNumber] = useState<string | undefined>();
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [showOpenShiftDialog, setShowOpenShiftDialog] = useState(false);
  const [openingShift, setOpeningShift] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({ shift_name: 'Morning Shift', shift_taker: '', opening_cash: '500' });
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
    () => getOrderItems(tableOrders.activeOrder).reduce((sum, item) => sum + item.quantity, 0),
    [tableOrders.activeOrder],
  );

  useEffect(() => {
    if (!can('pos.view') || hasLoadedData.current) return;

    hasLoadedData.current = true;
    loadInitialData();
    cashShiftsApi.getCurrent()
      .then(({ data }) => setCurrentShift(data))
      .catch(() => setCurrentShift(null));
  }, [can, loadInitialData]);

  const handleOpenShift = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const shiftTaker = shiftForm.shift_taker.trim();
    if (!shiftTaker) {
      tableOrders.setError?.('Shift taker name is required.');
      return;
    }

    setOpeningShift(true);
    try {
      const { data } = await cashShiftsApi.open({
        opening_cash: toMoneyNumber(shiftForm.opening_cash),
        name: shiftForm.shift_name.trim(),
        shift_name: shiftForm.shift_name.trim(),
        shift_taker: shiftTaker,
      });
      setCurrentShift(data);
      setShowOpenShiftDialog(false);
      tableOrders.showNotice('Shift opened successfully');
    } catch (error) {
      tableOrders.setError?.(error instanceof ApiError ? error.message : 'Could not open shift.');
    } finally {
      setOpeningShift(false);
    }
  };

  const handleTableSelect = async (table: import('@/types').Table) => {
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
        const updatedOrder = { ...response.data, shiftId: currentShift?.id, shiftName: currentShift?.shift_name ?? currentShift?.name, shiftTaker: currentShift?.shift_taker };
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
        const paymentMethodObj = pos.paymentMethods.find((pm) => pm.code === paymentMethod);
        if (!paymentMethodObj) {
          throw new Error('Payment method not found');
        }
        
        const total = toMoneyNumber(tableOrders.activeOrder.total);
        
        await ordersApi.addPayment(tableOrders.activeOrder.id, {
          payment_method_id: paymentMethodObj.id,
          amount: total,
        });
        
        const response = await ordersApi.complete(tableOrders.activeOrder.id);
        const updatedOrder = { ...response.data, shiftId: currentShift?.id, shiftName: currentShift?.shift_name ?? currentShift?.name, shiftTaker: currentShift?.shift_taker };
        tableOrders.setActiveOrder(updatedOrder);
        
        // Update table status back to available
        await tablesApi.updateStatus(tableOrders.selectedTable.id, 'available');
        pos.setTables((prev) => 
          prev.map((t) => 
            t.id === tableOrders.selectedTable?.id ? { ...t, status: 'available', activeOrder: undefined } : t
          )
        );
        
        setReceiptOrder(updatedOrder);
        setReceiptTableNumber(tableOrders.selectedTable.number);
        tableOrders.showNotice(`Payment completed via ${paymentMethod === 'cash' ? 'Cash' : 'Visa/Card'}`);
        setShowReceipt(true);
        if (settings?.auto_print_receipt) {
          window.setTimeout(() => window.print(), 150);
        }
        tableOrders.backToTables();
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


  if (!currentShift) {
    return (
      <div className="flex min-h-[calc(100vh-116px)] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-soft">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <DollarSign className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Open Shift</h1>
          <p className="mt-2 text-text-muted">Open a cashier shift before creating POS orders.</p>
          {tableOrders.error && <p className="mt-4 rounded-lg bg-error/10 p-3 text-sm text-error">{tableOrders.error}</p>}
          <button onClick={() => setShowOpenShiftDialog(true)} className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-medium transition hover:bg-primary/90">Open Shift</button>
        </div>
        {showOpenShiftDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form onSubmit={handleOpenShift} className="w-full max-w-md space-y-4 rounded-2xl bg-surface p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-text-primary">Open Shift</h2>
              <label className="block text-sm font-medium text-text-secondary">Shift Name<input value={shiftForm.shift_name} onChange={(event) => setShiftForm({ ...shiftForm, shift_name: event.target.value })} className="mt-2 w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none focus:border-text-accent" /></label>
              <label className="block text-sm font-medium text-text-secondary">Shift Taker Name<input required value={shiftForm.shift_taker} onChange={(event) => setShiftForm({ ...shiftForm, shift_taker: event.target.value })} className="mt-2 w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none focus:border-text-accent" placeholder="Ahmed Mohamed" /></label>
              <label className="block text-sm font-medium text-text-secondary">Opening Cash<input required type="number" min="0" step="0.01" value={shiftForm.opening_cash} onChange={(event) => setShiftForm({ ...shiftForm, opening_cash: event.target.value })} className="mt-2 w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none focus:border-text-accent" /></label>
              <div className="flex gap-3"><button type="button" onClick={() => setShowOpenShiftDialog(false)} className="flex-1 rounded-xl border border-border py-3 font-semibold text-text-secondary">Cancel</button><button disabled={openingShift} className="flex-1 rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60">{openingShift ? 'Opening...' : 'Open Shift'}</button></div>
            </form>
          </div>
        )}
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
          <div className="hidden lg:block lg:w-[420px]">
            <CartPanel
              order={tableOrders.activeOrder}
              loading={tableOrders.loadingOrder}
              savingItemId={tableOrders.busyItemId}
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveItem}
              onClearOrder={handleClearOrder}
              onCheckout={handleCheckout}
            />
          </div>
        )}
      </div>

      {tableOrders.selectedTable && (
        <button
          type="button"
          onClick={() => setCartDrawerOpen(true)}
          className="fixed bottom-5 right-5 z-30 flex min-h-12 items-center gap-3 rounded-full bg-primary px-5 py-3 font-semibold text-white shadow-2xl lg:hidden"
          aria-label={t('pos.cartDrawerToggle')}
        >
          <ShoppingCart className="h-5 w-5" />
          <span>{itemCount}</span>
          <span>{formatCurrency(tableOrders.activeOrder?.total)}</span>
        </button>
      )}

      {tableOrders.selectedTable && cartDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setCartDrawerOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 h-[86vh] overflow-hidden rounded-t-3xl bg-surface shadow-2xl animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-center border-b border-border py-2">
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="h-1.5 w-14 rounded-full bg-text-muted/40"
                aria-label="Close cart drawer"
              />
            </div>
            <CartPanel
              order={tableOrders.activeOrder}
              loading={tableOrders.loadingOrder}
              savingItemId={tableOrders.busyItemId}
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveItem}
              onClearOrder={handleClearOrder}
              onCheckout={(method) => {
                setCartDrawerOpen(false);
                handleCheckout(method);
              }}
            />
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (receiptOrder || tableOrders.activeOrder) && (
        <Receipt
          order={receiptOrder || tableOrders.activeOrder}
          tableNumber={receiptTableNumber || tableOrders.selectedTable?.number}
          onClose={() => { setShowReceipt(false); setReceiptOrder(null); }}
          onPrint={() => {
            window.print();
            setShowReceipt(false);
          }}
        />
      )}
    </div>
  );
}
