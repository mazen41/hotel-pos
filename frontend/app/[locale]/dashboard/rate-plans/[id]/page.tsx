'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ratePlansApi, ApiError } from '@/lib/api';
import type { RatePlan } from '@/types';
import RatePlanModal from '@/components/rate-plans/RatePlanModal';
import { useLocale, useTranslations } from 'next-intl';

export default function RatePlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ratePlanId = parseInt(params.id as string);
  
  const [ratePlan, setRatePlan] = useState<RatePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'seasonal' | 'dynamic' | 'restrictions' | 'history'>('details');
  const [showEditModal, setShowEditModal] = useState(false);

  const locale = useLocale();
  const t = useTranslations('ratePlans');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  useEffect(() => {
    fetchRatePlan();
  }, [ratePlanId]);

  async function fetchRatePlan() {
    setLoading(true);
    try {
      const response = await ratePlansApi.get(ratePlanId);
      setRatePlan(response.data);
    } catch (error) {
      console.error('Error fetching rate plan:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    if (!ratePlan) return;
    try {
      if (ratePlan.active) {
        await ratePlansApi.deactivate(ratePlan.id);
        setSuccessMessage(locale === 'ar' ? 'تم إلغاء تنشيط خطة الأسعار بنجاح!' : 'Rate plan deactivated successfully!');
      } else {
        await ratePlansApi.activate(ratePlan.id);
        setSuccessMessage(locale === 'ar' ? 'تم تنشيط خطة الأسعار بنجاح!' : 'Rate plan activated successfully!');
      }
      await fetchRatePlan();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (locale === 'ar' ? 'فشل في تغيير حالة خطة الأسعار' : 'Failed to toggle rate plan status'));
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

  const getMealPlanLabel = (mp: string) => {
    switch (mp) {
      case 'BB': return locale === 'ar' ? 'مبيت وإفطار (BB)' : 'Bed & Breakfast (BB)';
      case 'HB': return locale === 'ar' ? 'نصف إقامة (HB)' : 'Half Board (HB)';
      case 'FB': return locale === 'ar' ? 'إقامة كاملة (FB)' : 'Full Board (FB)';
      case 'AI': return locale === 'ar' ? 'شامل كلياً (AI)' : 'All Inclusive (AI)';
      case 'RO': return locale === 'ar' ? 'غرفة فقط (RO)' : 'Room Only (RO)';
      default: return mp;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>{locale === 'ar' ? 'جاري تحميل تفاصيل خطة الأسعار...' : 'Loading rate plan details...'}</div>
      </div>
    );
  }

  if (!ratePlan) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>{locale === 'ar' ? 'خطة الأسعار غير موجودة' : 'Rate plan not found'}</div>
      </div>
    );
  }

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              transform: isRtl ? 'rotate(180deg)' : 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="19" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="12 19 5 12 12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 style={{
            fontSize: '22px',
            fontWeight: '600',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.5px',
          }}>
            {ratePlan.name}
          </h1>
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

      {/* Status badges */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
        <span style={{
          fontSize: '13px',
          padding: '6px 12px',
          borderRadius: '16px',
          fontWeight: '600',
          background: getTypeColor(ratePlan.type).bg,
          color: getTypeColor(ratePlan.type).text,
        }}>
          {getRatePlanTypeLabel(ratePlan.type).toUpperCase()}
        </span>
        <span style={{
          fontSize: '13px',
          padding: '6px 12px',
          borderRadius: '16px',
          fontWeight: '600',
          background: getPricingTypeColor(ratePlan.pricing_type).bg,
          color: getPricingTypeColor(ratePlan.pricing_type).text,
        }}>
          {getPricingTypeLabel(ratePlan.pricing_type).toUpperCase()}
        </span>
        <span style={{
          fontSize: '13px',
          padding: '6px 12px',
          borderRadius: '16px',
          fontWeight: '600',
          background: ratePlan.active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: ratePlan.active ? '#22c55e' : '#ef4444',
        }}>
          {ratePlan.active ? tCommon('active').toUpperCase() : tCommon('inactive').toUpperCase()}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowEditModal(true)}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 0 12px rgba(99,102,241,0.35)',
          }}
        >
          {locale === 'ar' ? '✏️ تعديل خطة الأسعار' : '✏️ Edit Rate Plan'}
        </button>
        <button
          onClick={handleToggleActive}
          style={{
            padding: '10px 20px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          {ratePlan.active 
            ? (locale === 'ar' ? '⏸️ إلغاء التنشيط' : '⏸️ Deactivate') 
            : (locale === 'ar' ? '▶️ تنشيط' : '▶️ Activate')}
        </button>
        <button
          onClick={() => router.push(`/${locale}/dashboard/rate-plans`)}
          style={{
            padding: '10px 20px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          {locale === 'ar' ? 'العودة للقائمة' : 'Back to List'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '2px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '24px',
        flexDirection: isRtl ? 'row-reverse' : 'row',
        overflowX: 'auto',
      }}>
        <button
          onClick={() => setActiveTab('details')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'details' ? '2px solid #6366f1' : 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'details' ? '600' : '400',
            background: activeTab === 'details' ? 'rgba(99,102,241,0.05)' : 'transparent',
            color: activeTab === 'details' ? '#6366f1' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {locale === 'ar' ? 'التفاصيل' : 'Details'}
        </button>
        <button
          onClick={() => setActiveTab('seasonal')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'seasonal' ? '2px solid #6366f1' : 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'seasonal' ? '600' : '400',
            background: activeTab === 'seasonal' ? 'rgba(99,102,241,0.05)' : 'transparent',
            color: activeTab === 'seasonal' ? '#6366f1' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {locale === 'ar' ? `الأسعار الموسمية (${ratePlan.seasonal_rates.length})` : `Seasonal Rates (${ratePlan.seasonal_rates.length})`}
        </button>
        <button
          onClick={() => setActiveTab('dynamic')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'dynamic' ? '2px solid #6366f1' : 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'dynamic' ? '600' : '400',
            background: activeTab === 'dynamic' ? 'rgba(99,102,241,0.05)' : 'transparent',
            color: activeTab === 'dynamic' ? '#6366f1' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {locale === 'ar' ? `القواعد الديناميكية (${ratePlan.dynamic_pricing_rules.length})` : `Dynamic Rules (${ratePlan.dynamic_pricing_rules.length})`}
        </button>
        <button
          onClick={() => setActiveTab('restrictions')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'restrictions' ? '2px solid #6366f1' : 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'restrictions' ? '600' : '400',
            background: activeTab === 'restrictions' ? 'rgba(99,102,241,0.05)' : 'transparent',
            color: activeTab === 'restrictions' ? '#6366f1' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {locale === 'ar' ? `القيود (${ratePlan.restrictions.length})` : `Restrictions (${ratePlan.restrictions.length})`}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid #6366f1' : 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'history' ? '600' : '400',
            background: activeTab === 'history' ? 'rgba(99,102,241,0.05)' : 'transparent',
            color: activeTab === 'history' ? '#6366f1' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {locale === 'ar' ? 'سجل العمليات' : 'History'}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {/* Basic Information */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{locale === 'ar' ? 'الاسم' : 'Name'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                {ratePlan.name}
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{tCommon('description')}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                {ratePlan.description || '-'}
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{locale === 'ar' ? 'الأولوية' : 'Priority'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                {ratePlan.priority}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{tCommon('status')}</div>
              <div style={{ fontSize: '14px', color: ratePlan.active ? '#22c55e' : '#ef4444', fontWeight: '500' }}>
                {ratePlan.active ? tCommon('active') : tCommon('inactive')}
              </div>
            </div>
          </div>

          {/* Pricing Configuration */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {locale === 'ar' ? 'إعدادات الأسعار' : 'Pricing Configuration'}
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{t('baseRate')}</div>
              <div style={{ fontSize: '18px', color: '#6366f1', fontWeight: '700' }}>
                {isRtl ? `${ratePlan.base_rate.toFixed(2)} $` : `$${ratePlan.base_rate.toFixed(2)}`}
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{locale === 'ar' ? 'الحد الأدنى لليالي' : 'Minimum Nights'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                {ratePlan.min_nights || (locale === 'ar' ? 'لا يوجد حد أدنى' : 'No minimum')}
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{locale === 'ar' ? 'الحد الأقصى لليالي' : 'Maximum Nights'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                {ratePlan.max_nights || (locale === 'ar' ? 'لا يوجد حد أقصى' : 'No maximum')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{locale === 'ar' ? 'سعر السرير الإضافي' : 'Extra Bed Price'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                {ratePlan.extra_bed_price 
                  ? (isRtl ? `${ratePlan.extra_bed_price.toFixed(2)} $` : `$${ratePlan.extra_bed_price.toFixed(2)}`) 
                  : (locale === 'ar' ? 'غير مسموح' : 'Not allowed')}
              </div>
            </div>
          </div>

          {/* Room Type Rates */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {locale === 'ar' ? 'أسعار أنواع الغرف' : 'Room Type Rates'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ratePlan.room_types.map((roomTypeRate) => (
                <div key={roomTypeRate.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--color-background)', borderRadius: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                      {roomTypeRate.name}
                    </div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#6366f1' }}>
                    {isRtl ? `${roomTypeRate.rate.toFixed(2)} $` : `$${roomTypeRate.rate.toFixed(2)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {locale === 'ar' ? 'خيارات إضافية' : 'Additional Options'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{locale === 'ar' ? 'تسعير على أساس الإشغال' : 'Occupancy-based pricing'}</span>
                <span style={{ fontSize: '14px', color: ratePlan.occupancy_based_pricing ? '#22c55e' : 'var(--color-text-secondary)' }}>
                  {ratePlan.occupancy_based_pricing ? '✓' : '✗'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{locale === 'ar' ? 'السماح بالأطفال' : 'Allow children'}</span>
                <span style={{ fontSize: '14px', color: ratePlan.allow_children ? '#22c55e' : 'var(--color-text-secondary)' }}>
                  {ratePlan.allow_children ? '✓' : '✗'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{locale === 'ar' ? 'السماح بالأسرة الإضافية' : 'Allow extra beds'}</span>
                <span style={{ fontSize: '14px', color: ratePlan.allow_extra_beds ? '#22c55e' : 'var(--color-text-secondary)' }}>
                  {ratePlan.allow_extra_beds ? '✓' : '✗'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  {locale === 'ar' 
                    ? `تضمين خطة الوجبات (${getMealPlanLabel(ratePlan.meal_plan_type || 'None')})` 
                    : `Meal plan included (${ratePlan.meal_plan_type || 'None'})`}
                </span>
                <span style={{ fontSize: '14px', color: ratePlan.meal_plan_included ? '#22c55e' : 'var(--color-text-secondary)' }}>
                  {ratePlan.meal_plan_included ? '✓' : '✗'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{locale === 'ar' ? 'تفعيل مزامنة القنوات' : 'Channel sync enabled'}</span>
                <span style={{ fontSize: '14px', color: ratePlan.channel_sync_enabled ? '#22c55e' : 'var(--color-text-secondary)' }}>
                  {ratePlan.channel_sync_enabled ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
            gridColumn: 'span 2',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {locale === 'ar' ? 'السياسات' : 'Policies'}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{locale === 'ar' ? 'سياسة الإلغاء' : 'Cancellation Policy'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                {ratePlan.cancellation_policy || (locale === 'ar' ? 'لا توجد سياسة إلغاء محددة' : 'No cancellation policy specified')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{locale === 'ar' ? 'سياسة الدفع' : 'Payment Policy'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                {ratePlan.payment_policy || (locale === 'ar' ? 'لا توجد سياسة دفع محددة' : 'No payment policy specified')}
              </div>
            </div>
          </div>

          {/* Available Channels */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {locale === 'ar' ? 'القنوات المتاحة' : 'Available Channels'}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              {ratePlan.available_channels.map((channel) => (
                <span key={channel} style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontWeight: '600',
                  background: 'rgba(99,102,241,0.1)',
                  color: '#6366f1',
                }}>
                  {channel.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          {/* Timestamps */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {locale === 'ar' ? 'التواريخ' : 'Timestamps'}
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{locale === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                {new Date(ratePlan.created_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{locale === 'ar' ? 'تاريخ التحديث' : 'Updated At'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                {new Date(ratePlan.updated_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seasonal' && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            {locale === 'ar' ? 'الأسعار الموسمية' : 'Seasonal Rates'}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            {locale === 'ar' 
              ? 'إدارة تعديلات الأسعار الموسمية للعطلات ومواسم الذروة والمناسبات الخاصة.' 
              : 'Manage seasonal pricing adjustments for holidays, peak seasons, and special events.'}
          </p>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {locale === 'ar' 
                ? `الأسعار الموسمية الحالية: <strong>${ratePlan.seasonal_rates.length}</strong>` 
                : `Current seasonal rates: <strong>${ratePlan.seasonal_rates.length}</strong>`}
            </span>
          </div>
          <button
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
            {locale === 'ar' ? '+ إضافة سعر موسمي' : '+ Add Seasonal Rate'}
          </button>
        </div>
      )}

      {activeTab === 'dynamic' && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 2l4 4m-4-4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            {locale === 'ar' ? 'قواعد الأسعار الديناميكية' : 'Dynamic Pricing Rules'}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            {locale === 'ar' 
              ? 'إعداد قواعد التسعير الآلية بناءً على نسبة الإشغال والمدة الزمنية ويوم الأسبوع والفعاليات.' 
              : 'Set up automated pricing rules based on occupancy, lead time, day of week, and events.'}
          </p>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {locale === 'ar' 
                ? `القواعد الديناميكية الحالية: <strong>${ratePlan.dynamic_pricing_rules.length}</strong>` 
                : `Current dynamic rules: <strong>${ratePlan.dynamic_pricing_rules.length}</strong>`}
            </span>
          </div>
          <button
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
            {locale === 'ar' ? '+ إضافة قاعدة ديناميكية' : '+ Add Dynamic Rule'}
          </button>
        </div>
      )}

      {activeTab === 'restrictions' && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            {locale === 'ar' ? 'قيود الأسعار' : 'Rate Restrictions'}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            {locale === 'ar' 
              ? 'إدارة تواريخ الإغلاق، والحد الأدنى والحد الأقصى للإقامة، وقيود الحجز.' 
              : 'Manage blackout dates, minimum/maximum stay requirements, and booking restrictions.'}
          </p>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {locale === 'ar' 
                ? `القيود الحالية: <strong>${ratePlan.restrictions.length}</strong>` 
                : `Current restrictions: <strong>${ratePlan.restrictions.length}</strong>`}
            </span>
          </div>
          <button
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
            {locale === 'ar' ? '+ إضافة قيد' : '+ Add Restriction'}
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            {locale === 'ar' ? 'سجل النشاطات' : 'Activity History'}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {locale === 'ar' 
              ? 'سجل النشاطات وتفاصيل التغييرات سيتم إضافتها في تحديث مستقبلي.' 
              : 'Activity history and audit trail will be implemented in a future update.'}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <RatePlanModal
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            fetchRatePlan();
            setShowEditModal(false);
            setSuccessMessage(locale === 'ar' ? 'تم تحديث خطة الأسعار بنجاح!' : 'Rate plan updated successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
          editRatePlan={ratePlan}
        />
      )}
    </div>
  );
}
