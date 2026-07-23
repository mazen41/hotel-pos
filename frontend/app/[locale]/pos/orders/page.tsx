'use client';

import type { ReactNode } from 'react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { ApiError, menuItemsApi, ordersApi } from '@/lib/api';
import { Receipt } from '@/components/pos/Receipt';
import { formatCurrency, toMoneyNumber } from '@/lib/money';
import type { MenuItem, Order, OrderItem } from '@/types';
import { Edit3, Printer, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';

type OrderStatus = Order['status'];
interface EditableOrderItem { id: number; menu_item_id: number; name: string; quantity: number; notes: string; unit_price: number; }
interface EditState { order: Order; notes: string; discount: string; tax: string; status: OrderStatus; items: EditableOrderItem[]; newMenuItemId: string; }

function getOrderItems(order: Order): OrderItem[] {
  return order.order_items ?? order.orderItems ?? [];
}

export default function OrdersPage() {
  const locale = useLocale();
  const { can } = usePermissions();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  const isRtl = locale.startsWith('ar');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersResponse, menuResponse] = await Promise.all([
        ordersApi.list({ per_page: 100 }),
        menuItemsApi.list({ active: true }),
      ]);
      setOrders(ordersResponse.data);
      setMenuItems(menuResponse.data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (can('pos.view_orders') || can('pos.view')) loadOrders();
  }, [can, loadOrders]);

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return orders;
    return orders.filter((order) => `${order.order_number} ${order.table_number ?? ''} ${order.user?.name ?? ''}`.toLowerCase().includes(normalized));
  }, [orders, query]);

  const beginEdit = (order: Order) => {
    setEditState({
      order,
      notes: order.notes ?? '',
      discount: String(toMoneyNumber(order.discount_amount)),
      tax: String(toMoneyNumber(order.tax_amount)),
      status: order.status,
      newMenuItemId: '',
      items: getOrderItems(order).map((item) => ({
        id: item.id,
        menu_item_id: item.menu_item_id,
        name: item.menuItem?.name ?? `Item #${item.menu_item_id}`,
        quantity: item.quantity,
        notes: item.notes ?? '',
        unit_price: toMoneyNumber(item.unit_price),
      })),
    });
  };

  const saveOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editState) return;
    if (editState.items.some((item) => item.quantity < 1 || !Number.isInteger(item.quantity))) {
      setError('Quantities must be whole numbers greater than zero.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const existingIds = new Set(getOrderItems(editState.order).map((item) => item.id));
      const editedIds = new Set(editState.items.filter((item) => item.id > 0).map((item) => item.id));

      for (const item of getOrderItems(editState.order)) {
        if (!editedIds.has(item.id)) await ordersApi.deleteItem(editState.order.id, item.id);
      }

      for (const item of editState.items) {
        if (existingIds.has(item.id)) {
          await ordersApi.updateItem(editState.order.id, item.id, { quantity: item.quantity, notes: item.notes.trim() || undefined });
        } else {
          await ordersApi.addItem(editState.order.id, { menu_item_id: item.menu_item_id, quantity: item.quantity, notes: item.notes.trim() || undefined });
        }
      }

      const response = await ordersApi.update(editState.order.id, {
        notes: editState.notes.trim() || undefined,
        discount_amount: toMoneyNumber(editState.discount),
        tax_amount: toMoneyNumber(editState.tax),
        status: editState.status,
      });
      setOrders((previous) => previous.map((order) => (order.id === response.data.id ? response.data : order)));
      setEditState(null);
      setNotice('Order saved successfully. Inventory was preserved through order item update APIs.');
      await loadOrders();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not save order.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteOrder) return;
    setSaving(true);
    try {
      await ordersApi.delete(deleteOrder.id);
      setNotice('Order deleted successfully.');
      setDeleteOrder(null);
      await loadOrders();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not delete order.');
    } finally {
      setSaving(false);
    }
  };

  const addEditItem = () => {
    if (!editState || !editState.newMenuItemId) return;
    const menuItem = menuItems.find((item) => item.id === Number(editState.newMenuItemId));
    if (!menuItem) return;
    setEditState({
      ...editState,
      newMenuItemId: '',
      items: [...editState.items, { id: -Date.now(), menu_item_id: menuItem.id, name: menuItem.name, quantity: 1, notes: '', unit_price: toMoneyNumber(menuItem.price) }],
    });
  };

  const print = async (order: Order) => {
    setPrintOrder(order);
    window.setTimeout(() => window.print(), 150);
  };

  if (!can('pos.view_orders') && !can('pos.view')) {
    return <div className="flex min-h-screen items-center justify-center text-text-muted">You do not have permission to view orders.</div>;
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div><h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Orders</h1><p className="text-text-muted">Review, edit, delete, and print POS orders.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-text-primary outline-none focus:border-text-accent sm:w-80" placeholder="Search orders" /></label><button onClick={loadOrders} className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 font-semibold text-text-secondary hover:bg-surface-hover"><RefreshCw className="h-4 w-4" />Refresh</button></div>
        </div>

        {(notice || error) && <div className={`rounded-xl border p-4 text-sm ${error ? 'border-error/30 bg-error/10 text-error' : 'border-success/30 bg-success/10 text-success'}`}>{error ?? notice}</div>}

        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
          <div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr_1.4fr] gap-4 border-b border-border bg-surface-elevated p-4 text-sm font-semibold text-text-secondary lg:grid"><span>Order</span><span>Status</span><span>Total</span><span>Table</span><span className="text-right">Actions</span></div>
          {loading ? <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-background" />)}</div> : filteredOrders.length === 0 ? <div className="p-12 text-center text-text-muted">No orders found.</div> : filteredOrders.map((order) => (
            <article key={order.id} className="grid gap-3 border-b border-border p-4 last:border-0 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.4fr] lg:items-center">
              <div><p className="font-semibold text-text-primary">#{order.order_number}</p><p className="text-sm text-text-muted">{new Date(order.created_at).toLocaleString()}</p></div>
              <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">{order.status.replace('_', ' ')}</span>
              <p className="font-display text-lg font-bold text-text-accent">{formatCurrency(order.total, locale)}</p>
              <p className="text-text-secondary">{order.table_number ?? 'Takeaway'}</p>
              <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                {can('pos.edit_orders') && <button onClick={() => beginEdit(order)} className="action"><Edit3 className="h-4 w-4" />Edit</button>}
                {can('pos.print_receipts') && <button onClick={() => print(order)} className="action"><Printer className="h-4 w-4" />Print</button>}
                {can('pos.delete_orders') && <button onClick={() => setDeleteOrder(order)} className="action-danger"><Trash2 className="h-4 w-4" />Delete</button>}
              </div>
            </article>
          ))}
        </div>
      </div>

      {deleteOrder && <Modal title="Delete Order" onClose={() => setDeleteOrder(null)}><p className="text-text-secondary">Delete order #{deleteOrder.order_number}? This action will use the backend delete behavior (soft delete when supported, otherwise hard delete).</p><div className="mt-6 flex gap-3"><button onClick={() => setDeleteOrder(null)} className="btn-secondary">Cancel</button><button disabled={saving} onClick={confirmDelete} className="btn-danger">Delete</button></div></Modal>}

      {editState && <Modal title={`Edit Order #${editState.order.order_number}`} onClose={() => setEditState(null)} wide><form onSubmit={saveOrder} className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Field label="Discount"><input type="number" min="0" step="0.01" value={editState.discount} onChange={(event) => setEditState({ ...editState, discount: event.target.value })} className="field" /></Field><Field label="Taxes"><input type="number" min="0" step="0.01" value={editState.tax} onChange={(event) => setEditState({ ...editState, tax: event.target.value })} className="field" /></Field><Field label="Payment Status"><select value={editState.status} onChange={(event) => setEditState({ ...editState, status: event.target.value as OrderStatus })} className="field"><option value="pending">Pending</option><option value="processing">Processing</option><option value="pending_payment">Pending Payment</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option></select></Field></div><Field label="Notes"><textarea value={editState.notes} onChange={(event) => setEditState({ ...editState, notes: event.target.value })} className="field min-h-24 resize-none" /></Field><div className="space-y-3"><div className="flex flex-col gap-2 sm:flex-row"><select value={editState.newMenuItemId} onChange={(event) => setEditState({ ...editState, newMenuItemId: event.target.value })} className="field"><option value="">Add product...</option>{menuItems.map((item) => <option key={item.id} value={item.id}>{item.name} - {formatCurrency(item.price, locale)}</option>)}</select><button type="button" onClick={addEditItem} className="btn-secondary">Add Product</button></div>{editState.items.map((item, index) => <div key={`${item.id}-${index}`} className="grid gap-3 rounded-xl border border-border bg-surface-elevated p-3 sm:grid-cols-[1fr_110px_1fr_auto]"><div><p className="font-semibold text-text-primary">{item.name}</p><p className="text-sm text-text-muted">{formatCurrency(item.unit_price, locale)}</p></div><input type="number" min="1" step="1" value={item.quantity} onChange={(event) => setEditState({ ...editState, items: editState.items.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, quantity: Number.parseInt(event.target.value, 10) || 1 } : candidate) })} className="field" /><input value={item.notes} onChange={(event) => setEditState({ ...editState, items: editState.items.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, notes: event.target.value } : candidate) })} className="field" placeholder="Item notes" /><button type="button" onClick={() => setEditState({ ...editState, items: editState.items.filter((_, candidateIndex) => candidateIndex !== index) })} className="rounded-lg p-3 text-error hover:bg-error/10"><X className="h-5 w-5" /></button></div>)}</div><button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Order'}</button></form></Modal>}

      {printOrder && <Receipt order={printOrder} tableNumber={printOrder.table_number ?? undefined} onClose={() => setPrintOrder(null)} onPrint={() => window.print()} />}
    </div>
  );
}

function Modal({ title, children, onClose, wide }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-md'}`}><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-text-primary">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-surface-hover"><X className="h-5 w-5" /></button></div>{children}</div></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-medium text-text-secondary">{label}</span>{children}</label>; }
