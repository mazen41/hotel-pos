'use client';

import { useEffect, useState } from 'react';
import { ratePlansApi, ApiError } from '@/lib/api';
import type { RatePlan } from '@/types';
import RatePlanModal from '@/components/rate-plans/RatePlanModal';
import { useLocale, useTranslations } from 'next-intl';

export default function RatePlansPage() {
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRatePlanModal, setShowRatePlanModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  
  // Filters
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  
  // Sorting
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const locale = useLocale();
  const t = useTranslations('ratePlans');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  useEffect(() => {
    fetchRatePlans();
  }, [filterActive, filterType, sortBy, sortDirection]);

  async function fetchRatePlans() {
    try {
      const response = await ratePlansApi.list({
        search: searchTerm || undefined,
        active: filterActive !== null ? filterActive : undefined,
        sort: sortBy,
        direction: sortDirection,
        per_page: 50
      });
      setRatePlans(response.data);
    } catch (error) {
      console.error('Error fetching rate plans:', error);
      setRatePlans([]);
    } finally {
      setLoading(false);
    }
  }

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm !== undefined) {
        setLoading(true);
        fetchRatePlans();
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  }

  async function handleToggleActive(ratePlan: RatePlan) {
    try {
      if (ratePlan.active) {
        await ratePlansApi.deactivate(ratePlan.id);
        setSuccessMessage(locale === 'ar' ? 'تم إلغاء تنشيط خطة الأسعار بنجاح!' : 'Rate plan deactivated successfully!');
      } else {
        await ratePlansApi.activate(ratePlan.id);
        setSuccessMessage(locale === 'ar' ? 'تم تنشيط خطة الأسعار بنجاح!' : 'Rate plan activated successfully!');
      }
      await fetchRatePlans();
      setActionMenu(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (locale === 'ar' ? 'فشل في تغيير حالة خطة الأسعار' : 'Failed to toggle rate plan status'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  async function handleDuplicate(ratePlan: RatePlan) {
    const promptMsg = locale === 'ar' 
      ? `نسخ خطة الأسعار "${ratePlan.name}"\nأدخل الاسم الجديد للنسخة:` 
      : `Duplicate "${ratePlan.name}"\nEnter new name for the copy:`;
    const newName = prompt(promptMsg);
    if (!newName) return;

    try {
      await ratePlansApi.duplicate(ratePlan.id, { name: newName });
      setSuccessMessage(locale === 'ar' ? 'تم نسخ خطة الأسعار بنجاح!' : 'Rate plan duplicated successfully!');
      await fetchRatePlans();
      setActionMenu(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (locale === 'ar' ? 'فشل في نسخ خطة الأسعار' : 'Failed to duplicate rate plan'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  async function handleDelete(ratePlan: RatePlan) {
    const confirmMsg = locale === 'ar' 
      ? `هل تريد حذف خطة الأسعار "${ratePlan.name}"؟\n\nلا يمكن التراجع عن هذا الإجراء.` 
      : `Delete rate plan "${ratePlan.name}"?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    try {
      await ratePlansApi.delete(ratePlan.id);
      setSuccessMessage(t('successDelete'));
      await fetchRatePlans();
      setActionMenu(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || t('successDelete')); // Use fallback
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  function getTypeColor(type: string): { bg: string; text: string } {
    const colors: Record<string, { bg: string; text: string }> = {
      standard: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
      corporate: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1' },
      seasonal: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
      package: { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308' },
      promotional: { bg: 'rgba(244, 63, 94, 0.1)', text: '#f43f5e' },
    };
    return colors[type] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
  }

  const getRatePlanTypeLabel = (type: string) => {
    switch (type) {
      case 'standard': return locale === 'ar' ? 'قياسي' : 'Standard';
      case 'corporate': return locale === 'ar' ? 'شركات' : 'Corporate';
      case 'seasonal': return locale === 'ar' ? 'موسمي' : 'Seasonal';
      case 'package': return locale === 'ar' ? 'باقة شاملة' : 'Package';
      case 'promotional': return locale === 'ar' ? 'ترويجي' : 'Promotional';
      default: return type;
    }
  };

  function getPricingTypeColor(type: string): { bg: string; text: string } {
    const colors: Record<string, { bg: string; text: string }> = {
      fixed: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
      percentage: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
      per_person: { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308' },
      per_night: { bg: 'rgba(244, 63, 94, 0.1)', text: '#f43f5e' },
    };
    return colors[type] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
  }

  const getPricingTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed': return locale === 'ar' ? 'سعر ثابت' : 'Fixed Rate';
      case 'percentage': return locale === 'ar' ? 'نسبة مئوية' : 'Percentage';
      case 'per_person': return locale === 'ar' ? 'لكل شخص' : 'Per Person';
      case 'per_night': return locale === 'ar' ? 'لكل ليلة' : 'Per Night';
      default: return type;
    }
  };

  const sortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <div>
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
              {t('subtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowRatePlanModal(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 0 12px rgba(99,102,241,0.35)',
            }}
          >
            {t('addRatePlan')}
          </button>
        </div>
      </div>

      {/* Success notification */}
      {successMessage && (
        <div style={{
          background: successMessage.includes('Failed') || successMessage.includes('فشل') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          border: successMessage.includes('Failed') || successMessage.includes('فشل') ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: successMessage.includes('Failed') || successMessage.includes('فشل') ? '#ef4444' : '#22c55e',
          flexDirection: isRtl ? 'row-reverse' : 'row',
        }}>
          {successMessage}
        </div>
      )}

      {/* Search and Filters */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          {/* Search */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: isRtl ? 'auto' : '12px', right: isRtl ? '12px' : 'auto', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: isRtl ? '10px 40px 10px 12px' : '10px 12px 10px 40px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'var(--color-background)',
                  color: 'var(--color-text-primary)',
                  textAlign: isRtl ? 'right' : 'left',
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filterActive === null ? '' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => {
              const value = e.target.value;
              setFilterActive(value === '' ? null : value === 'active');
            }}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: 'var(--color-background)',
              color: 'var(--color-text-primary)',
              direction: isRtl ? 'rtl' : 'ltr',
            }}
          >
            <option value="">{t('allStatus')}</option>
            <option value="active">{tCommon('active')}</option>
            <option value="inactive">{tCommon('inactive')}</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: 'var(--color-background)',
              color: 'var(--color-text-primary)',
              direction: isRtl ? 'rtl' : 'ltr',
            }}
          >
            <option value="">{t('allTypes')}</option>
            <option value="standard">{getRatePlanTypeLabel('standard')}</option>
            <option value="corporate">{getRatePlanTypeLabel('corporate')}</option>
            <option value="seasonal">{getRatePlanTypeLabel('seasonal')}</option>
            <option value="package">{getRatePlanTypeLabel('package')}</option>
            <option value="promotional">{getRatePlanTypeLabel('promotional')}</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterActive(null);
              setFilterType('');
            }}
            style={{
              padding: '10px 16px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            {tCommon('clearFilters')}
          </button>
        </div>
      </div>

      {/* Rate Plans Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          {tCommon('loading')}
        </div>
      ) : ratePlans.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="17" y1="5" x2="7" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="17" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="17" y1="19" x2="7" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            {t('noRatePlans')}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            {searchTerm || filterActive !== null || filterType
              ? (locale === 'ar' ? 'جرّب تعديل البحث أو عوامل التصفية' : 'Try adjusting your search or filters')
              : (locale === 'ar' ? 'ابدأ بإنشاء أول خطة أسعار للفندق' : 'Get started by creating your first rate plan')}
          </p>
          {!searchTerm && filterActive === null && !filterType && (
            <button
              onClick={() => setShowRatePlanModal(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {t('createRatePlan')}
            </button>
          )}
        </div>
      ) : (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden',
          overflowX: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }} onClick={() => handleSort('name')}>
                  {tCommon('name')} {sortIcon('name')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {tCommon('type')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {t('pricingType')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }} onClick={() => handleSort('base_rate')}>
                  {t('baseRate')} {sortIcon('base_rate')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {locale === 'ar' ? 'خطة الوجبات' : 'Meal Plan'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {locale === 'ar' ? 'أنواع الغرف' : 'Room Types'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {locale === 'ar' ? 'الأسعار الموسمية' : 'Seasonal Rates'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {tCommon('status')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: 'center' }} onClick={() => handleSort('priority')}>
                  {locale === 'ar' ? 'الأولوية' : 'Priority'} {sortIcon('priority')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'left' : 'right' }}>
                  {tCommon('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {ratePlans.map((ratePlan) => (
                <tr key={ratePlan.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', fontSize: '14px', marginBottom: '4px' }}>
                      {ratePlan.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {ratePlan.description || (locale === 'ar' ? 'لا يوجد وصف' : 'No description')}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      background: getTypeColor(ratePlan.type).bg,
                      color: getTypeColor(ratePlan.type).text,
                    }}>
                      {getRatePlanTypeLabel(ratePlan.type).toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      background: getPricingTypeColor(ratePlan.pricing_type).bg,
                      color: getPricingTypeColor(ratePlan.pricing_type).text,
                    }}>
                      {getPricingTypeLabel(ratePlan.pricing_type).toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                    {locale === 'ar' ? `${ratePlan.base_rate.toFixed(2)} $` : `$${ratePlan.base_rate.toFixed(2)}`}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {ratePlan.meal_plan_included && ratePlan.meal_plan_type ? (
                      <span style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontWeight: '500',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366f1',
                      }}>
                        {getMealPlanLabel(ratePlan.meal_plan_type)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-primary)', textAlign: 'center', fontWeight: '500' }}>
                    {ratePlan.room_types.length}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-primary)', textAlign: 'center', fontWeight: '500' }}>
                    {ratePlan.seasonal_rates.length}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      background: ratePlan.active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: ratePlan.active ? '#22c55e' : '#ef4444',
                    }}>
                      {ratePlan.active ? tCommon('active').toUpperCase() : tCommon('inactive').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-primary)', textAlign: 'center', fontWeight: '500' }}>
                    {ratePlan.priority}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: isRtl ? 'left' : 'right', position: 'relative' }}>
                    <button
                      onClick={() => setActionMenu(actionMenu === ratePlan.id ? null : ratePlan.id)}
                      style={{
                        padding: '6px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
 
                    {actionMenu === ratePlan.id && (
                      <div style={{
                        position: 'absolute',
                        right: isRtl ? 'auto' : '0',
                        left: isRtl ? '0' : 'auto',
                        top: '100%',
                        zIndex: 100,
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        minWidth: '180px',
                        padding: '6px',
                      }}>
                        <button
                          onClick={() => {
                            window.location.href = `/${locale}/dashboard/rate-plans/${ratePlan.id}`;
                            setActionMenu(null);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: 'none',
                            background: 'transparent',
                            textAlign: isRtl ? 'right' : 'left',
                            fontSize: '14px',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexDirection: isRtl ? 'row-reverse' : 'row',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>{locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}</span>
                        </button>
                        <button
                          onClick={() => handleToggleActive(ratePlan)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: 'none',
                            background: 'transparent',
                            textAlign: isRtl ? 'right' : 'left',
                            fontSize: '14px',
                            color: ratePlan.active ? '#ef4444' : '#22c55e',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexDirection: isRtl ? 'row-reverse' : 'row',
                          }}
                        >
                          {ratePlan.active ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span>{locale === 'ar' ? 'إلغاء التنشيط' : 'Deactivate'}</span>
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span>{locale === 'ar' ? 'تنشيط' : 'Activate'}</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDuplicate(ratePlan)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: 'none',
                            background: 'transparent',
                            textAlign: isRtl ? 'right' : 'left',
                            fontSize: '14px',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexDirection: isRtl ? 'row-reverse' : 'row',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>{locale === 'ar' ? 'تكرار' : 'Duplicate'}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(ratePlan)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: 'none',
                            background: 'transparent',
                            textAlign: isRtl ? 'right' : 'left',
                            fontSize: '14px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexDirection: isRtl ? 'row-reverse' : 'row',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>{tCommon('delete')}</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rate Plan Modal */}
      {showRatePlanModal && (
        <RatePlanModal
          onClose={() => setShowRatePlanModal(false)}
          onSuccess={() => {
            fetchRatePlans();
            setShowRatePlanModal(false);
            setSuccessMessage(locale === 'ar' ? 'تم إنشاء خطة الأسعار بنجاح!' : 'Rate plan created successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
}

const getMealPlanLabel = (mp: string) => {
  switch (mp) {
    case 'BB': return 'BB';
    case 'HB': return 'HB';
    case 'FB': return 'FB';
    case 'AI': return 'AI';
    case 'RO': return 'RO';
    default: return mp;
  }
};
