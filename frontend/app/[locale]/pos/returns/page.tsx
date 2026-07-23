'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { returnsApi, ordersApi } from '@/lib/api';
import type { OrderReturn, Order } from '@/types';
import { ArrowLeft, CheckCircle, XCircle, DollarSign, Package, AlertCircle } from 'lucide-react';

function toMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: number | string | null | undefined) {
  return toMoney(value).toFixed(2);
}

export default function ReturnsPage() {
  const t = useTranslations();
  const { can } = usePermissions();
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnData, setReturnData] = useState({
    order_id: 0,
    reason: '',
    refund_amount: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [returnsRes, ordersRes] = await Promise.all([
        returnsApi.list(),
        ordersApi.list({ status: 'completed' })
      ]);
      setReturns(returnsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReturn = async () => {
    try {
      const { data } = await returnsApi.create({
        order_id: returnData.order_id,
        total_amount: returnData.refund_amount,
        refund_method: 'original_payment',
        reason: returnData.reason,
        items: []
      });
      setReturns([data, ...returns]);
      setShowCreateDialog(false);
      setReturnData({ order_id: 0, reason: '', refund_amount: 0 });
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to create return:', error);
    }
  };

  const handleApproveReturn = async (id: number) => {
    try {
      await returnsApi.approve(id);
      setReturns(returns.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    } catch (error) {
      console.error('Failed to approve return:', error);
    }
  };

  const handleRejectReturn = async (id: number) => {
    try {
      await returnsApi.reject(id, 'Rejected');
      setReturns(returns.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    } catch (error) {
      console.error('Failed to reject return:', error);
    }
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setReturnData({
      order_id: order.id,
      reason: '',
      refund_amount: toMoney(order.total)
    });
  };

  if (!can('pos.manage_returns')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">{t('errors.noPermission')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-muted">{t('common.loading')}</div>
      </div>
    );
  }

  const pendingReturns = returns.filter(r => r.status === 'pending');
  const approvedReturns = returns.filter(r => r.status === 'approved');
  const rejectedReturns = returns.filter(r => r.status === 'rejected');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
            {t('pos.returns')}
          </h1>
          <p className="text-text-muted">
            Manage customer returns and refunds
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Returns</p>
                <p className="font-display text-2xl font-bold text-text-primary">
                  {returns.length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-warning bg-opacity-10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Pending</p>
                <p className="font-display text-2xl font-bold text-warning">
                  {pendingReturns.length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-success bg-opacity-10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Approved</p>
                <p className="font-display text-2xl font-bold text-success">
                  {approvedReturns.length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-error bg-opacity-10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-error" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Refunded</p>
                <p className="font-display text-2xl font-bold text-error">
                  ${returns.filter(r => r.status === 'approved').reduce((sum, r) => sum + toMoney(r.total_amount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Returns */}
        {pendingReturns.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="font-display text-xl font-bold text-text-primary mb-4">
              Pending Returns
            </h2>
            
            <div className="space-y-3">
              {pendingReturns.map((returnItem) => (
                <div key={returnItem.id} className="bg-surface-elevated rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-warning bg-opacity-10 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          Order #{returnItem.order_id}
                        </p>
                        <p className="text-sm text-text-muted">
                          {new Date(returnItem.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-error">
                        ${formatMoney(returnItem.total_amount)}
                      </p>
                      <p className="text-sm text-text-muted">
                        Refund Amount
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-text-secondary">{returnItem.reason}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveReturn(returnItem.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-white font-medium hover:bg-success-600 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectReturn(returnItem.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-white font-medium hover:bg-error-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Return */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-text-primary">
              Create Return
            </h2>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              New Return
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-surface-hover">
                    <td className="py-3 px-4">
                      <p className="font-medium text-text-primary">#{order.id}</p>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-text-accent font-display font-bold">
                      ${formatMoney(order.total)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-success bg-opacity-10 text-success">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          handleOrderSelect(order);
                          setShowCreateDialog(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover transition-colors"
                      >
                        Create Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return History */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl font-bold text-text-primary mb-4">
            Return History
          </h2>
          
          <div className="space-y-3">
            {returns.map((returnItem) => (
              <div key={returnItem.id} className="bg-surface-elevated rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      returnItem.status === 'approved' ? 'bg-success bg-opacity-10' :
                      returnItem.status === 'rejected' ? 'bg-error bg-opacity-10' :
                      'bg-warning bg-opacity-10'
                    }`}>
                      {returnItem.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : returnItem.status === 'rejected' ? (
                        <XCircle className="w-5 h-5 text-error" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        Order #{returnItem.order_id}
                      </p>
                      <p className="text-sm text-text-muted">
                        {new Date(returnItem.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-display font-bold text-text-primary">
                      ${formatMoney(returnItem.total_amount)}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      returnItem.status === 'approved' ? 'bg-success bg-opacity-10 text-success' :
                      returnItem.status === 'rejected' ? 'bg-error bg-opacity-10 text-error' :
                      'bg-warning bg-opacity-10 text-warning'
                    }`}>
                      {returnItem.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Return Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">
              Create Return
            </h3>

            {selectedOrder && (
              <div className="mb-4 p-4 bg-surface-elevated rounded-lg">
                <p className="text-sm text-text-secondary">Order #{selectedOrder.id}</p>
                <p className="font-display text-lg font-bold text-text-primary">
                  ${formatMoney(selectedOrder.total)}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Refund Amount
                </label>
                <input
                  type="number"
                  value={returnData.refund_amount}
                  onChange={(e) => setReturnData({ ...returnData, refund_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                  step="0.01"
                  max={selectedOrder ? toMoney(selectedOrder.total) : undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Reason
                </label>
                <textarea
                  value={returnData.reason}
                  onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent resize-none"
                  rows={3}
                  placeholder="Reason for return..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedOrder(null);
                  setReturnData({ order_id: 0, reason: '', refund_amount: 0 });
                }}
                className="flex-1 py-3 rounded-lg bg-surface text-text-secondary hover:bg-surface-hover transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreateReturn}
                className="flex-1 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors"
              >
                Create Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
