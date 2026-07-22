'use client';

import { useEffect, useState } from 'react';
import { guestsApi, ApiError } from '@/lib/api';
import type { Guest } from '@/types';
import GuestModal from '@/components/guests/GuestModal';
import { useLocale, useTranslations } from 'next-intl';

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filters
  const [filterVIP, setFilterVIP] = useState<boolean | null>(null);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterConsent, setFilterConsent] = useState<boolean | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Sorting
  const [sortBy, setSortBy] = useState('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Actions
  const [deleteConfirm, setDeleteConfirm] = useState<Guest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMenu, setActionMenu] = useState<number | null>(null);

  const locale = useLocale();
  const t = useTranslations('guests');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  useEffect(() => {
    fetchGuests();
  }, [filterVIP, filterCountry, filterCity, filterConsent, dateFrom, dateTo, sortBy, sortDirection]);

  async function fetchGuests() {
    try {
      const response = await guestsApi.list({
        search: searchTerm || undefined,
        vip_status: filterVIP ?? undefined,
        country: filterCountry || undefined,
        city: filterCity || undefined,
        marketing_consent: filterConsent ?? undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort: sortBy,
        direction: sortDirection,
        per_page: 50
      });
      setGuests(response.data);
    } catch (error) {
      console.error('Error fetching guests:', error);
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm !== undefined) {
        setLoading(true);
        fetchGuests();
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

  function openModal(guest?: Guest) {
    setEditingGuest(guest || null);
    setShowModal(true);
    setActionMenu(null);
  }

  function closeModal() {
    setShowModal(false);
    setEditingGuest(null);
  }

  async function handleDelete(guest: Guest) {
    setDeleting(true);
    try {
      await guestsApi.delete(guest.id);
      setSuccessMessage(locale === 'ar' ? 'تم حذف النزيل بنجاح!' : 'Guest deleted successfully!');
      await fetchGuests();
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (locale === 'ar' ? 'فشل حذف النزيل' : 'Failed to delete guest'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } finally {
      setDeleting(false);
      setActionMenu(null);
    }
  }

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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.45)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px rgba(99,102,241,0.35)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {t('addGuest')}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            {successMessage.includes('Failed') || successMessage.includes('فشل') ? (
              <>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </>
            ) : (
              <>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </>
            )}
          </svg>
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

          {/* VIP Filter */}
          <select
            value={filterVIP === null ? '' : filterVIP ? 'true' : 'false'}
            onChange={(e) => setFilterVIP(e.target.value === '' ? null : e.target.value === 'true')}
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
            <option value="">{isRtl ? 'جميع حالات VIP' : 'All VIP Status'}</option>
            <option value="true">{isRtl ? 'VIP فقط' : 'VIP Only'}</option>
            <option value="false">{isRtl ? 'عادي فقط' : 'Non-VIP Only'}</option>
          </select>

          {/* Country Filter */}
          <input
            type="text"
            placeholder={tCommon('country')}
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            style={{
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

          {/* City Filter */}
          <input
            type="text"
            placeholder={tCommon('city')}
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            style={{
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

          {/* Marketing Consent Filter */}
          <select
            value={filterConsent === null ? '' : filterConsent ? 'true' : 'false'}
            onChange={(e) => setFilterConsent(e.target.value === '' ? null : e.target.value === 'true')}
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
            <option value="">{isRtl ? 'موافقة التسويق' : 'Marketing Consent'}</option>
            <option value="true">{tCommon('yes')}</option>
            <option value="false">{tCommon('no')}</option>
          </select>
        </div>

        {/* Clear Filters */}
        <div style={{ display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterVIP(null);
              setFilterCountry('');
              setFilterCity('');
              setFilterConsent(null);
              setDateFrom('');
              setDateTo('');
            }}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '13px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            {tCommon('clearFilters')}
          </button>
        </div>
      </div>

      {/* Guests Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          {tCommon('loading')}
        </div>
      ) : guests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            {t('noGuests')}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            {searchTerm || filterVIP !== null || filterCountry || filterCity
              ? (isRtl ? 'جرّب تعديل مصطلحات البحث أو الفلاتر' : 'Try adjusting your search or filters')
              : (isRtl ? 'ابدأ بإضافة أول نزيل لنظام الفندق' : 'Get started by creating your first guest profile')}
          </p>
          {!searchTerm && filterVIP === null && !filterCountry && !filterCity && (
            <button
              onClick={() => openModal()}
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
              {t('addGuest')}
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }} onClick={() => handleSort('last_name')}>
                  {tCommon('name')} {sortIcon('last_name')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {tCommon('email')} & {tCommon('phone')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {tCommon('country')} / {tCommon('city')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {isRtl ? 'الهوية / الجواز' : 'ID / Passport'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {tCommon('vip')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'left' : 'right' }}>
                  {tCommon('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', fontSize: '14px', marginBottom: '2px' }}>
                      {guest.full_name || `${guest.first_name} ${guest.last_name}`}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{guest.phone || '-'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{guest.email || '-'}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    {[guest.city, guest.country].filter(Boolean).join(', ') || '-'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    {guest.passport_number || guest.national_id || '-'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {guest.vip_status ? (
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}>
                        ★ VIP
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: isRtl ? 'left' : 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
                      <button
                        onClick={() => openModal(guest)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        {tCommon('edit')}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(guest)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: '#ef4444',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
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
        </div>
      )}

      {/* Guest Modal */}
      {showModal && (
        <GuestModal
          guest={editingGuest}
          onClose={closeModal}
          onSuccess={() => {
            fetchGuests();
            closeModal();
            setSuccessMessage(editingGuest ? (isRtl ? 'تم تحديث النزيل بنجاح!' : 'Guest updated successfully!') : (isRtl ? 'تم إنشاء النزيل بنجاح!' : 'Guest created successfully!'));
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
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
              {isRtl ? 'حذف ملف النزيل' : 'Delete Guest Profile'}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              {isRtl
                ? `هل أنت متأكد من رغبتك في حذف ملف النزيل "${deleteConfirm.full_name || deleteConfirm.first_name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete guest profile "${deleteConfirm.full_name || deleteConfirm.first_name}"? This action cannot be undone.`
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
                {deleting ? (isRtl ? 'جاري الحذف…' : 'Deleting…') : tCommon('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
