'use client';

import { useEffect, useState } from 'react';
import { billingApi, ApiError } from '@/lib/api';
import type { Charge } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

export default function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Sorting
  const [sortBy, setSortBy] = useState('charged_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Actions
  const [deleteConfirm, setDeleteConfirm] = useState<Charge | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    folio_id: '',
    reservation_id: '',
    charge_type: 'room' as const,
    description: '',
    amount: '',
    tax_amount: '',
    notes: ''
  });

  const locale = useLocale();
  const t = useTranslations('billing');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  useEffect(() => {
    fetchCharges();
  }, [filterType, dateFrom, dateTo, sortBy, sortDirection]);

  async function fetchCharges() {
    try {
      const response = await billingApi.charges.list({
        charge_type: filterType || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort: sortBy,
        direction: sortDirection,
        per_page: 50
      });
      setCharges(response.data);
    } catch (error) {
      console.error('Error fetching charges:', error);
      setCharges([]);
    } finally {
      setLoading(false);
    }
  }

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm !== undefined) {
        setLoading(true);
        fetchCharges();
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

  async function handleDelete(charge: Charge) {
    setDeleting(true);
    try {
      await billingApi.charges.delete(charge.id);
      setSuccessMessage(isRtl ? 'تم حذف الرسوم بنجاح!' : 'Charge deleted successfully!');
      await fetchCharges();
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل حذف الرسوم' : 'Failed to delete charge'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } finally {
      setDeleting(false);
      setActionMenu(null);
    }
  }

  const getChargeTypeLabel = (type: string) => {
    switch (type) {
      case 'room': return isRtl ? 'غرفة' : 'Room';
      case 'food_beverage': return isRtl ? 'طعام ومشروبات' : 'Food & Beverage';
      case 'service': return isRtl ? 'خدمة' : 'Service';
      case 'amenity': return isRtl ? 'مرفق' : 'Amenity';
      case 'phone': return isRtl ? 'هاتف' : 'Phone';
      case 'laundry': return isRtl ? 'غسيل مابس' : 'Laundry';
      default: return isRtl ? 'أخرى' : 'Other';
    }
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
              {t('charges')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>
              {isRtl ? 'إدارة رسوم وتكاليف النزلاء' : 'Manage guest charges and fees'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexDirection: isRtl ? 'row-reverse' : 'row',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {isRtl ? '+ إضافة رسوم' : 'Add Charge'}
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

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          {tCommon('loading')}
        </div>
      ) : charges.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            {isRtl ? 'لم يتم العثور على رسوم' : 'No charges found'}
          </h3>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden',
          overflowX: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', textAlign: isRtl ? 'right' : 'left' }}>
                  {tCommon('description')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', textAlign: isRtl ? 'right' : 'left' }}>
                  {tCommon('type')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', textAlign: isRtl ? 'right' : 'left' }}>
                  {isRtl ? 'المبلغ' : 'Amount'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', textAlign: isRtl ? 'right' : 'left' }}>
                  {isRtl ? 'التاريخ' : 'Date'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', textAlign: isRtl ? 'left' : 'right' }}>
                  {tCommon('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {charges.map((charge) => (
                <tr key={charge.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                    {charge.description}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                    }}>
                      {getChargeTypeLabel(charge.charge_type)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                    {isRtl ? `${charge.amount.toFixed(2)} $` : `$${charge.amount.toFixed(2)}`}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {charge.charged_at ? new Date(charge.charged_at!).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US') : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: isRtl ? 'left' : 'right' }}>
                    <button
                      onClick={() => handleDelete(charge)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        background: 'var(--color-surface)',
                        color: '#ef4444',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {tCommon('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
