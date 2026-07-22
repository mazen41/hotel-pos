'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { posSettingsApi } from '@/lib/api';
import type { PosSetting } from '@/types';
import { Settings, DollarSign, Printer, CreditCard, Save, Globe } from 'lucide-react';

export default function PosSettingsPage() {
  const t = useTranslations();
  const { can } = usePermissions();
  const [settings, setSettings] = useState<PosSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    require_open_shift_for_cash: false,
    auto_print_receipt: false,
    default_payment_method: 'cash',
    receipt_footer: '',
    tax_percentage: 0,
    service_charge_percentage: 0,
    currency: 'USD',
    currency_symbol: '$',
    auto_approve_return_threshold: 0
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await posSettingsApi.get();
      setSettings(data);
      setFormData({
        require_open_shift_for_cash: data.require_open_shift_for_cash,
        auto_print_receipt: data.auto_print_receipt,
        default_payment_method: data.default_payment_method,
        receipt_footer: data.receipt_footer || '',
        tax_percentage: data.tax_percentage,
        service_charge_percentage: data.service_charge_percentage,
        currency: data.currency,
        currency_symbol: data.currency_symbol,
        auto_approve_return_threshold: data.auto_approve_return_threshold
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await posSettingsApi.update(formData);
      setSettings(data);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!can('settings.edit')) {
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
            {t('settings.posTitle')}
          </h1>
          <p className="text-text-muted">
            Configure your POS system settings
          </p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold text-text-primary">
                {t('settings.posGeneral')}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">{t('settings.requireOpenShift')}</p>
                  <p className="text-sm text-text-muted">
                    Require cashiers to open a shift before taking cash payments
                  </p>
                </div>
                <button
                  onClick={() => setFormData({
                    ...formData,
                    require_open_shift_for_cash: !formData.require_open_shift_for_cash
                  })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.require_open_shift_for_cash
                      ? 'bg-primary'
                      : 'bg-surface-elevated'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.require_open_shift_for_cash ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">{t('settings.autoPrintReceipt')}</p>
                  <p className="text-sm text-text-muted">
                    Automatically print receipts after successful payments
                  </p>
                </div>
                <button
                  onClick={() => setFormData({
                    ...formData,
                    auto_print_receipt: !formData.auto_print_receipt
                  })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.auto_print_receipt
                      ? 'bg-primary'
                      : 'bg-surface-elevated'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.auto_print_receipt ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-success bg-opacity-10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-success" />
              </div>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Payment Settings
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('settings.defaultPaymentMethod')}
                </label>
                <select
                  value={formData.default_payment_method}
                  onChange={(e) => setFormData({
                    ...formData,
                    default_payment_method: e.target.value
                  })}
                  className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="hotel">Hotel Room</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('settings.autoApproveReturnThreshold')}
                </label>
                <input
                  type="number"
                  value={formData.auto_approve_return_threshold}
                  onChange={(e) => setFormData({
                    ...formData,
                    auto_approve_return_threshold: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                  step="0.01"
                />
                <p className="text-sm text-text-muted mt-1">
                  Returns below this amount will be auto-approved
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Settings */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-text-accent bg-opacity-10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-text-accent" />
              </div>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Pricing & Taxes
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('settings.taxPercentage')}
                  </label>
                  <input
                    type="number"
                    value={formData.tax_percentage}
                    onChange={(e) => setFormData({
                      ...formData,
                      tax_percentage: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                    step="0.1"
                    max={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('settings.serviceChargePercentage')}
                  </label>
                  <input
                    type="number"
                    value={formData.service_charge_percentage}
                    onChange={(e) => setFormData({
                      ...formData,
                      service_charge_percentage: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                    step="0.1"
                    max={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('settings.currency')}
                  </label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({
                      ...formData,
                      currency: e.target.value
                    })}
                    className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                    placeholder="USD"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('settings.currencySymbol')}
                  </label>
                  <input
                    type="text"
                    value={formData.currency_symbol}
                    onChange={(e) => setFormData({
                      ...formData,
                      currency_symbol: e.target.value
                    })}
                    className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                    placeholder="$"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Settings */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-warning bg-opacity-10 flex items-center justify-center">
                <Printer className="w-5 h-5 text-warning" />
              </div>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Receipt Settings
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('settings.receiptFooter')}
              </label>
              <textarea
                value={formData.receipt_footer}
                onChange={(e) => setFormData({
                  ...formData,
                  receipt_footer: e.target.value
                })}
                className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent resize-none"
                rows={3}
                placeholder="Thank you for your visit!"
              />
              <p className="text-sm text-text-muted mt-1">
                This text will appear at the bottom of all receipts
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : t('settings.settingsUpdated')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}