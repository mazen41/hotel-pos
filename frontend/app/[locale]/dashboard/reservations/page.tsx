'use client';

import { useEffect, useState } from 'react';
import { reservationsApi, ApiError } from '@/lib/api';
import type { Reservation } from '@/types';
import ReservationModal from '@/components/reservations/ReservationModal';
import AvailabilityPanel from '@/components/reservations/AvailabilityPanel';
import { useLocale, useTranslations } from 'next-intl';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showAvailabilityPanel, setShowAvailabilityPanel] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterRoomType, setFilterRoomType] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<string>('');
  
  // Sorting
  const [sortBy, setSortBy] = useState('check_in_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const locale = useLocale();
  const t = useTranslations('reservations');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  useEffect(() => {
    fetchReservations();
  }, [filterStatus, filterPaymentStatus, filterDateFrom, filterDateTo, filterRoomType, filterSource, filterGroup, sortBy, sortDirection]);

  async function fetchReservations() {
    try {
      const groupFilter = filterGroup === 'ungrouped' ? 0 : filterGroup === 'grouped' ? -1 : filterGroup ? parseInt(filterGroup) : undefined;
      const response = await reservationsApi.list({
        search: searchTerm || undefined,
        status: filterStatus || undefined,
        payment_status: filterPaymentStatus || undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
        room_type_id: filterRoomType ? parseInt(filterRoomType) : undefined,
        source: filterSource || undefined,
        group_id: groupFilter,
        sort: sortBy,
        direction: sortDirection,
        per_page: 50
      });
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm !== undefined) {
        setLoading(true);
        fetchReservations();
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (actionMenu !== null) {
        setActionMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionMenu]);

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  }

  async function handleCheckIn(reservation: Reservation) {
    if (reservation.status !== 'confirmed') {
      setSuccessMessage(isRtl ? 'يمكن تسجيل الوصول للحجوزات المؤكدة فقط.' : 'Only confirmed reservations can be checked in.');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      await reservationsApi.checkIn(reservation.id);
      setSuccessMessage(isRtl ? 'تم تسجيل وصول النزيل بنجاح!' : 'Guest checked in successfully!');
      await fetchReservations();
      setActionMenu(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل تسجيل وصول النزيل' : 'Failed to check in guest'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  async function handleCheckOut(reservation: Reservation) {
    if (reservation.status !== 'checked_in') {
      setSuccessMessage(isRtl ? 'يمكن تسجيل المغادرة للحجوزات التي تم تسجيل وصولها فقط.' : 'Only checked-in reservations can be checked out.');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      await reservationsApi.checkOut(reservation.id);
      setSuccessMessage(isRtl ? 'تم تسجيل مغادرة النزيل بنجاح!' : 'Guest checked out successfully!');
      await fetchReservations();
      setActionMenu(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل تسجيل مغادرة النزيل' : 'Failed to check out guest'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  async function handleCancel(reservation: Reservation) {
    const confirmMsg = isRtl ? `إلغاء الحجز رقم ${reservation.reservation_number}؟` : `Cancel reservation ${reservation.reservation_number}?`;
    if (!confirm(confirmMsg)) return;
    
    const reasonMsg = isRtl ? 'سبب الإلغاء:' : 'Cancellation reason:';
    const reason = prompt(reasonMsg);
    if (!reason) return;

    try {
      await reservationsApi.cancel(reservation.id, reason);
      setSuccessMessage(isRtl ? 'تم إلغاء الحجز بنجاح!' : 'Reservation cancelled successfully!');
      await fetchReservations();
      setActionMenu(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل إلغاء الحجز' : 'Failed to cancel reservation'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  async function handleNoShow(reservation: Reservation) {
    const confirmMsg = isRtl ? `تعليم الحجز رقم ${reservation.reservation_number} كعدم حضور؟` : `Mark reservation ${reservation.reservation_number} as no-show?`;
    if (!confirm(confirmMsg)) return;

    try {
      await reservationsApi.markNoShow(reservation.id);
      setSuccessMessage(isRtl ? 'تم تحديد الحجز كعدم حضور بنجاح!' : 'Reservation marked as no-show successfully!');
      await fetchReservations();
      setActionMenu(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل تغيير حالة الحجز إلى عدم حضور' : 'Failed to mark reservation as no-show'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return isRtl ? 'مؤكد' : 'Confirmed';
      case 'pending': return isRtl ? 'قيد الانتظار' : 'Pending';
      case 'checked_in': return isRtl ? 'مسجل وصوله' : 'Checked In';
      case 'checked_out': return isRtl ? 'مسجل مغادرته' : 'Checked Out';
      case 'cancelled': return isRtl ? 'ملغى' : 'Cancelled';
      case 'no_show': return isRtl ? 'لم يحضر' : 'No Show';
      default: return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return isRtl ? 'مدفوع' : 'Paid';
      case 'partially_paid': return isRtl ? 'مدفوع جزئياً' : 'Partially Paid';
      case 'unpaid': return isRtl ? 'غير مدفوع' : 'Unpaid';
      case 'refunded': return isRtl ? 'مسترجع' : 'Refunded';
      default: return status;
    }
  };

  function getStatusColor(status: string): { bg: string; text: string } {
    const colors: Record<string, { bg: string; text: string }> = {
      confirmed: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
      pending: { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308' },
      checked_in: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
      checked_out: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' },
      cancelled: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
      no_show: { bg: 'rgba(127, 29, 29, 0.1)', text: '#7f1d1d' },
    };
    return colors[status] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
  }

  function getPaymentStatusColor(status: string): { bg: string; text: string } {
    const colors: Record<string, { bg: string; text: string }> = {
      paid: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
      partially_paid: { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308' },
      unpaid: { bg: 'rgba(234, 179, 8, 0.1)', text: '#f59e0b' },
      refunded: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
    };
    return colors[status] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
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

          <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button
              onClick={() => setShowAvailabilityPanel(true)}
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
              {t('checkAvailability')}
            </button>
            <button
              onClick={() => setShowReservationModal(true)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(99,102,241,0.35)',
              }}
            >
              {t('newReservation')}
            </button>
          </div>
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
            <option value="">{t('allStatuses')}</option>
            <option value="confirmed">{getStatusLabel('confirmed')}</option>
            <option value="pending">{getStatusLabel('pending')}</option>
            <option value="checked_in">{getStatusLabel('checked_in')}</option>
            <option value="checked_out">{getStatusLabel('checked_out')}</option>
            <option value="cancelled">{getStatusLabel('cancelled')}</option>
            <option value="no_show">{getStatusLabel('no_show')}</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
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
            <option value="">{t('allPaymentStatuses')}</option>
            <option value="paid">{getPaymentStatusLabel('paid')}</option>
            <option value="partially_paid">{getPaymentStatusLabel('partially_paid')}</option>
            <option value="unpaid">{getPaymentStatusLabel('unpaid')}</option>
            <option value="refunded">{getPaymentStatusLabel('refunded')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          {tCommon('loading')}
        </div>
      ) : reservations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            {t('noReservations')}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            {isRtl ? 'لم نجد أي حجوزات متطابقة مع شروط البحث' : 'No reservations matched your criteria'}
          </p>
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
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {isRtl ? 'رقم الحجز' : 'Res #'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {tCommon('guest')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {isRtl ? 'الوصول / المغادرة' : 'Dates'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {tCommon('room')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {tCommon('status')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {isRtl ? 'حالة الدفع' : 'Payment'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                  {tCommon('total')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: isRtl ? 'left' : 'right' }}>
                  {tCommon('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res) => (
                <tr key={res.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#6366f1' }}>
                    {res.reservation_number}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>
                      {res.guest ? `${res.guest.first_name} ${res.guest.last_name}` : '-'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    <div>{res.check_in_date}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>← {res.check_out_date}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    {res.room ? `${isRtl ? 'غرفة' : 'Room'} ${res.room.room_number}` : (isRtl ? 'غير محددة' : 'Unassigned')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      background: getStatusColor(res.status).bg,
                      color: getStatusColor(res.status).text,
                    }}>
                      {getStatusLabel(res.status)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      background: getPaymentStatusColor(res.payment_status).bg,
                      color: getPaymentStatusColor(res.payment_status).text,
                    }}>
                      {getPaymentStatusLabel(res.payment_status)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                    {isRtl ? `${res.total_amount.toFixed(2)} $` : `$${res.total_amount.toFixed(2)}`}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: isRtl ? 'left' : 'right' }}>
                    <button
                      onClick={() => window.location.href = `/${locale}/dashboard/reservations/${res.id}`}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {tCommon('view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && (
        <ReservationModal
          onClose={() => setShowReservationModal(false)}
          onSuccess={() => {
            fetchReservations();
            setShowReservationModal(false);
            setSuccessMessage(isRtl ? 'تم إضافة الحجز بنجاح!' : 'Reservation created successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}

      {/* Availability Panel */}
      {showAvailabilityPanel && (
        <AvailabilityPanel
          onClose={() => setShowAvailabilityPanel(false)}
          onSelectRoom={() => setShowAvailabilityPanel(false)}
        />
      )}
    </div>
  );
}
