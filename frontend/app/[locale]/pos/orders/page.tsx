'use client';

import type { ReactNode } from 'react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { ApiError, menuItemsApi, ordersApi } from '@/lib/api';
import { Receipt } from '@/components/pos/Receipt';
import { formatCurrency, toMoneyNumber } from '@/lib/money';
import type { MenuItem, Order, OrderItem } from '@/types';
import {
  Edit3,
  Printer,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
  Utensils,
  Bed,
  ShoppingBag,
  Clock,
  User,
  Calendar,
  Layers,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  DollarSign,
  HelpCircle
} from 'lucide-react';

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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

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

  // Statistics calculation
  const stats = useMemo(() => {
    let totalCount = 0;
    let totalSalesVal = 0;
    let dineInCount = 0;
    let dineInSales = 0;
    let roomCount = 0;
    let roomSales = 0;
    let takeawayCount = 0;
    let takeawaySales = 0;

    orders.forEach((order) => {
      // Exclude cancelled orders from total active sales if needed, but show gross activity
      const amount = toMoneyNumber(order.total);
      if (order.status !== 'cancelled') {
        totalSalesVal += amount;
      }
      totalCount++;

      if (order.order_type === 'dine_in') {
        dineInCount++;
        if (order.status !== 'cancelled') dineInSales += amount;
      } else if (order.order_type === 'room_service') {
        roomCount++;
        if (order.status !== 'cancelled') roomSales += amount;
      } else if (order.order_type === 'takeaway') {
        takeawayCount++;
        if (order.status !== 'cancelled') takeawaySales += amount;
      }
    });

    return {
      totalCount,
      totalSalesVal,
      dineInCount,
      dineInSales,
      roomCount,
      roomSales,
      takeawayCount,
      takeawaySales,
    };
  }, [orders]);

  // Filter logic
  const filteredOrders = useMemo(() => {
    let result = orders;
    const normalized = query.trim().toLowerCase();

    if (normalized) {
      result = result.filter((order) =>
        `${order.order_number} ${order.table_number ?? ''} ${order.guest_name ?? ''} ${order.guest_room ?? ''} ${order.user?.name ?? ''}`
          .toLowerCase()
          .includes(normalized)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((order) => order.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((order) => order.order_type === typeFilter);
    }

    return result;
  }, [orders, query, statusFilter, typeFilter]);

  // Handle active selection fallback
  const activeOrder = useMemo(() => {
    const found = filteredOrders.find((o) => o.id === selectedOrderId);
    return found || filteredOrders[0] || null;
  }, [filteredOrders, selectedOrderId]);

  const selectOrder = (id: number) => {
    setSelectedOrderId(id);
    setMobileView('detail');
  };

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
      setNotice('Order saved successfully. Inventory was preserved.');
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

  function getStatusBadge(status: OrderStatus) {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 dark:text-yellow-400 dark:border-yellow-500/20',
      processing: 'bg-blue-500/10 text-blue-500 border-blue-500/30 dark:text-blue-400 dark:border-blue-500/20',
      pending_payment: 'bg-accent/15 text-accent border-accent/30 dark:text-accent dark:border-accent/20',
      completed: 'bg-primary/10 text-primary border-primary/30 dark:text-primary dark:border-primary/20',
      cancelled: 'bg-error/10 text-error border-error/30 dark:text-error dark:border-error/20',
      refunded: 'bg-purple-500/10 text-purple-500 border-purple-500/30 dark:text-purple-400 dark:border-purple-500/20'
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide ${styles[status] ?? 'bg-surface-elevated text-text-secondary border-border'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  }

  function getOrderTypeBadge(type: Order['order_type']) {
    const types = {
      dine_in: { icon: Utensils, label: 'Dine-In', color: 'text-accent bg-accent/10 border-accent/20' },
      room_service: { icon: Bed, label: 'Room Service', color: 'text-primary bg-primary/10 border-primary/20' },
      takeaway: { icon: ShoppingBag, label: 'Takeaway', color: 'text-info bg-info/10 border-info/20' }
    };
    const config = types[type] || { icon: HelpCircle, label: type, color: 'text-text-muted bg-surface-elevated border-border' };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${config.color}`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </span>
    );
  }

  if (!can('pos.view_orders') && !can('pos.view')) {
    return <div className="flex min-h-screen items-center justify-center text-text-muted">You do not have permission to view orders.</div>;
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background p-3 sm:p-6 animate-fade-in">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Orders Directory</h1>
            <p className="text-text-muted text-sm mt-1">Real-time shift orders, table tracking, guest folio charges, and receipts.</p>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
              <input 
                value={query} 
                onChange={(event) => setQuery(event.target.value)} 
                className="w-full rounded-xl border border-border bg-surface py-3 pl-9 pr-4 text-sm text-text-primary outline-none focus:border-accent sm:w-80 shadow-soft" 
                placeholder="Search by order #, table, room, guest..." 
              />
            </label>
            <button onClick={loadOrders} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-surface-hover shadow-soft transition-all">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {(notice || error) && (
          <div className={`rounded-xl border p-4 text-sm animate-fade-in ${error ? 'border-error/30 bg-error/10 text-error' : 'border-primary/30 bg-primary/10 text-primary'}`}>
            {error ?? notice}
          </div>
        )}

        {/* ── Statistics Dashboard Row ────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-4 premium-shadow flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Total Net Sales</p>
              <h3 className="text-xl font-bold text-text-accent font-display mt-1">{formatCurrency(stats.totalSalesVal, locale)}</h3>
              <p className="text-[10px] text-text-muted mt-0.5">{stats.totalCount} total orders</p>
            </div>
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 premium-shadow flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Dine-In Sales</p>
              <h3 className="text-xl font-bold text-text-primary mt-1">{formatCurrency(stats.dineInSales, locale)}</h3>
              <p className="text-[10px] text-text-muted mt-0.5">{stats.dineInCount} orders</p>
            </div>
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Utensils className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 premium-shadow flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Room Service</p>
              <h3 className="text-xl font-bold text-text-primary mt-1">{formatCurrency(stats.roomSales, locale)}</h3>
              <p className="text-[10px] text-text-muted mt-0.5">{stats.roomCount} orders</p>
            </div>
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bed className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 premium-shadow flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Takeaway</p>
              <h3 className="text-xl font-bold text-text-primary mt-1">{formatCurrency(stats.takeawaySales, locale)}</h3>
              <p className="text-[10px] text-text-muted mt-0.5">{stats.takeawayCount} orders</p>
            </div>
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* ── Advanced Filters ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 premium-shadow md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider mr-2">Service Type:</span>
            {['all', 'dine_in', 'room_service', 'takeaway'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                  typeFilter === type
                    ? 'bg-accent text-background border-accent shadow-sm'
                    : 'bg-surface-elevated text-text-secondary border-border hover:bg-surface-hover'
                }`}
              >
                {type === 'all' && 'All Types'}
                {type === 'dine_in' && 'Dine-In'}
                {type === 'room_service' && 'Room Service'}
                {type === 'takeaway' && 'Takeaway'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 md:border-t-0 md:pt-0">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider mr-2">Status:</span>
            {['all', 'pending', 'processing', 'pending_payment', 'completed', 'cancelled', 'refunded'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-all capitalize ${
                  statusFilter === status
                    ? 'bg-text-primary text-background border-text-primary shadow-sm'
                    : 'bg-surface-elevated text-text-secondary border-border hover:bg-surface-hover'
                }`}
              >
                {status === 'all' ? 'All Statuses' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Master-Detail Split Pane ───────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[5fr_7fr] items-start">
          
          {/* LEFT: Orders List Pane */}
          <div className={`space-y-3 ${mobileView === 'detail' ? 'hidden lg:block' : 'block'}`}>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Shift Orders ({filteredOrders.length})</h2>
              {filteredOrders.length > 0 && <span className="text-xs text-text-muted">Showing page 1</span>}
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-[92px] animate-pulse rounded-2xl bg-surface border border-border" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-12 text-center text-text-muted">
                No orders match selected filters.
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {filteredOrders.map((order) => {
                  const isActive = activeOrder?.id === order.id;
                  const itemQuantity = getOrderItems(order).reduce((sum, it) => sum + it.quantity, 0);

                  return (
                    <div
                      key={order.id}
                      onClick={() => selectOrder(order.id)}
                      className={`group rounded-2xl border p-4 cursor-pointer text-left transition-all duration-200 relative ${
                        isActive
                          ? 'bg-surface-elevated border-accent shadow-medium translate-x-1'
                          : 'bg-surface border-border hover:border-text-muted hover:bg-surface-hover shadow-soft'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary text-base">#{order.order_number}</span>
                            {getOrderTypeBadge(order.order_type)}
                          </div>
                          
                          {/* Location Highlighting */}
                          <div className="mt-2 text-sm">
                            {order.order_type === 'dine_in' && (
                              <p className="font-semibold text-text-accent flex items-center gap-1.5">
                                <Utensils className="h-3.5 w-3.5" />
                                <span>Table {order.table_number ?? 'N/A'}</span>
                              </p>
                            )}
                            {order.order_type === 'room_service' && (
                              <p className="font-semibold text-primary flex items-center gap-1.5">
                                <Bed className="h-3.5 w-3.5" />
                                <span>Room {order.guest_room ?? 'N/A'} • {order.guest_name ?? 'Guest'}</span>
                              </p>
                            )}
                            {order.order_type === 'takeaway' && (
                              <p className="text-text-muted flex items-center gap-1.5">
                                <ShoppingBag className="h-3.5 w-3.5" />
                                <span>Standard Takeaway</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-display font-bold text-base text-text-accent">{formatCurrency(order.total, locale)}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{itemQuantity} items</p>
                          <div className="mt-2">{getStatusBadge(order.status)}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-between items-center border-t border-border/40 pt-2.5 text-[11px] text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>Served by {order.user?.name ?? 'Cashier'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Selected Order Detail Pane */}
          <div className={`${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
            {activeOrder ? (
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-medium space-y-6 animate-scale-in">
                
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileView('list')}
                  className="flex items-center gap-1.5 text-xs font-bold text-text-accent uppercase tracking-wider lg:hidden border border-border rounded-lg px-3 py-1.5 bg-surface-elevated mb-2 hover:bg-surface-hover"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to List
                </button>

                {/* Detail Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-xl font-bold text-text-primary">Order #{activeOrder.order_number}</h2>
                      {getStatusBadge(activeOrder.status)}
                    </div>
                    <p className="text-xs text-text-muted mt-1.5 flex items-center gap-2">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(activeOrder.created_at).toLocaleString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> Served by {activeOrder.user?.name ?? 'Cashier'}</span>
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {can('pos.edit_orders') && (
                      <button 
                        onClick={() => beginEdit(activeOrder)} 
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3.5 py-2 text-xs font-bold text-text-secondary hover:bg-surface-hover transition-all"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    )}
                    {can('pos.print_receipts') && (
                      <button 
                        onClick={() => print(activeOrder)} 
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3.5 py-2 text-xs font-bold text-text-secondary hover:bg-surface-hover transition-all"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print
                      </button>
                    )}
                    {can('pos.delete_orders') && (
                      <button 
                        onClick={() => setDeleteOrder(activeOrder)} 
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-error/20 bg-error/5 px-3.5 py-2 text-xs font-bold text-error hover:bg-error/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Location details card - Highlight where the order is */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Dining Details</h3>
                  {activeOrder.order_type === 'dine_in' && (
                    <div className="flex items-center gap-4 rounded-xl bg-accent-50/50 p-4 border border-accent/20 dark:bg-accent-950/10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                        <Utensils className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Table Dining Location</p>
                        <p className="text-lg font-bold text-text-primary">Table Number: {activeOrder.table_number ?? 'N/A'}</p>
                        <p className="text-xs text-text-muted mt-0.5">Assigned to POS lobby zone</p>
                      </div>
                    </div>
                  )}

                  {activeOrder.order_type === 'room_service' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-4 rounded-xl bg-primary/5 p-4 border border-primary/10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                          <Bed className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Room Service Delivery</p>
                          <p className="text-lg font-bold text-text-primary">Room {activeOrder.guest_room ?? 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 rounded-xl bg-surface-elevated p-4 border border-border">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover text-text-secondary">
                          <User className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Registered Hotel Guest</p>
                          <p className="text-sm font-bold text-text-primary truncate">{activeOrder.guest_name ?? 'Guest Name'}</p>
                          {activeOrder.guest_folio_id && <p className="text-[10px] text-text-muted font-mono truncate">Folio: {activeOrder.guest_folio_id}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeOrder.order_type === 'takeaway' && (
                    <div className="flex items-center gap-4 rounded-xl bg-info/5 p-4 border border-info/10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/15 text-info">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Takeaway Order</p>
                        <p className="text-lg font-bold text-text-primary">Standard Takeaway Service</p>
                        <p className="text-xs text-text-muted mt-0.5">Customer pickup from the POS counter</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Ordered Items</h3>
                  <div className="overflow-hidden rounded-xl border border-border bg-surface">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-surface-elevated text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                          <th className="py-2.5 px-4">Menu Product</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Price</th>
                          <th className="py-2.5 px-4 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {getOrderItems(activeOrder).map((item) => {
                          const unitPrice = toMoneyNumber(item.unit_price);
                          const quantity = item.quantity;
                          const total = item.total_price ? toMoneyNumber(item.total_price) : unitPrice * quantity;
                          
                          return (
                            <tr key={item.id} className="hover:bg-surface-hover/30">
                              <td className="py-3 px-4">
                                <span className="font-semibold text-text-primary">{item.menuItem?.name ?? `Item #${item.menu_item_id}`}</span>
                                {item.notes && (
                                  <span className="block mt-1 text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded w-fit border border-border">
                                    {item.notes}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center text-text-secondary font-medium">x{quantity}</td>
                              <td className="py-3 px-3 text-right text-text-secondary">{formatCurrency(unitPrice, locale)}</td>
                              <td className="py-3 px-4 text-right font-bold text-text-primary">{formatCurrency(total, locale)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Row - Financial Summary + Payment Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  
                  {/* Payments summary */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Payment Transactions</h3>
                    
                    {activeOrder.payments && activeOrder.payments.length > 0 ? (
                      <div className="space-y-2">
                        {activeOrder.payments.map((payment) => (
                          <div key={payment.id} className="rounded-xl border border-border bg-surface-elevated/40 p-3 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-text-primary capitalize">
                                {payment.paymentMethod?.name ?? 'Other Method'}
                              </p>
                              {payment.reference_number && (
                                <p className="text-[10px] text-text-muted mt-0.5">Ref: {payment.reference_number}</p>
                              )}
                              {payment.notes && (
                                <p className="text-[10px] text-text-muted mt-0.5 italic">"{payment.notes}"</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-text-primary">{formatCurrency(payment.amount, locale)}</p>
                              <p className="text-[9px] text-text-muted mt-0.5">
                                {new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 rounded-xl border border-dashed border-border text-xs text-text-muted flex flex-col items-center justify-center gap-1 bg-surface-elevated/20">
                        <DollarSign className="h-4 w-4 text-text-muted opacity-60" />
                        <span>No payments received yet</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing breakdown */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Order Ledger</h3>
                    <div className="rounded-xl border border-border bg-surface-elevated/30 p-4 space-y-2">
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>Subtotal</span>
                        <span>{formatCurrency(activeOrder.subtotal, locale)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>Service Charge</span>
                        <span>+{formatCurrency(activeOrder.service_charge, locale)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>Tax Amount</span>
                        <span>+{formatCurrency(activeOrder.tax_amount, locale)}</span>
                      </div>
                      {toMoneyNumber(activeOrder.discount_amount) > 0 && (
                        <div className="flex justify-between text-xs text-error font-medium">
                          <span>Discount</span>
                          <span>-{formatCurrency(activeOrder.discount_amount, locale)}</span>
                        </div>
                      )}
                      <div className="border-t border-border pt-2 mt-2 flex justify-between items-baseline">
                        <span className="font-bold text-text-primary text-sm">Grand Total</span>
                        <span className="text-xl font-bold text-text-accent font-display">{formatCurrency(activeOrder.total, locale)}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Shift Details Footer */}
                {activeOrder.cashShift && (
                  <div className="rounded-xl border border-border bg-surface-elevated/30 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-text-muted" />
                      <span>Cash Shift: <strong className="text-text-primary">{activeOrder.cashShift.shift_name ?? activeOrder.cashShift.name ?? 'Morning Shift'}</strong></span>
                    </div>
                    <span>Drawer Operator: <strong className="text-text-primary">{activeOrder.cashShift.shift_taker ?? 'Unknown'}</strong></span>
                  </div>
                )}

              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-text-muted bg-surface flex flex-col items-center justify-center gap-3">
                <FileText className="h-8 w-8 opacity-40 text-text-muted" />
                <div>
                  <h3 className="font-bold text-text-primary">No Active Order Selected</h3>
                  <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">Select a shift order from the left directory to display its full itemized billing ledger and details.</p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── Modals & Dialogs ────────────────────────────────────────────────── */}

      {deleteOrder && (
        <Modal title="Delete Order" onClose={() => setDeleteOrder(null)}>
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete order <strong className="text-text-primary">#{deleteOrder.order_number}</strong>? This action will permanently restore inventory deducts and clean all transactions.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setDeleteOrder(null)} className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-hover">
              Cancel
            </button>
            <button disabled={saving} onClick={confirmDelete} className="rounded-lg bg-error px-4 py-2 text-xs font-semibold text-white hover:bg-error/90 disabled:opacity-50">
              {saving ? 'Deleting...' : 'Delete Order'}
            </button>
          </div>
        </Modal>
      )}

      {editState && (
        <Modal title={`Edit Order #${editState.order.order_number}`} onClose={() => setEditState(null)} wide>
          <form onSubmit={saveOrder} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Discount amount">
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={editState.discount} 
                  onChange={(event) => setEditState({ ...editState, discount: event.target.value })} 
                  className="w-full rounded-lg border border-border bg-surface-elevated p-2 text-sm text-text-primary outline-none focus:border-accent" 
                />
              </Field>
              <Field label="Taxes amount">
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={editState.tax} 
                  onChange={(event) => setEditState({ ...editState, tax: event.target.value })} 
                  className="w-full rounded-lg border border-border bg-surface-elevated p-2 text-sm text-text-primary outline-none focus:border-accent" 
                />
              </Field>
              <Field label="Payment Status">
                <select 
                  value={editState.status} 
                  onChange={(event) => setEditState({ ...editState, status: event.target.value as OrderStatus })} 
                  className="w-full rounded-lg border border-border bg-surface-elevated p-2 text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="pending_payment">Pending Payment</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </Field>
            </div>

            <Field label="Order Notes">
              <textarea 
                value={editState.notes} 
                onChange={(event) => setEditState({ ...editState, notes: event.target.value })} 
                className="w-full rounded-lg border border-border bg-surface-elevated p-2 text-sm text-text-primary outline-none focus:border-accent min-h-24 resize-none" 
                placeholder="Shift notes or dining details..."
              />
            </Field>

            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <select 
                  value={editState.newMenuItemId} 
                  onChange={(event) => setEditState({ ...editState, newMenuItemId: event.target.value })} 
                  className="flex-1 rounded-lg border border-border bg-surface-elevated p-2 text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="">Add product...</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {formatCurrency(item.price, locale)}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={addEditItem} className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-hover">
                  Add Product
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {editState.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="grid gap-3 rounded-xl border border-border bg-surface-elevated/40 p-3 sm:grid-cols-[2fr_1fr_2fr_auto] items-center">
                    <div>
                      <p className="font-semibold text-xs text-text-primary">{item.name}</p>
                      <p className="text-[10px] text-text-muted">{formatCurrency(item.unit_price, locale)}</p>
                    </div>
                    <input 
                      type="number" 
                      min="1" 
                      step="1" 
                      value={item.quantity} 
                      onChange={(event) => setEditState({ 
                        ...editState, 
                        items: editState.items.map((candidate, candidateIndex) => 
                          candidateIndex === index ? { ...candidate, quantity: Number.parseInt(event.target.value, 10) || 1 } : candidate
                        ) 
                      })} 
                      className="w-full rounded-lg border border-border bg-surface-elevated p-1.5 text-xs text-text-primary outline-none focus:border-accent text-center" 
                    />
                    <input 
                      value={item.notes} 
                      onChange={(event) => setEditState({ 
                        ...editState, 
                        items: editState.items.map((candidate, candidateIndex) => 
                          candidateIndex === index ? { ...candidate, notes: event.target.value } : candidate
                        ) 
                      })} 
                      className="w-full rounded-lg border border-border bg-surface-elevated p-1.5 text-xs text-text-primary outline-none focus:border-accent" 
                      placeholder="Item notes..." 
                    />
                    <button 
                      type="button" 
                      onClick={() => setEditState({ ...editState, items: editState.items.filter((_, candidateIndex) => candidateIndex !== index) })} 
                      className="rounded-lg p-2 text-error hover:bg-error/10 flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary/95 disabled:opacity-60 transition-all">
              <Save className="h-4 w-4" />
              {saving ? 'Saving changes...' : 'Save Order'}
            </button>
          </form>
        </Modal>
      )}

      {printOrder && (
        <Receipt 
          order={printOrder} 
          tableNumber={printOrder.table_number ?? undefined} 
          onClose={() => setPrintOrder(null)} 
          onPrint={() => window.print()} 
        />
      )}
    </div>
  );
}

function Modal({ title, children, onClose, wide }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) { 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-surface p-6 shadow-large border border-border animate-scale-in ${wide ? 'max-w-4xl' : 'max-w-md'}`}>
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  ); 
}

function Field({ label, children }: { label: string; children: ReactNode }) { 
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-text-secondary uppercase tracking-wider">{label}</span>
      {children}
    </label>
  ); 
}
