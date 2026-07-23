'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { posSettingsApi } from '@/lib/api';
import { usePosSettings } from '@/contexts/PosSettingsContext';
import { Settings, Printer, CreditCard, Save, CheckCircle, AlertCircle, Percent } from 'lucide-react';

// ─── Reusable Toggle ────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  id,
}: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px',
        border: 'none', cursor: 'pointer', padding: 0,
        background: checked ? 'var(--color-primary, #6366f1)' : 'var(--color-surface-elevated)',
        position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: 'white',
        transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

// ─── Settings Section Card ──────────────────────────────────────────────────────
function SettingsCard({
  icon,
  title,
  accentColor = '#6366f1',
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--color-border)',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '20px 24px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
        <h2 style={{
          fontSize: '16px', fontWeight: '700',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-display)',
        }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Toggle Row ─────────────────────────────────────────────────────────────────
function ToggleRow({
  id, label, description, checked, onChange,
}: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', padding: '14px 0',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--color-text-primary)', marginBottom: '2px' }}>{label}</p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{description}</p>
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── Number Input ───────────────────────────────────────────────────────────────
function NumberInput({
  label, value, onChange, suffix, min = 0, max = 100, step = 0.1, disabled = false,
}: {
  label: string; value: number; onChange: (v: number) => void;
  suffix?: string; min?: number; max?: number; step?: number; disabled?: boolean;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: '600',
        color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          min={min} max={max} step={step}
          disabled={disabled}
          style={{
            width: '100%', padding: '10px 14px',
            paddingRight: suffix ? '44px' : '14px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            background: disabled ? 'var(--color-surface)' : 'var(--color-surface-elevated)',
            color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
            fontSize: '15px', outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          onFocus={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--color-text-accent)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        />
        {suffix && (
          <span style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500',
            pointerEvents: 'none',
          }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function PosSettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { can } = usePermissions();
  const { reloadSettings } = usePosSettings();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    require_open_shift_for_cash: true,
    auto_print_receipt: false,
    default_payment_method: 'cash',
    receipt_footer: '',
    tax_percentage: 14,
    tax_enabled: true,
    service_charge_percentage: 0,
    service_charge_enabled: false,
    auto_approve_return_threshold: 50,
  });

  useEffect(() => {
    posSettingsApi.get()
      .then(({ data }) => {
        setFormData({
          require_open_shift_for_cash: data.require_open_shift_for_cash,
          auto_print_receipt: data.auto_print_receipt,
          default_payment_method: data.default_payment_method,
          receipt_footer: data.receipt_footer || '',
          tax_percentage: Number(data.tax_percentage),
          tax_enabled: data.tax_enabled ?? true,
          service_charge_percentage: Number(data.service_charge_percentage),
          service_charge_enabled: data.service_charge_enabled ?? false,
          auto_approve_return_threshold: Number(data.auto_approve_return_threshold),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await posSettingsApi.update(formData);
      await reloadSettings();
      showToast('success', t('settings.settingsUpdated'));
    } catch (err: any) {
      showToast('error', err?.message ?? 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: any) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  if (!can('settings.edit')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>{t('errors.noPermission')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 4px', direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px', fontWeight: '700',
          color: 'var(--color-text-primary)', marginBottom: '6px',
        }}>
          {t('settings.posTitle')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Configure your POS system — changes apply immediately to all order calculations.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: isRtl ? 'auto' : '24px', left: isRtl ? '24px' : 'auto',
          zIndex: 200,
          display: 'flex', alignItems: 'center', gap: '10px',
          background: toast.type === 'success' ? '#065f46' : '#7f1d1d',
          border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          borderRadius: '12px', padding: '12px 18px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.2s ease',
          maxWidth: '340px',
        }}>
          {toast.type === 'success'
            ? <CheckCircle size={18} style={{ color: '#34d399', flexShrink: 0 }} />
            : <AlertCircle size={18} style={{ color: '#f87171', flexShrink: 0 }} />}
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'white' }}>{toast.message}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Pricing & Taxes ──────────────────────────────────────────────── */}
        <SettingsCard icon={<Percent size={18} />} title="Pricing & Taxes" accentColor="#d4a574">
          {/* Tax */}
          <div>
            <ToggleRow
              id="tax-enabled"
              label={t('settings.taxEnabled')}
              description={t('settings.taxEnabledDesc')}
              checked={formData.tax_enabled}
              onChange={v => update('tax_enabled', v)}
            />
            {formData.tax_enabled && (
              <div style={{ paddingBottom: '14px', paddingTop: '4px' }}>
                <NumberInput
                  label={t('settings.taxPercentage')}
                  value={formData.tax_percentage}
                  onChange={v => update('tax_percentage', v)}
                  suffix="%"
                  min={0} max={100} step={0.5}
                />
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)' }} />

          {/* Service Charge */}
          <div>
            <ToggleRow
              id="service-charge-enabled"
              label={t('settings.serviceChargeEnabled')}
              description={t('settings.serviceChargeEnabledDesc')}
              checked={formData.service_charge_enabled}
              onChange={v => update('service_charge_enabled', v)}
            />
            {formData.service_charge_enabled && (
              <div style={{ paddingBottom: '14px', paddingTop: '4px' }}>
                <NumberInput
                  label={t('settings.serviceChargePercentage')}
                  value={formData.service_charge_percentage}
                  onChange={v => update('service_charge_percentage', v)}
                  suffix="%"
                  min={0} max={100} step={0.5}
                />
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
            {/* Currency — read-only info */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--color-surface-elevated)',
              borderRadius: '10px', padding: '12px 16px',
            }}>
              <span style={{ fontSize: '20px' }}>🇪🇬</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Egyptian Pound (EGP / ج.م)</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Currency is fixed to EGP across the entire application.</p>
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* ── General Settings ─────────────────────────────────────────────── */}
        <SettingsCard icon={<Settings size={18} />} title={t('settings.posGeneral')} accentColor="#6366f1">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <ToggleRow
              id="require-open-shift"
              label={t('settings.requireOpenShift')}
              description="Require cashiers to open a shift before taking cash payments"
              checked={formData.require_open_shift_for_cash}
              onChange={v => update('require_open_shift_for_cash', v)}
            />
            <div style={{ borderTop: '1px solid var(--color-border)' }} />
            <ToggleRow
              id="auto-print-receipt"
              label={t('settings.autoPrintReceipt')}
              description="Automatically trigger the receipt print workflow after each completed payment"
              checked={formData.auto_print_receipt}
              onChange={v => update('auto_print_receipt', v)}
            />
          </div>
        </SettingsCard>

        {/* ── Payment Settings ─────────────────────────────────────────────── */}
        <SettingsCard icon={<CreditCard size={18} />} title="Payment Settings" accentColor="#10b981">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '600',
                color: 'var(--color-text-secondary)', marginBottom: '8px',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {t('settings.defaultPaymentMethod')}
              </label>
              <select
                value={formData.default_payment_method}
                onChange={e => update('default_payment_method', e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px', outline: 'none', minHeight: '44px',
                  cursor: 'pointer',
                }}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="hotel">Hotel Room</option>
                <option value="other">Other</option>
              </select>
            </div>

            <NumberInput
              label={t('settings.autoApproveReturnThreshold')}
              value={formData.auto_approve_return_threshold}
              onChange={v => update('auto_approve_return_threshold', v)}
              suffix="EGP"
              min={0} max={100000} step={10}
            />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '-10px' }}>
              Returns below this amount will be automatically approved without manager review.
            </p>
          </div>
        </SettingsCard>

        {/* ── Receipt Settings ─────────────────────────────────────────────── */}
        <SettingsCard icon={<Printer size={18} />} title="Receipt Settings" accentColor="#f59e0b">
          <div>
            <label style={{
              display: 'block', fontSize: '12px', fontWeight: '600',
              color: 'var(--color-text-secondary)', marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {t('settings.receiptFooter')}
            </label>
            <textarea
              value={formData.receipt_footer}
              onChange={e => update('receipt_footer', e.target.value)}
              rows={3}
              placeholder="Thank you for dining with us! Please visit again."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
                fontSize: '14px', outline: 'none', resize: 'none',
                fontFamily: 'var(--font-body)',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--color-text-accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              This text appears at the bottom of all printed receipts.
            </p>
          </div>
        </SettingsCard>

        {/* ── Save ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end', paddingBottom: '40px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '12px',
              background: saving ? 'var(--color-surface-elevated)' : 'var(--color-text-accent)',
              color: saving ? 'var(--color-text-muted)' : '#1a1814',
              border: 'none', fontWeight: '700', fontSize: '14px',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              minHeight: '48px',
              boxShadow: saving ? 'none' : '0 4px 14px rgba(212,165,116,0.35)',
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : t('common.saveChanges')}
          </button>
        </div>

      </div>
    </div>
  );
}