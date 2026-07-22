'use client';

import { useEffect, useState } from 'react';
import { roomTypesApi, ApiError } from '@/lib/api';
import type { RoomType } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';

// Zod schema for validation
const roomTypeSchema = z.object({
  name: z.string().min(1, 'Room type name is required').max(255, 'Name must not exceed 255 characters'),
  description: z.string().max(5000, 'Description must not exceed 5000 characters').optional(),
  base_price: z.number().min(0, 'Base price must be at least 0').max(999999.99, 'Base price must not exceed 999,999.99'),
  meal_plan: z.string().max(10, 'Meal plan must not exceed 10 characters').optional(),
  rates: z.record(z.number()).optional(),
  max_adults: z.number().int('Maximum adults must be an integer').min(1, 'Maximum adults must be at least 1').max(20, 'Maximum adults must not exceed 20'),
  max_children: z.number().int('Maximum children must be an integer').min(0, 'Maximum children must be at least 0').max(20, 'Maximum children must not exceed 20'),
  max_occupancy: z.number().int('Maximum occupancy must be an integer').min(1, 'Maximum occupancy must be at least 1').max(40, 'Maximum occupancy must not exceed 40'),
  bed_type: z.string().max(100, 'Bed type must not exceed 100 characters').optional(),
  amenities: z.array(z.string().max(100, 'Each amenity must not exceed 100 characters')).optional(),
  images: z.array(z.string().url('Each image must be a valid URL').max(500, 'Image URL must not exceed 500 characters')).optional(),
  is_active: z.boolean().optional(),
  external_mapping_id: z.string().max(100, 'External mapping ID must not exceed 100 characters').optional(),
  channel_manager_code: z.string().max(100, 'Channel manager code must not exceed 100 characters').optional(),
  rate_plan_code: z.string().max(100, 'Rate plan code must not exceed 100 characters').optional(),
});

type RoomTypeFormValues = z.infer<typeof roomTypeSchema>;

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<RoomType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const locale = useLocale();
  const t = useTranslations('roomTypes');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoomTypeFormValues>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      base_price: 0,
      meal_plan: '',
      rates: {},
      max_adults: 2,
      max_children: 0,
      max_occupancy: 2,
      bed_type: '',
      amenities: [],
      images: [],
      is_active: true,
      external_mapping_id: '',
      channel_manager_code: '',
      rate_plan_code: '',
    },
  });

  const amenities = watch('amenities') || [];
  const images = watch('images') || [];

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  async function fetchRoomTypes() {
    try {
      const response = await roomTypesApi.list();
      setRoomTypes(response.data);
    } catch {
      setRoomTypes([]);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: RoomTypeFormValues) {
    setSubmitting(true);
    setSuccessMessage(null);

    try {
      if (editingRoomType) {
        await roomTypesApi.update(editingRoomType.id, data);
        setSuccessMessage(t('successUpdate'));
      } else {
        await roomTypesApi.create(data);
        setSuccessMessage(t('successCreate'));
      }
      await fetchRoomTypes();
      closeModal();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Error:', error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openModal(roomType?: RoomType) {
    if (roomType) {
      setEditingRoomType(roomType);
      reset({
        name: roomType.name,
        description: roomType.description || '',
        base_price: roomType.base_price,
        meal_plan: roomType.meal_plan || '',
        rates: roomType.rates || {},
        max_adults: roomType.max_adults,
        max_children: roomType.max_children,
        max_occupancy: roomType.max_occupancy,
        bed_type: roomType.bed_type || '',
        amenities: roomType.amenities || [],
        images: roomType.images || [],
        is_active: roomType.is_active,
        external_mapping_id: roomType.external_mapping_id || '',
        channel_manager_code: roomType.channel_manager_code || '',
        rate_plan_code: roomType.rate_plan_code || '',
      });
    } else {
      setEditingRoomType(null);
      reset({
        name: '',
        description: '',
        base_price: 0,
        meal_plan: '',
        rates: {},
        max_adults: 2,
        max_children: 0,
        max_occupancy: 2,
        bed_type: '',
        amenities: [],
        images: [],
        is_active: true,
        external_mapping_id: '',
        channel_manager_code: '',
        rate_plan_code: '',
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingRoomType(null);
    reset();
  }

  async function handleDelete(roomType: RoomType) {
    setDeleting(true);
    try {
      await roomTypesApi.delete(roomType.id);
      setSuccessMessage(t('successDelete'));
      await fetchRoomTypes();
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Error:', error.message);
      }
    } finally {
      setDeleting(false);
    }
  }

  function addAmenity() {
    const newAmenities = [...amenities, ''];
    setValue('amenities', newAmenities);
  }

  function updateAmenity(index: number, value: string) {
    const newAmenities = [...amenities];
    newAmenities[index] = value;
    setValue('amenities', newAmenities);
  }

  function removeAmenity(index: number) {
    const newAmenities = amenities.filter((_, i) => i !== index);
    setValue('amenities', newAmenities);
  }

  function addImage() {
    const newImages = [...images, ''];
    setValue('images', newImages);
  }

  function updateImage(index: number, value: string) {
    const newImages = [...images];
    newImages[index] = value;
    setValue('images', newImages);
  }

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index);
    setValue('images', newImages);
  }

  const filteredRoomTypes = roomTypes.filter(rt =>
    rt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rt.description && rt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getOccupancyDescription = (rt: RoomType) => {
    if (locale === 'ar') {
      return `${rt.max_adults} بالغين، ${rt.max_children} أطفال (الحد الأقصى للنزلاء: ${rt.max_occupancy})`;
    }
    return rt.occupancy_description;
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

  const getAmenityPlaceholder = (index: number) => {
    if (locale === 'ar') {
      return 'مثال: واي فاي، تكييف هواء';
    }
    return 'e.g., WiFi, Air Conditioning';
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
            onClick={() => openModal()}
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexDirection: isRtl ? 'row-reverse' : 'row',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.45)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px rgba(99,102,241,0.35)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {t('createRoomType')}
          </button>
        </div>
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

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px 14px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text-primary)',
            fontSize: '14px',
            outline: 'none',
            textAlign: isRtl ? 'right' : 'left',
          }}
        />
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            {tCommon('loading')}
          </div>
        ) : filteredRoomTypes.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            {t('noRoomTypes')}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: isRtl ? 'right' : 'left' }}>{tCommon('name')}</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: isRtl ? 'right' : 'left' }}>{t('basePrice')}</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: isRtl ? 'right' : 'left' }}>{locale === 'ar' ? 'خطة الوجبات' : 'Meal Plan'}</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: isRtl ? 'right' : 'left' }}>{locale === 'ar' ? 'الأسعار التفصيلية' : 'Rates'}</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: isRtl ? 'right' : 'left' }}>{locale === 'ar' ? 'الإشغال' : 'Occupancy'}</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: isRtl ? 'right' : 'left' }}>{tCommon('status')}</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: isRtl ? 'left' : 'right' }}>{tCommon('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoomTypes.map(roomType => (
                <tr key={roomType.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500', color: 'var(--color-text-primary)', fontSize: '14px' }}>{roomType.name}</div>
                    {roomType.description && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>{roomType.description}</div>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-text-primary)', fontSize: '14px' }}>
                    {locale === 'ar' ? `${roomType.formatted_price} $` : `$${roomType.formatted_price}`}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-text-primary)', fontSize: '14px' }}>
                    {roomType.meal_plan ? (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366f1',
                      }}>
                        {getMealPlanLabel(roomType.meal_plan)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-text-primary)', fontSize: '13px' }}>
                    {roomType.rates && Object.keys(roomType.rates).length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        {Object.entries(roomType.rates).map(([key, value]) => (
                          <span key={key} style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--color-border)',
                          }}>
                            {key}: {locale === 'ar' ? `${value} $` : `$${value}`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-text-primary)', fontSize: '14px' }}>
                    {getOccupancyDescription(roomType)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: roomType.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                      color: roomType.is_active ? '#22c55e' : '#9ca3af',
                    }}>
                      {roomType.is_active ? tCommon('active') : tCommon('inactive')}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
                      <button
                        onClick={() => openModal(roomType)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-text-muted)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                        }}
                      >
                        {tCommon('edit')}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(roomType)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: '#ef4444',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.08)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                        }}
                      >
                        {tCommon('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            textAlign: isRtl ? 'right' : 'left',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: isRtl ? 'row-reverse' : 'row',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                {editingRoomType ? t('editRoomType') : t('createRoomType')}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Basic Information */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                    {locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        {tCommon('name')} <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        {...register('name')}
                        placeholder={locale === 'ar' ? 'مثال: جناح فاخر' : 'e.g., Deluxe Suite'}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          textAlign: isRtl ? 'right' : 'left',
                        }}
                      />
                      {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.name.message}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        {tCommon('description')}
                      </label>
                      <textarea
                        {...register('description')}
                        placeholder={locale === 'ar' ? 'وصف نوع الغرفة...' : 'Room type description...'}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          textAlign: isRtl ? 'right' : 'left',
                        }}
                      />
                      {errors.description && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.description.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                    {tCommon('pricing')}
                  </h3>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                      {t('basePrice')} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('base_price', { valueAsNumber: true })}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        color: 'var(--color-text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                        textAlign: 'left',
                      }}
                    />
                    {errors.base_price && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.base_price.message}</p>}
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                      {locale === 'ar' ? 'خطة الوجبات' : 'Meal Plan'}
                    </label>
                    <select
                      {...register('meal_plan')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        color: 'var(--color-text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                        direction: isRtl ? 'rtl' : 'ltr',
                      }}
                    >
                      <option value="">{locale === 'ar' ? 'اختر خطة الوجبات' : 'Select meal plan'}</option>
                      <option value="BB">{getMealPlanLabel('BB')}</option>
                      <option value="HB">{getMealPlanLabel('HB')}</option>
                      <option value="FB">{getMealPlanLabel('FB')}</option>
                      <option value="AI">{getMealPlanLabel('AI')}</option>
                      <option value="RO">{getMealPlanLabel('RO')}</option>
                    </select>
                    {errors.meal_plan && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.meal_plan.message}</p>}
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                      {locale === 'ar' ? 'الأسعار التفصيلية (فردي، ثنائي، ثلاثي، رباعي)' : 'Detailed Rates (SGL, DBL, TPL, QUAD)'}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>SGL</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('rates.SGL', { valueAsNumber: true })}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            color: 'var(--color-text-primary)',
                            fontSize: '13px',
                            outline: 'none',
                            textAlign: 'left',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>DBL</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('rates.DBL', { valueAsNumber: true })}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            color: 'var(--color-text-primary)',
                            fontSize: '13px',
                            outline: 'none',
                            textAlign: 'left',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>TPL</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('rates.TPL', { valueAsNumber: true })}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            color: 'var(--color-text-primary)',
                            fontSize: '13px',
                            outline: 'none',
                            textAlign: 'left',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>QUAD</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('rates.QUAD', { valueAsNumber: true })}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            color: 'var(--color-text-primary)',
                            fontSize: '13px',
                            outline: 'none',
                            textAlign: 'left',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Occupancy */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                    {locale === 'ar' ? 'الإشغال' : 'Occupancy'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        {t('maxAdults')} <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        {...register('max_adults', { valueAsNumber: true })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          textAlign: 'left',
                        }}
                      />
                      {errors.max_adults && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.max_adults.message}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        {t('maxChildren')} <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        {...register('max_children', { valueAsNumber: true })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          textAlign: 'left',
                        }}
                      />
                      {errors.max_children && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.max_children.message}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        {t('maxOccupancy')} <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        {...register('max_occupancy', { valueAsNumber: true })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          textAlign: 'left',
                        }}
                      />
                      {errors.max_occupancy && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.max_occupancy.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Room Details */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                    {locale === 'ar' ? 'تفاصيل الغرفة' : 'Room Details'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        {t('bedType')}
                      </label>
                      <input
                        {...register('bed_type')}
                        placeholder={locale === 'ar' ? 'مثال: سرير كينج' : 'e.g., King Bed'}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          textAlign: isRtl ? 'right' : 'left',
                        }}
                      />
                      {errors.bed_type && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.bed_type.message}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        {t('amenities')}
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {amenities.map((amenity, index) => (
                          <div key={index} style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                            <input
                              value={amenity}
                              onChange={e => updateAmenity(index, e.target.value)}
                              placeholder={getAmenityPlaceholder(index)}
                              style={{
                                flex: 1,
                                padding: '10px 12px',
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                color: 'var(--color-text-primary)',
                                fontSize: '14px',
                                outline: 'none',
                                textAlign: isRtl ? 'right' : 'left',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeAmenity(index)}
                              style={{
                                padding: '10px',
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addAmenity}
                          style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            border: '1px dashed var(--color-border)',
                            borderRadius: '6px',
                            color: 'var(--color-text-secondary)',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          {locale === 'ar' ? '+ إضافة ميزة' : '+ Add Amenity'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        {t('images')}
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {images.map((image, index) => (
                          <div key={index} style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                            <input
                              value={image}
                              onChange={e => updateImage(index, e.target.value)}
                              placeholder="https://example.com/image.jpg"
                              style={{
                                flex: 1,
                                padding: '10px 12px',
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                color: 'var(--color-text-primary)',
                                fontSize: '14px',
                                outline: 'none',
                                textAlign: 'left',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              style={{
                                padding: '10px',
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addImage}
                          style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            border: '1px dashed var(--color-border)',
                            borderRadius: '6px',
                            color: 'var(--color-text-secondary)',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          {locale === 'ar' ? '+ إضافة رابط صورة' : '+ Add Image URL'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                    {tCommon('status')}
                  </h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
                    <input
                      type="checkbox"
                      {...register('is_active')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{tCommon('active')}</span>
                  </label>
                </div>

                {/* Channel Manager Integration */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                    {locale === 'ar' ? 'الربط الإلكتروني بمدير القنوات (مستقبلي)' : 'Channel Manager Integration (Future)'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        {locale === 'ar' ? 'معرف المطابقة الخارجي' : 'External Mapping ID'}
                      </label>
                      <input
                        {...register('external_mapping_id')}
                        placeholder="e.g., RT-001"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          textAlign: 'left',
                        }}
                      />
                      {errors.external_mapping_id && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.external_mapping_id.message}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        {locale === 'ar' ? 'رمز مدير القنوات' : 'Channel Manager Code'}
                      </label>
                      <input
                        {...register('channel_manager_code')}
                        placeholder="e.g., CM-DELUXE"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          textAlign: 'left',
                        }}
                      />
                      {errors.channel_manager_code && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.channel_manager_code.message}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        {locale === 'ar' ? 'رمز خطة الأسعار' : 'Rate Plan Code'}
                      </label>
                      <input
                        {...register('rate_plan_code')}
                        placeholder="e.g., RP-STD"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          textAlign: 'left',
                        }}
                      />
                      {errors.rate_plan_code && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.rate_plan_code.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 12px rgba(99,102,241,0.35)',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? (locale === 'ar' ? 'جاري الحفظ…' : 'Saving…') : (editingRoomType ? tCommon('update') : tCommon('create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '100%',
            padding: '24px',
            textAlign: isRtl ? 'right' : 'left',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              {locale === 'ar' ? 'حذف نوع الغرفة' : 'Delete Room Type'}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              {locale === 'ar'
                ? `هل أنت متأكد من رغبتك في حذف نوع الغرفة "${deleteConfirm.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete room type "${deleteConfirm.name}"? This action cannot be undone.`
              }
            </p>
            <div style={{ display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? (locale === 'ar' ? 'جاري الحذف…' : 'Deleting…') : tCommon('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
