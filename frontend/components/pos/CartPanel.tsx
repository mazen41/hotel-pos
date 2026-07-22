'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Plus, Trash2, ShoppingBag, Hotel } from 'lucide-react';
import type { MenuItem } from '@/types';
import { HotelIntegration } from './HotelIntegration';
import type { HotelGuest } from '@/types';

interface CartItem extends MenuItem {
  quantity: number;
  notes: string;
}

export function CartPanel() {
  const t = useTranslations();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [tax, setTax] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [selectedGuest, setSelectedGuest] = useState<HotelGuest | null>(null);
  const [showHotelIntegration, setShowHotelIntegration] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + tax + serviceCharge - discount;

  const updateQuantity = (item: CartItem, delta: number) => {
    if (item.quantity + delta <= 0) {
      removeItem(item);
      return;
    }
    setCartItems(
      cartItems.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + delta } : i
      )
    );
  };

  const removeItem = (item: CartItem) => {
    setCartItems(cartItems.filter((i) => i.id !== item.id));
  };

  const updateNotes = (item: CartItem, notes: string) => {
    setCartItems(
      cartItems.map((i) => (i.id === item.id ? { ...i, notes } : i))
    );
  };

  const handleChargeToFolio = async (guest: HotelGuest, amount: number) => {
    // This would call the API to charge to the hotel folio
    console.log('Charging to folio:', guest.id, amount);
    // Clear cart after successful charge
    setCartItems([]);
    setSelectedGuest(null);
    setShowHotelIntegration(false);
  };

  return (
    <div className="w-96 bg-surface border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-text-accent" />
            <h2 className="font-display text-lg font-bold text-text-primary">
              {t('pos.cart')}
            </h2>
          </div>
          <button
            onClick={() => setShowHotelIntegration(!showHotelIntegration)}
            className={`p-2 rounded-lg transition-colors ${
              showHotelIntegration
                ? 'bg-primary text-white'
                : 'bg-surface-hover text-text-muted hover:text-text-primary'
            }`}
            title="Hotel Integration"
          >
            <Hotel className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hotel Integration */}
      {showHotelIntegration && (
        <div className="p-4 border-b border-border">
          <HotelIntegration
            onGuestSelect={setSelectedGuest}
            chargeToFolio={handleChargeToFolio}
            orderTotal={total}
          />
        </div>
      )}

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted">{t('pos.emptyCart')}</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-surface-elevated rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary text-sm">{item.name}</h4>
                  <p className="text-text-accent font-display font-bold">
                    ${(item.price).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item)}
                  className="p-1 text-text-muted hover:text-error transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item, -1)}
                  className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium text-text-primary">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item, 1)}
                  className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                placeholder={t('pos.notes')}
                value={item.notes}
                onChange={(e) => updateNotes(item, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-accent"
              />
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">{t('pos.subtotal')}</span>
          <span className="text-text-primary font-medium">
            ${subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">{t('pos.tax')}</span>
          <span className="text-text-primary font-medium">
            ${tax.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">{t('pos.serviceCharge')}</span>
          <span className="text-text-primary font-medium">
            ${serviceCharge.toFixed(2)}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">{t('pos.discount')}</span>
            <span className="text-success font-medium">
              -${discount.toFixed(2)}
            </span>
          </div>
        )}
        {selectedGuest && (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Hotel Guest</span>
            <span className="text-primary font-medium">
              {selectedGuest.name}
            </span>
          </div>
        )}
        <div className="border-t border-border pt-2 mt-2">
          <div className="flex justify-between">
            <span className="font-display text-lg font-bold text-text-primary">
              {t('pos.total')}
            </span>
            <span className="font-display text-lg font-bold text-text-accent">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          disabled={cartItems.length === 0}
          className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {selectedGuest ? 'Charge to Room' : t('pos.checkout')}
        </button>
        <button
          onClick={() => setCartItems([])}
          disabled={cartItems.length === 0}
          className="w-full py-2 rounded-lg bg-surface text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('pos.clearCart')}
        </button>
      </div>
    </div>
  );
}