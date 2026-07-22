'use client';

import { useEffect, useState } from 'react';
import { billingApi, ApiError } from '@/lib/api';
import type { Folio } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

export default function FoliosPage() {
  const [folios, setFolios] = useState<Folio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBalance, setFilterBalance] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Actions
  const [deleteConfirm, setDeleteConfirm] = useState<Folio | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    reservation_id: '',
    guest_id: '',
    notes: ''
  });

  const locale = useLocale();
  const t = useTranslations('billing');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  useEffect(() => {
    fetchFolios();
  }, [filterStatus, filterBalance, sortBy, sortDirection]);

  async function fetchFolios() {
    try {
      const response = await billingApi.folios.list({
        folio_number: searchTerm || undefined,
        status: filterStatus || undefined,
        with_balance: filterBalance || undefined,
        sort: sortBy,
        direction: sortDirection,
        per_page: 50
      });
      setFolios(response.data);
    } catch (error) {
      console.error('Error fetching folios:', error);
      setFolios([]);
    } finally {
      setLoading(false);
    }
  }

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm !== undefined) {
        setLoading(true);
        fetchFolios();
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

  async function handleCloseFolio(folio: Folio) {
    try {
      await billingApi.folios.close(folio.id);
      setSuccessMessage(isRtl ? 'تم إغلاق الفاتورة بنجاح!' : 'Folio closed successfully!');
      await fetchFolios();
      setActionMenu(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل إغلاق الفاتورة' : 'Failed to close folio'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  async function handleReopenFolio(folio: Folio) {
    try {
      await billingApi.folios.reopen(folio.id);
      setSuccessMessage(isRtl ? 'تم إعادة فتح الفاتورة بنجاح!' : 'Folio reopened successfully!');
      await fetchFolios();
      setActionMenu(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل إعادة فتح الفاتورة' : 'Failed to reopen folio'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  async function handleDelete(folio: Folio) {
    setDeleting(true);
    try {
      await billingApi.folios.delete(folio.id);
      setSuccessMessage(isRtl ? 'تم حذف الفاتورة بنجاح!' : 'Folio deleted successfully!');
      await fetchFolios();
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل حذف الفاتورة' : 'Failed to delete folio'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } finally {
      setDeleting(false);
      setActionMenu(null);
    }
  }

  async function handleCreateFolio() {
    if (!formData.reservation_id || !formData.guest_id) {
      setSuccessMessage(isRtl ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    setCreating(true);
    try {
      await billingApi.folios.create({
        reservation_id: parseInt(formData.reservation_id),
        guest_id: parseInt(formData.guest_id),
        notes: formData.notes || undefined,
      });
      setSuccessMessage(isRtl ? 'تم إنشاء الفاتورة بنجاح!' : 'Folio created successfully!');
      await fetchFolios();
      setShowCreateModal(false);
      setFormData({ reservation_id: '', guest_id: '', notes: '' });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل إنشاء الفاتورة' : 'Failed to create folio'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } finally {
      setCreating(false);
    }
  }

  const sortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return isRtl ? 'مفتوح' : 'Open';
      case 'closed': return isRtl ? 'مغلق' : 'Closed';
      case 'cancelled': return isRtl ? 'ملغى' : 'Cancelled';
      default: return status;
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
              {t('folios')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>
              {isRtl ? 'إدارة فواتير وحسابات النزلاء' : 'Manage guest folios and billing accounts'}
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
            {isRtl ? '+ إنشاء فاتورة' : 'Create Folio'}
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
          <div style={{ gridColumn: 'span 2' }}>
            <input
              type="text"
              placeholder={isRtl ? 'البحث برقم الفاتورة...' : 'Search by folio number...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
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

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
            <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="open">{getStatusLabel('open')}</option>
            <option value="closed">{getStatusLabel('closed')}</option>
            <option value="cancelled">{getStatusLabel('cancelled')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          {tCommon('loading')}
        </div>
      ) : folios.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            {isRtl ? 'لم يتم العثور على فواتير' : 'No folios found'}
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
                  {isRtl ? 'رقم الفاتورة' : 'Folio #'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', textAlign: isRtl ? 'right' : 'left' }}>
                  {tCommon('guest')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', textAlign: isRtl ? 'right' : 'left' }}>
                  {isRtl ? 'الرصيد' : 'Balance'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', textAlign: isRtl ? 'right' : 'left' }}>
                  {tCommon('status')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', textAlign: isRtl ? 'left' : 'right' }}>
                  {tCommon('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {folios.map((folio) => (
                <tr key={folio.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#6366f1' }}>
                    {folio.folio_number}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--color-text-primary)' }}>
                    {folio.guest ? `${folio.guest.first_name} ${folio.guest.last_name}` : '-'}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: folio.balance_due > 0 ? '#ef4444' : '#22c55e' }}>
                    {isRtl ? `${folio.balance_due.toFixed(2)} $` : `$${folio.balance_due.toFixed(2)}`}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      background: folio.status === 'open' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: folio.status === 'open' ? '#22c55e' : '#6b7280',
                    }}>
                      {getStatusLabel(folio.status)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: isRtl ? 'left' : 'right' }}>
                    {folio.status === 'open' ? (
                      <button
                        onClick={() => handleCloseFolio(folio)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {isRtl ? 'إغلاق' : 'Close'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReopenFolio(folio)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {isRtl ? 'إعادة فتح' : 'Reopen'}
                      </button>
                    )}
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
