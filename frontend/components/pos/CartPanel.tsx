'use client';

import { useMemo, useState, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Trash2, ShoppingBag, Hotel, ChevronUp, ReceiptText, DollarSign, CreditCard, Clock } from 'lucide-react';
import type { HotelGuest, Order, OrderItem } from '@/types';
import { HotelIntegration } from './HotelIntegration';

interface CartPanelProps {
  order: Order | null;
  loading: boolean;
  savingItemId: number | null;
  onQuantityChange: (item: OrderItem, quantity: number) => void;
  onRemoveItem: (item: OrderItem) => void;
  onClearOrder: () => void;
  onCheckout: (method: 'cash' | 'card' | 'guest') => void;
}

function toMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: number | string | null | undefined) {
  return toMoney(value).toFixed(2);
}

export const CartPanel = memo(function CartPanel({
  order,
  loading,
  savingItemId,
  onQuantityChange,
  onRemoveItem,
  onClearOrder,
  onCheckout,
}: CartPanelProps) {
  const t = useTranslations();
  const [selectedGuest, setSelectedGuest] = useState<HotelGuest | null>(null);
  const [showHotelIntegration, setShowHotelIntegration] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  // Laravel serializes camelCase relations as snake_case in JSON (order_items, not orderItems)
  const items = order?.order_items ?? order?.orderItems ?? [];
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const total = toMoney(order?.total);

  const handleChargeToFolio = async (guest: HotelGuest, amount: number) => {
    console.log('Charging to folio:', guest.id, amount);
    setSelectedGuest(guest);
    setShowHotelIntegration(false);
  };

  const handlePaymentSelect = (method: 'cash' | 'card' | 'guest') => {
    onCheckout(method);
    setShowPaymentOptions(false);
  };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-t border-border bg-surface lg:w-[420px] lg:border-l lg:border-t-0">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{t('pos.cart')}</h2>
              <p className="text-xs text-text-muted">
                {order ? `${order.order_number} • ${itemCount} item${itemCount === 1 ? '' : 's'}` : 'No active order'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHotelIntegration(!showHotelIntegration)}
            className={`rounded-lg p-2 transition ${
              showHotelIntegration
                ? 'bg-primary text-white'
                : 'bg-background text-text-muted hover:text-text-primary'
            }`}
            title="Hotel integration"
          >
            <Hotel className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showHotelIntegration && (
        <div className="border-b border-border p-4">
          <HotelIntegration
            onGuestSelect={setSelectedGuest}
            chargeToFolio={handleChargeToFolio}
            orderTotal={total}
          />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-lg bg-background" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/60 p-6 text-center">
            <ReceiptText className="mb-3 h-11 w-11 text-text-muted" />
            <p className="font-medium text-text-primary">{t('pos.emptyCart')}</p>
            <p className="mt-1 text-sm text-text-muted">Click any product card to start a new order.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isSaving = savingItemId === item.id;

              return (
                <div key={item.id} className="rounded-lg border border-border bg-background p-3 shadow-sm transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-text-primary">
                        {item.menuItem?.name ?? `Item #${item.menu_item_id}`}
                      </h4>
                      <p className="mt-1 text-xs text-text-muted">
                        ${formatMoney(item.unit_price)} each
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item)}
                      disabled={isSaving}
                      className="rounded-md p-2 text-text-muted transition hover:bg-error/10 hover:text-error disabled:opacity-50"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-lg border border-border bg-surface">
                      <button
                        onClick={() => onQuantityChange(item, item.quantity - 1)}
                        disabled={isSaving}
                        className="flex h-9 w-9 items-center justify-center text-text-secondary transition hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
                        title="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-text-primary">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onQuantityChange(item, item.quantity + 1)}
                        disabled={isSaving}
                        className="flex h-9 w-9 items-center justify-center text-text-secondary transition hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
                        title="Increase quantity"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-base font-bold text-text-accent">
                      ${formatMoney(item.total_price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">{t('pos.subtotal')}</span>
            <span className="font-medium text-text-primary">${formatMoney(order?.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">{t('pos.tax')}</span>
            <span className="font-medium text-text-primary">${formatMoney(order?.tax_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">{t('pos.serviceCharge')}</span>
            <span className="font-medium text-text-primary">${formatMoney(order?.service_charge)}</span>
          </div>
          {toMoney(order?.discount_amount) > 0 && (
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('pos.discount')}</span>
              <span className="font-medium text-success">-${formatMoney(order?.discount_amount)}</span>
            </div>
          )}
          {selectedGuest && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Hotel Guest</span>
              <span className="font-medium text-primary">{selectedGuest.name}</span>
            </div>
          )}
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-text-primary">{t('pos.total')}</span>
            <span className="text-2xl font-bold text-text-accent">${formatMoney(total)}</span>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-4 space-y-2">
            {!showPaymentOptions ? (
              <button
                onClick={() => setShowPaymentOptions(true)}
                disabled={loading}
                className="w-full rounded-lg bg-primary py-3 font-semibold text-white shadow-medium transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-50"
              >
                Checkout
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-center text-sm font-medium text-text-secondary">Select Payment Method</p>
                
                <button
                  onClick={() => handlePaymentSelect('cash')}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-success py-3 font-semibold text-white shadow-medium transition-all duration-200 hover:bg-success/90 hover:shadow-lg disabled:cursor-wait disabled:opacity-50 premium-button"
                >
                  <DollarSign className="h-5 w-5" />
                  Cash
                </button>
                
                <button
                  onClick={() => handlePaymentSelect('card')}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-info py-3 font-semibold text-white shadow-medium transition-all duration-200 hover:bg-info/90 hover:shadow-lg disabled:cursor-wait disabled:opacity-50 premium-button"
                >
                  <CreditCard className="h-5 w-5" />
                  Visa/Card
                </button>
                
                <button
                  onClick={() => handlePaymentSelect('guest')}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 font-semibold text-white shadow-medium transition-all duration-200 hover:bg-accent/90 hover:shadow-lg disabled:cursor-wait disabled:opacity-50 premium-button"
                >
                  <Clock className="h-5 w-5" />
                  Guest (Pay Later)
                </button>
                
                <button
                  onClick={() => setShowPaymentOptions(false)}
                  disabled={loading}
                  className="w-full rounded-lg border border-border py-2 font-medium text-text-secondary transition-all duration-200 hover:bg-surface-hover disabled:cursor-wait disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={onClearOrder}
              disabled={loading}
              className="w-full rounded-lg border border-error/30 py-2 font-medium text-error transition hover:bg-error/10 disabled:cursor-wait disabled:opacity-50"
            >
              Clear Order
            </button>
          </div>
        )}
      </div>
    </aside>
  );
});
