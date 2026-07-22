'use client';

import { useState, useEffect } from 'react';
import { ratePlansApi, roomTypesApi, ApiError } from '@/lib/api';
import type { RatePlan, RatePlanFormData, RoomType } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

interface RatePlanModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editRatePlan?: RatePlan;
}

export default function RatePlanModal({ onClose, onSuccess, editRatePlan }: RatePlanModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);
  
  const locale = useLocale();
  const t = useTranslations('ratePlans');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  const ui = {
    modalTitle: editRatePlan 
      ? (isRtl ? 'تعديل خطة الأسعار' : 'Edit Rate Plan') 
      : (isRtl ? 'خطة أسعار جديدة' : 'New Rate Plan'),
    basicInfo: isRtl ? 'المعلومات الأساسية' : 'Basic Information',
    nameLabel: isRtl ? 'اسم خطة الأسعار *' : 'Rate Plan Name *',
    namePlaceholder: isRtl ? 'مثال: السعر القياسي، باقة الشركات' : 'e.g., Standard Rate, Corporate Package',
    typeLabel: isRtl ? 'نوع خطة الأسعار' : 'Rate Plan Type',
    descriptionLabel: isRtl ? 'الوصف' : 'Description',
    descriptionPlaceholder: isRtl ? 'صف خطة الأسعار هذه...' : 'Describe this rate plan...',
    pricingConfig: isRtl ? 'إعدادات الأسعار' : 'Pricing Configuration',
    baseRateLabel: isRtl ? 'السعر الأساسي *' : 'Base Rate *',
    pricingTypeLabel: isRtl ? 'نوع التسعير' : 'Pricing Type',
    minNightsLabel: isRtl ? 'الحد الأدنى لليالي' : 'Minimum Nights',
    maxNightsLabel: isRtl ? 'الحد الأقصى لليالي' : 'Maximum Nights',
    maxNightsPlaceholder: isRtl ? 'بدون حد أقصى' : 'No limit',
    priorityLabel: isRtl ? 'الأولوية' : 'Priority',
    includeMealPlan: isRtl ? 'تضمين خطة الوجبات' : 'Include Meal Plan',
    mealPlanTypeLabel: isRtl ? 'نوع خطة الوجبات' : 'Meal Plan Type',
    selectMealPlan: isRtl ? 'اختر خطة الوجبات' : 'Select meal plan',
    roomTypeRates: isRtl ? 'أسعار أنواع الغرف' : 'Room Type Rates',
    loadingRoomTypes: isRtl ? 'جاري تحميل أنواع الغرف...' : 'Loading room types...',
    basePriceHelp: isRtl ? 'الأساسي' : 'Base',
    policies: isRtl ? 'السياسات' : 'Policies',
    cancellationPolicyLabel: isRtl ? 'سياسة الإلغاء' : 'Cancellation Policy',
    cancellationPolicyPlaceholder: isRtl ? 'مثال: إلغاء مجاني حتى 24 ساعة قبل موعد الوصول' : 'e.g., Free cancellation up to 24 hours before check-in',
    paymentPolicyLabel: isRtl ? 'سياسة الدفع' : 'Payment Policy',
    paymentPolicyPlaceholder: isRtl ? 'مثال: الدفع الكامل مطلوب عند تسجيل الوصول' : 'e.g., Full payment required at check-in',
    additionalOptions: isRtl ? 'خيارات إضافية' : 'Additional Options',
    occupancyPricing: isRtl ? 'تسعير على أساس الإشغال' : 'Occupancy-based pricing',
    allowChildren: isRtl ? 'السماح بالأطفال' : 'Allow children',
    allowExtraBeds: isRtl ? 'السماح بالأسرة الإضافية' : 'Allow extra beds',
    activeLabel: isRtl ? 'نشط' : 'Active',
    channelSync: isRtl ? 'مزامنة القنوات مفعلة' : 'Channel sync enabled',
    cancel: tCommon('cancel'),
    save: submitting 
      ? (isRtl ? 'جاري الحفظ...' : 'Saving...') 
      : (editRatePlan ? (isRtl ? 'تحديث خطة الأسعار' : 'Update Rate Plan') : (isRtl ? 'إنشاء خطة الأسعار' : 'Create Rate Plan')),
  };

  // Form state
  const [formData, setFormData] = useState<RatePlanFormData>({
    name: '',
    description: '',
    type: 'standard',
    pricing_type: 'fixed',
    base_rate: 0,
    min_nights: null,
    max_nights: null,
    occupancy_based_pricing: false,
    allow_children: true,
    allow_extra_beds: false,
    extra_bed_price: null,
    meal_plan_included: false,
    meal_plan_type: '',
    cancellation_policy: '',
    payment_policy: '',
    active: true,
    priority: 1,
    available_channels: ['direct'],
    room_type_rates: [],
    channel_sync_enabled: false,
  });

  useEffect(() => {
    fetchRoomTypes();
    if (editRatePlan) {
      setFormData({
        name: editRatePlan.name,
        description: editRatePlan.description || '',
        type: editRatePlan.type,
        pricing_type: editRatePlan.pricing_type,
        base_rate: editRatePlan.base_rate,
        min_nights: editRatePlan.min_nights,
        max_nights: editRatePlan.max_nights,
        occupancy_based_pricing: editRatePlan.occupancy_based_pricing,
        allow_children: editRatePlan.allow_children,
        allow_extra_beds: editRatePlan.allow_extra_beds,
        extra_bed_price: editRatePlan.extra_bed_price,
        meal_plan_included: editRatePlan.meal_plan_included,
        meal_plan_type: editRatePlan.meal_plan_type || '',
        cancellation_policy: editRatePlan.cancellation_policy || '',
        payment_policy: editRatePlan.payment_policy || '',
        active: editRatePlan.active,
        priority: editRatePlan.priority,
        available_channels: editRatePlan.available_channels,
        room_type_rates: editRatePlan.room_types.map(rt => ({ room_type_id: rt.id, rate: rt.rate })),
        channel_sync_enabled: editRatePlan.channel_sync_enabled,
      });
    }
  }, [editRatePlan]);

  async function fetchRoomTypes() {
    setLoadingRoomTypes(true);
    try {
      const response = await roomTypesApi.list({ active: true });
      setRoomTypes(response.data);
      
      // Set default room type rates if creating new
      if (!editRatePlan) {
        setFormData(prev => ({
          ...prev,
          room_type_rates: response.data.map(rt => ({ room_type_id: rt.id, rate: rt.base_price })),
        }));
      }
    } catch (error) {
      console.error('Error fetching room types:', error);
    } finally {
      setLoadingRoomTypes(false);
    }
  }

  function handleRoomTypeRateChange(roomTypeId: number, rate: number) {
    setFormData(prev => ({
      ...prev,
      room_type_rates: prev.room_type_rates?.map(rtr =>
        rtr.room_type_id === roomTypeId ? { room_type_id: roomTypeId, rate } : rtr
      ) || [],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editRatePlan) {
        await ratePlansApi.update(editRatePlan.id, formData);
      } else {
        await ratePlansApi.create(formData);
      }
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message || (isRtl ? 'فشل في حفظ خطة الأسعار' : 'Failed to save rate plan'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const getMealPlanLabel = (mp: string) => {
    switch (mp) {
      case 'BB': return isRtl ? 'مبيت وإفطار (BB)' : 'Bed & Breakfast (BB)';
      case 'HB': return isRtl ? 'نصف إقامة (HB)' : 'Half Board (HB)';
      case 'FB': return isRtl ? 'إقامة كاملة (FB)' : 'Full Board (FB)';
      case 'AI': return isRtl ? 'شامل كلياً (AI)' : 'All Inclusive (AI)';
      case 'RO': return isRtl ? 'غرفة فقط (RO)' : 'Room Only (RO)';
      default: return mp;
    }
  };

  const getRatePlanTypeLabel = (type: string) => {
    switch (type) {
      case 'standard': return isRtl ? 'قياسي' : 'Standard';
      case 'corporate': return isRtl ? 'شركات' : 'Corporate';
      case 'seasonal': return isRtl ? 'موسمي' : 'Seasonal';
      case 'package': return isRtl ? 'باقة شاملة' : 'Package';
      case 'promotional': return isRtl ? 'ترويجي' : 'Promotional';
      default: return type;
    }
  };

  const getPricingTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed': return isRtl ? 'سعر ثابت' : 'Fixed Rate';
      case 'percentage': return isRtl ? 'نسبة مئوية' : 'Percentage';
      case 'per_person': return isRtl ? 'لكل شخص' : 'Per Person';
      case 'per_night': return isRtl ? 'لكل ليلة' : 'Per Night';
      default: return type;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      direction: isRtl ? 'rtl' : 'ltr',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '16px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid var(--color-border)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        textAlign: isRtl ? 'right' : 'left',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'var(--color-surface)',
          zIndex: 10,
          flexDirection: isRtl ? 'row-reverse' : 'row',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
            {ui.modalTitle}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '8px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Basic Information */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {ui.basicInfo}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {ui.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={ui.namePlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px',
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

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {ui.typeLabel}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    direction: isRtl ? 'rtl' : 'ltr',
                  }}
                >
                  <option value="standard">{getRatePlanTypeLabel('standard')}</option>
                  <option value="corporate">{getRatePlanTypeLabel('corporate')}</option>
                  <option value="seasonal">{getRatePlanTypeLabel('seasonal')}</option>
                  <option value="package">{getRatePlanTypeLabel('package')}</option>
                  <option value="promotional">{getRatePlanTypeLabel('promotional')}</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {ui.descriptionLabel}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder={ui.descriptionPlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    textAlign: isRtl ? 'right' : 'left',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Pricing Configuration */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {ui.pricingConfig}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {ui.baseRateLabel}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.base_rate}
                  onChange={(e) => setFormData({ ...formData, base_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    textAlign: 'left',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {ui.pricingTypeLabel}
                </label>
                <select
                  value={formData.pricing_type}
                  onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    direction: isRtl ? 'rtl' : 'ltr',
                  }}
                >
                  <option value="fixed">{getPricingTypeLabel('fixed')}</option>
                  <option value="percentage">{getPricingTypeLabel('percentage')}</option>
                  <option value="per_person">{getPricingTypeLabel('per_person')}</option>
                  <option value="per_night">{getPricingTypeLabel('per_night')}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {ui.minNightsLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.min_nights || ''}
                  onChange={(e) => setFormData({ ...formData, min_nights: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="1"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    textAlign: 'left',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {ui.maxNightsLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_nights || ''}
                  onChange={(e) => setFormData({ ...formData, max_nights: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder={ui.maxNightsPlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    textAlign: 'left',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {ui.priorityLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    textAlign: 'left',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
              <input
                type="checkbox"
                id="meal_plan_included"
                checked={formData.meal_plan_included}
                onChange={(e) => setFormData({ ...formData, meal_plan_included: e.target.checked })}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                }}
              />
              <label htmlFor="meal_plan_included" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                {ui.includeMealPlan}
              </label>
            </div>

            {formData.meal_plan_included && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {ui.mealPlanTypeLabel}
                </label>
                <select
                  value={formData.meal_plan_type}
                  onChange={(e) => setFormData({ ...formData, meal_plan_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    direction: isRtl ? 'rtl' : 'ltr',
                  }}
                >
                  <option value="">{ui.selectMealPlan}</option>
                  <option value="BB">{getMealPlanLabel('BB')}</option>
                  <option value="HB">{getMealPlanLabel('HB')}</option>
                  <option value="FB">{getMealPlanLabel('FB')}</option>
                  <option value="AI">{getMealPlanLabel('AI')}</option>
                  <option value="RO">{getMealPlanLabel('RO')}</option>
                </select>
              </div>
            )}
          </div>

          {/* Room Type Rates */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {ui.roomTypeRates}
            </h3>
            
            {loadingRoomTypes ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                {ui.loadingRoomTypes}
              </div>
            ) : (
              <div style={{
                background: 'var(--color-background)',
                borderRadius: '8px',
                padding: '16px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {roomTypes.map((roomType) => {
                  const roomTypeRate = formData.room_type_rates?.find(rtr => rtr.room_type_id === roomType.id);
                  return (
                    <div key={roomType.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: roomTypes.indexOf(roomType) < roomTypes.length - 1 ? '1px solid var(--color-border)' : 'none', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                      <div style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                          {roomType.name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {ui.basePriceHelp}: {isRtl ? `${roomType.base_price.toFixed(2)} $` : `$${roomType.base_price.toFixed(2)}`}
                          </span>
                          {roomType.meal_plan && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(99, 102, 241, 0.1)',
                              color: '#6366f1',
                              fontWeight: '500',
                            }}>
                              {getMealPlanLabel(roomType.meal_plan)}
                            </span>
                          )}
                          {roomType.rates && Object.keys(roomType.rates).length > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              ({Object.entries(roomType.rates).map(([k, v]) => `${k}:${isRtl ? `${v} $` : `$${v}`}`).join(', ')})
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={roomTypeRate?.rate || 0}
                          onChange={(e) => handleRoomTypeRateChange(roomType.id, parseFloat(e.target.value) || 0)}
                          style={{
                            width: '120px',
                            padding: '8px 12px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-primary)',
                            textAlign: 'left',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Policies */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {ui.policies}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {ui.cancellationPolicyLabel}
                </label>
                <textarea
                  value={formData.cancellation_policy}
                  onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
                  rows={2}
                  placeholder={ui.cancellationPolicyPlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    textAlign: isRtl ? 'right' : 'left',
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {ui.paymentPolicyLabel}
                </label>
                <textarea
                  value={formData.payment_policy}
                  onChange={(e) => setFormData({ ...formData, payment_policy: e.target.value })}
                  rows={2}
                  placeholder={ui.paymentPolicyPlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    textAlign: isRtl ? 'right' : 'left',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {ui.additionalOptions}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-primary)', cursor: 'pointer', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                  <input
                    type="checkbox"
                    checked={formData.occupancy_based_pricing}
                    onChange={(e) => setFormData({ ...formData, occupancy_based_pricing: e.target.checked })}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span>{ui.occupancyPricing}</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-primary)', cursor: 'pointer', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                  <input
                    type="checkbox"
                    checked={formData.allow_children}
                    onChange={(e) => setFormData({ ...formData, allow_children: e.target.checked })}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span>{ui.allowChildren}</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-primary)', cursor: 'pointer', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                  <input
                    type="checkbox"
                    checked={formData.allow_extra_beds}
                    onChange={(e) => setFormData({ ...formData, allow_extra_beds: e.target.checked })}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span>{ui.allowExtraBeds}</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-primary)', cursor: 'pointer', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                  <input
                    type="checkbox"
                    checked={formData.meal_plan_included}
                    onChange={(e) => setFormData({ ...formData, meal_plan_included: e.target.checked })}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span>{ui.includeMealPlan}</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-primary)', cursor: 'pointer', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span>{ui.activeLabel}</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-primary)', cursor: 'pointer', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                  <input
                    type="checkbox"
                    checked={formData.channel_sync_enabled}
                    onChange={(e) => setFormData({ ...formData, channel_sync_enabled: e.target.checked })}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span>{ui.channelSync}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px 0',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: isRtl ? 'flex-start' : 'flex-end',
            gap: '12px',
            flexDirection: isRtl ? 'row-reverse' : 'row',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
              }}
            >
              {ui.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                color: 'white',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {ui.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}