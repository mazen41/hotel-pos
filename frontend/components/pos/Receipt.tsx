'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Printer, X, Download } from 'lucide-react';
import type { Order, OrderItem } from '@/types';

interface ReceiptProps {
  order: Order | null;
  tableNumber?: string;
  onClose: () => void;
  onPrint?: () => void;
}

function formatMoney(value: number | string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
}

function getOrderItems(order: Order | null) {
  return order?.order_items ?? order?.orderItems ?? [];
}

export function Receipt({ order, tableNumber, onClose, onPrint }: ReceiptProps) {
  const t = useTranslations();
  const receiptRef = useRef<HTMLDivElement>(null);

  const items = getOrderItems(order);
  const subtotal = Number(order?.subtotal ?? 0);
  const tax = Number(order?.tax_amount ?? 0);
  const serviceCharge = Number(order?.service_charge ?? 0);
  const discount = Number(order?.discount_amount ?? 0);
  const total = Number(order?.total ?? 0);
  const paid = Number(order?.paid_amount ?? 0);
  const change = Number(order?.change_amount ?? 0);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg bg-background shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-text-primary">Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="rounded-lg p-2 text-text-secondary transition-all duration-200 hover:bg-surface-hover hover:text-text-primary hover:shadow-md"
              title="Print receipt"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-text-secondary transition-all duration-200 hover:bg-surface-hover hover:text-text-primary hover:shadow-md"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4 text-sm">
            {/* Restaurant Info */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-text-primary">Café Restaurant</h3>
              <p className="text-text-muted">123 Main Street</p>
              <p className="text-text-muted">Tel: (555) 123-4567</p>
            </div>

            {/* Order Info */}
            <div className="border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-text-muted">Order #:</span>
                <span className="font-medium text-text-primary">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Table:</span>
                <span className="font-medium text-text-primary">{tableNumber || order.table_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Date:</span>
                <span className="font-medium text-text-primary">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Time:</span>
                <span className="font-medium text-text-primary">
                  {new Date(order.created_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Cashier:</span>
                <span className="font-medium text-text-primary">{order.user?.name || 'N/A'}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-border pt-4">
              <h4 className="mb-2 font-semibold text-text-primary">Items</h4>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex-1">
                      <span className="font-medium text-text-primary">
                        {item.menuItem?.name || `Item #${item.menu_item_id}`}
                      </span>
                      <span className="text-text-muted"> x{item.quantity}</span>
                    </div>
                    <span className="font-medium text-text-primary">
                      ${formatMoney(item.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal:</span>
                <span className="font-medium text-text-primary">${formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Tax:</span>
                <span className="font-medium text-text-primary">${formatMoney(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Service Charge:</span>
                <span className="font-medium text-text-primary">${formatMoney(serviceCharge)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Discount:</span>
                  <span className="font-medium text-success">-${formatMoney(discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-bold text-text-primary">Total:</span>
                <span className="font-bold text-text-accent">${formatMoney(total)}</span>
              </div>
              {paid > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Paid:</span>
                    <span className="font-medium text-text-primary">${formatMoney(paid)}</span>
                  </div>
                  {change > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Change:</span>
                      <span className="font-medium text-success">${formatMoney(change)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Payment Methods */}
            {order.payments && order.payments.length > 0 && (
              <div className="border-t border-border pt-4">
                <h4 className="mb-2 font-semibold text-text-primary">Payment Methods</h4>
                <div className="space-y-1">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between">
                      <span className="text-text-muted">
                        {payment.paymentMethod?.name || 'Payment'}
                      </span>
                      <span className="font-medium text-text-primary">
                        ${formatMoney(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-border pt-4 text-center">
              <p className="text-text-muted">Thank you for dining with us!</p>
              <p className="text-xs text-text-muted">Please come again</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border p-4">
          <button
            onClick={handlePrint}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-white shadow-medium transition-all duration-200 hover:bg-primary/90 hover:shadow-lg premium-button"
          >
            <Printer className="h-5 w-5" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
