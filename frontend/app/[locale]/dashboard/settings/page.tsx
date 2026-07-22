'use client';

import { useEffect, useState } from 'react';
import { settingsApi, ApiError } from '@/lib/api';
import type { HotelSettings, SettingsTab } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

export default function SettingsPage() {
  const [settings, setSettings] = useState<HotelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<HotelSettings>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  const locale = useLocale();
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await settingsApi.getHotel();
      setSettings(response.data);
      setFormData(response.data);
      setLogoPreview(response.data.logo_url);
      setFaviconPreview(response.data.favicon_url);
    } catch {
      // Use defaults if API fails
      setSettings({
        hotel_name: '',
        legal_business_name: null,
        logo_url: null,
        favicon_url: null,
        contact_email: null,
        contact_phone: null,
        website_url: null,
        country: null,
        city: null,
        address: null,
        postal_code: null,
        timezone: 'UTC',
        currency: 'USD',
        default_language: 'en',
        check_in_time: '14:00',
        check_out_time: '11:00',
        tax_percentage: 0,
        service_charge_percentage: 0,
        cancellation_policy: null,
        confirmation_policy: null,
        channel_property_code: null,
        channel_external_property_ref: null,
        channel_default_rate_plan_code: null,
        channel_default_inventory_code: null,
      });
      setFormData({
        hotel_name: '',
        legal_business_name: null,
        logo_url: null,
        favicon_url: null,
        contact_email: null,
        contact_phone: null,
        website_url: null,
        country: null,
        city: null,
        address: null,
        postal_code: null,
        timezone: 'UTC',
        currency: 'USD',
        default_language: 'en',
        check_in_time: '14:00',
        check_out_time: '11:00',
        tax_percentage: 0,
        service_charge_percentage: 0,
        cancellation_policy: null,
        confirmation_policy: null,
        channel_property_code: null,
        channel_external_property_ref: null,
        channel_default_rate_plan_code: null,
        channel_default_inventory_code: null,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });

      // Add files if selected
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }
      if (faviconFile) {
        formDataToSend.append('favicon', faviconFile);
      }

      // Add _method for Laravel
      formDataToSend.append('_method', 'POST');

      const response = await settingsApi.updateHotel(formDataToSend);
      setSettings(response.data);
      setFormData(response.data);
      setLogoPreview(response.data.logo_url);
      setFaviconPreview(response.data.favicon_url);
      setLogoFile(null);
      setFaviconFile(null);
      setSuccessMessage(t('success'));
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) {
          const errorMap: Record<string, string> = {};
          Object.entries(error.errors).forEach(([field, messages]) => {
            errorMap[field] = messages[0];
          });
          setErrors(errorMap);
        } else {
          setErrors({ general: error.message });
        }
      } else {
        setErrors({ general: locale === 'ar' ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.' });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(key: keyof HotelSettings, value: string | number) {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: locale === 'ar' ? 'يجب ألا يتجاوز حجم الشعار 2 ميغابايت.' : 'Logo must not exceed 2MB.' }));
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
        setErrors(prev => ({ ...prev, logo: locale === 'ar' ? 'يجب أن يكون الشعار ملف صورة صالحًا (jpg, png, webp, svg).' : 'Logo must be a valid image file (jpg, png, webp, svg).' }));
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      if (errors.logo) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.logo;
          return newErrors;
        });
      }
    }
  }

  function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 512 * 1024) {
        setErrors(prev => ({ ...prev, favicon: locale === 'ar' ? 'يجب ألا يتجاوز حجم الأيقونة المفضلة 512 كيلوبايت.' : 'Favicon must not exceed 512KB.' }));
        return;
      }
      if (!['image/x-icon', 'image/png', 'image/svg+xml'].includes(file.type)) {
        setErrors(prev => ({ ...prev, favicon: locale === 'ar' ? 'يجب أن تكون الأيقونة ملفًا صالحًا (ico, png, svg).' : 'Favicon must be a valid file (ico, png, svg).' }));
        return;
      }
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
      if (errors.favicon) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.favicon;
          return newErrors;
        });
      }
    }
  }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: t('general') },
    { id: 'location', label: t('location') },
    { id: 'operations', label: t('operations') },
    { id: 'financial', label: t('financial') },
    { id: 'booking', label: t('booking') },
    { id: 'channel', label: t('channel') },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{tCommon('loading')}</div>
      </div>
    );
  }

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '22px',
          fontWeight: '600',
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.5px',
          marginBottom: '4px',
        }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>
          {t('description')}
        </p>
      </div>

      {/* Success notification */}
      {successMessage && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexDirection: isRtl ? 'row-reverse' : 'row',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#22c55e', flexShrink: 0 }}>
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: '#22c55e', fontSize: '13.5px', fontWeight: '500' }}>{successMessage}</span>
        </div>
      )}

      {/* Error notification */}
      {errors.general && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexDirection: isRtl ? 'row-reverse' : 'row',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#ef4444', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ color: '#ef4444', fontSize: '13.5px', fontWeight: '500' }}>{errors.general}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '24px',
        overflowX: 'auto',
        flexDirection: isRtl ? 'row-reverse' : 'row',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              background: activeTab === tab.id ? 'var(--color-surface)' : 'transparent',
              border: activeTab === tab.id ? '1px solid var(--color-border)' : '1px solid transparent',
              borderBottom: activeTab === tab.id ? '1px solid var(--color-bg)' : '1px solid var(--color-border)',
              borderRadius: '8px 8px 0 0',
              color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontSize: '13.5px',
              fontWeight: activeTab === tab.id ? '500' : '400',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              marginBottom: activeTab === tab.id ? '-1px' : '0',
            }}
            onMouseEnter={e => {
              if (activeTab !== tab.id) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== tab.id) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form content */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        {activeTab === 'general' && <GeneralTab formData={formData} onChange={handleInputChange} logoPreview={logoPreview} faviconPreview={faviconPreview} onLogoChange={handleLogoChange} onFaviconChange={handleFaviconChange} errors={errors} isRtl={isRtl} t={t} />}
        {activeTab === 'location' && <LocationTab formData={formData} onChange={handleInputChange} errors={errors} t={t} />}
        {activeTab === 'operations' && <OperationsTab formData={formData} onChange={handleInputChange} errors={errors} t={t} />}
        {activeTab === 'financial' && <FinancialTab formData={formData} onChange={handleInputChange} errors={errors} t={t} />}
        {activeTab === 'booking' && <BookingTab formData={formData} onChange={handleInputChange} errors={errors} t={t} />}
        {activeTab === 'channel' && <ChannelTab formData={formData} onChange={handleInputChange} errors={errors} t={t} />}
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            boxShadow: '0 0 12px rgba(99,102,241,0.35)',
            opacity: saving ? 0.7 : 1,
          }}
          onMouseEnter={e => {
            if (!saving) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.45)';
            }
          }}
          onMouseLeave={e => {
            if (!saving) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px rgba(99,102,241,0.35)';
            }
          }}
        >
          {saving ? (locale === 'ar' ? 'جاري الحفظ…' : 'Saving…') : tCommon('saveChanges')}
        </button>
      </div>
    </div>
  );
}

// ─── Tab Components ───────────────────────────────────────────────────────────────

function GeneralTab({ formData, onChange, logoPreview, faviconPreview, onLogoChange, onFaviconChange, errors, isRtl, t }: {
  formData: Partial<HotelSettings>;
  onChange: (key: keyof HotelSettings, value: string | number) => void;
  logoPreview: string | null;
  faviconPreview: string | null;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaviconChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: Record<string, string>;
  isRtl: boolean;
  t: any;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        {t('general')}
      </h3>

      <FormField label={t('hotelName')} required error={errors.hotel_name} isRtl={isRtl}>
        <input
          type="text"
          value={formData.hotel_name || ''}
          onChange={e => onChange('hotel_name', e.target.value)}
          placeholder={t('hotelName')}
          style={{ ...inputStyle, textAlign: isRtl ? 'right' : 'left' }}
        />
      </FormField>

      <FormField label={t('legalName')} error={errors.legal_business_name} isRtl={isRtl}>
        <input
          type="text"
          value={formData.legal_business_name || ''}
          onChange={e => onChange('legal_business_name', e.target.value)}
          placeholder={t('legalName')}
          style={{ ...inputStyle, textAlign: isRtl ? 'right' : 'left' }}
        />
      </FormField>

      <FormField label={t('logo')} error={errors.logo} isRtl={isRtl}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.02)',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-text-muted)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              onChange={onLogoChange}
              style={{ display: 'none' }}
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLLabelElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--color-text-muted)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLLabelElement).style.background = 'var(--color-surface)';
                (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--color-border)';
              }}
            >
              {isRtl ? 'اختر ملفاً' : 'Choose File'}
            </label>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '6px' }}>
              {t('logoHelp')}
            </p>
          </div>
        </div>
      </FormField>

      <FormField label={t('favicon')} error={errors.favicon} isRtl={isRtl}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.02)',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {faviconPreview ? (
              <img src={faviconPreview} alt="Favicon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-text-muted)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>
            <input
              type="file"
              accept="image/x-icon,image/png,image/svg+xml"
              onChange={onFaviconChange}
              style={{ display: 'none' }}
              id="favicon-upload"
            />
            <label
              htmlFor="favicon-upload"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLLabelElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--color-text-muted)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLLabelElement).style.background = 'var(--color-surface)';
                (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--color-border)';
              }}
            >
              {isRtl ? 'اختر ملفاً' : 'Choose File'}
            </label>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '6px' }}>
              {t('faviconHelp')}
            </p>
          </div>
        </div>
      </FormField>

      <FormField label={t('email')} error={errors.contact_email} isRtl={isRtl}>
        <input
          type="email"
          value={formData.contact_email || ''}
          onChange={e => onChange('contact_email', e.target.value)}
          placeholder="contact@hotel.com"
          style={{ ...inputStyle, textAlign: 'left' }}
        />
      </FormField>

      <FormField label={t('phone')} error={errors.contact_phone} isRtl={isRtl}>
        <input
          type="tel"
          value={formData.contact_phone || ''}
          onChange={e => onChange('contact_phone', e.target.value)}
          placeholder="+1 234 567 8900"
          style={{ ...inputStyle, textAlign: 'left' }}
        />
      </FormField>

      <FormField label={t('website')} error={errors.website_url} isRtl={isRtl}>
        <input
          type="url"
          value={formData.website_url || ''}
          onChange={e => onChange('website_url', e.target.value)}
          placeholder="https://www.hotel.com"
          style={{ ...inputStyle, textAlign: 'left' }}
        />
      </FormField>
    </div>
  );
}

function LocationTab({ formData, onChange, errors, t }: {
  formData: Partial<HotelSettings>;
  onChange: (key: keyof HotelSettings, value: string | number) => void;
  errors: Record<string, string>;
  t: any;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        {t('location')}
      </h3>

      <FormField label={t('country')} error={errors.country}>
        <input
          type="text"
          value={formData.country || ''}
          onChange={e => onChange('country', e.target.value)}
          placeholder="e.g. Egypt"
          style={inputStyle}
        />
      </FormField>

      <FormField label={t('city')} error={errors.city}>
        <input
          type="text"
          value={formData.city || ''}
          onChange={e => onChange('city', e.target.value)}
          placeholder="e.g. Cairo"
          style={inputStyle}
        />
      </FormField>

      <FormField label={t('address')} error={errors.address}>
        <input
          type="text"
          value={formData.address || ''}
          onChange={e => onChange('address', e.target.value)}
          placeholder="e.g. 123 Nile Street"
          style={inputStyle}
        />
      </FormField>

      <FormField label={t('postal')} error={errors.postal_code}>
        <input
          type="text"
          value={formData.postal_code || ''}
          onChange={e => onChange('postal_code', e.target.value)}
          placeholder="11511"
          style={inputStyle}
        />
      </FormField>
    </div>
  );
}

function OperationsTab({ formData, onChange, errors, t }: {
  formData: Partial<HotelSettings>;
  onChange: (key: keyof HotelSettings, value: string | number) => void;
  errors: Record<string, string>;
  t: any;
}) {
  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Dubai',
    'Africa/Cairo', 'Africa/Riyadh', 'Australia/Sydney', 'Pacific/Auckland',
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'AED', 'EGP', 'SAR', 'KWD'];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        {t('operations')}
      </h3>

      <FormField label={t('timezone')} error={errors.timezone}>
        <select
          value={formData.timezone || 'UTC'}
          onChange={e => onChange('timezone', e.target.value)}
          style={inputStyle}
        >
          {timezones.map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </FormField>

      <FormField label={t('currency')} error={errors.currency}>
        <select
          value={formData.currency || 'USD'}
          onChange={e => onChange('currency', e.target.value)}
          style={inputStyle}
        >
          {currencies.map(curr => (
            <option key={curr} value={curr}>{curr}</option>
          ))}
        </select>
      </FormField>

      <FormField label={t('defaultLang')} error={errors.default_language}>
        <select
          value={formData.default_language || 'en'}
          onChange={e => onChange('default_language', e.target.value)}
          style={inputStyle}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </FormField>

      <FormField label={t('checkInTime')} error={errors.check_in_time}>
        <input
          type="time"
          value={formData.check_in_time || '14:00'}
          onChange={e => onChange('check_in_time', e.target.value)}
          style={inputStyle}
        />
      </FormField>

      <FormField label={t('checkOutTime')} error={errors.check_out_time}>
        <input
          type="time"
          value={formData.check_out_time || '11:00'}
          onChange={e => onChange('check_out_time', e.target.value)}
          style={inputStyle}
        />
      </FormField>
    </div>
  );
}

function FinancialTab({ formData, onChange, errors, t }: {
  formData: Partial<HotelSettings>;
  onChange: (key: keyof HotelSettings, value: string | number) => void;
  errors: Record<string, string>;
  t: any;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        {t('financial')}
      </h3>

      <FormField label={t('taxPercent')} error={errors.tax_percentage}>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={formData.tax_percentage ?? 0}
          onChange={e => onChange('tax_percentage', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          style={inputStyle}
        />
      </FormField>

      <FormField label={t('servicePercent')} error={errors.service_charge_percentage}>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={formData.service_charge_percentage ?? 0}
          onChange={e => onChange('service_charge_percentage', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          style={inputStyle}
        />
      </FormField>
    </div>
  );
}

function BookingTab({ formData, onChange, errors, t }: {
  formData: Partial<HotelSettings>;
  onChange: (key: keyof HotelSettings, value: string | number) => void;
  errors: Record<string, string>;
  t: any;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        {t('booking')}
      </h3>

      <FormField label={t('cancellationPolicy')} error={errors.cancellation_policy}>
        <textarea
          value={formData.cancellation_policy || ''}
          onChange={e => onChange('cancellation_policy', e.target.value)}
          placeholder="..."
          rows={4}
          style={textareaStyle}
        />
      </FormField>

      <FormField label={t('confirmationPolicy')} error={errors.confirmation_policy}>
        <textarea
          value={formData.confirmation_policy || ''}
          onChange={e => onChange('confirmation_policy', e.target.value)}
          placeholder="..."
          rows={4}
          style={textareaStyle}
        />
      </FormField>
    </div>
  );
}

function ChannelTab({ formData, onChange, errors, t }: {
  formData: Partial<HotelSettings>;
  onChange: (key: keyof HotelSettings, value: string | number) => void;
  errors: Record<string, string>;
  t: any;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        {t('channel')}
      </h3>

      <FormField label={t('propertyCode')} error={errors.channel_property_code}>
        <input
          type="text"
          value={formData.channel_property_code || ''}
          onChange={e => onChange('channel_property_code', e.target.value)}
          placeholder="e.g. PROP-001"
          style={inputStyle}
        />
      </FormField>

      <FormField label={t('extRef')} error={errors.channel_external_property_ref}>
        <input
          type="text"
          value={formData.channel_external_property_ref || ''}
          onChange={e => onChange('channel_external_property_ref', e.target.value)}
          placeholder="e.g. EXT-REF-12345"
          style={inputStyle}
        />
      </FormField>

      <FormField label={t('ratePlanCode')} error={errors.channel_default_rate_plan_code}>
        <input
          type="text"
          value={formData.channel_default_rate_plan_code || ''}
          onChange={e => onChange('channel_default_rate_plan_code', e.target.value)}
          placeholder="e.g. RATE-STD"
          style={inputStyle}
        />
      </FormField>

      <FormField label={t('inventoryCode')} error={errors.channel_default_inventory_code}>
        <input
          type="text"
          value={formData.channel_default_inventory_code || ''}
          onChange={e => onChange('channel_default_inventory_code', e.target.value)}
          placeholder="e.g. INV-001"
          style={inputStyle}
        />
      </FormField>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────────

function FormField({ label, required = false, error, children, isRtl }: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  isRtl?: boolean;
}) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: '500',
        color: 'var(--color-text-primary)',
        marginBottom: '6px',
      }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: isRtl ? '0' : '2px', marginRight: isRtl ? '2px' : '0' }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</p>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  transition: 'all 0.15s',
  outline: 'none',
};

const textareaStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  transition: 'all 0.15s',
  outline: 'none',
  resize: 'vertical' as const,
  fontFamily: 'inherit',
};
