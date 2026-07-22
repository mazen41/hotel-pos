'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { reservationsApi, billingApi, ApiError } from '@/lib/api';
import type { Reservation, Folio, Charge, Payment } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

export default function ReservationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = parseInt(params.id as string);
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'payments' | 'history'>('details');
  const [editingInternalNotes, setEditingInternalNotes] = useState(false);
  const [internalNotesValue, setInternalNotesValue] = useState('');
  const [updatingNotes, setUpdatingNotes] = useState(false);
  
  // Billing state
  const [folios, setFolios] = useState<Folio[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  
  // Charge modal
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [creatingCharge, setCreatingCharge] = useState(false);
  const [chargeFormData, setChargeFormData] = useState({
    folio_id: '',
    charge_type: 'room' as const,
    description: '',
    amount: '',
    tax_amount: '',
    notes: ''
  });
  
  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    folio_id: '',
    payment_method: 'cash' as const,
    card_last_four: '',
    card_type: '',
    transaction_id: '',
    amount: '',
    notes: ''
  });

  const locale = useLocale();
  const t = useTranslations('reservations');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  useEffect(() => {
    fetchReservation();
  }, [reservationId]);

  useEffect(() => {
    if (reservation && activeTab === 'payments') {
      fetchBillingData();
    }
  }, [reservation, activeTab]);

  async function fetchReservation() {
    setLoading(true);
    try {
      const response = await reservationsApi.get(reservationId);
      setReservation(response.data);
    } catch (error) {
      console.error('Error fetching reservation:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    if (!reservation) return;
    try {
      await reservationsApi.checkIn(reservation.id);
      setSuccessMessage(isRtl ? 'تم تسجيل وصول النزيل بنجاح!' : 'Guest checked in successfully!');
      await fetchReservation();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل تسجيل وصول النزيل' : 'Failed to check in guest'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  async function handleCheckOut() {
    if (!reservation) return;
    try {
      await reservationsApi.checkOut(reservation.id);
      setSuccessMessage(isRtl ? 'تم تسجيل مغادرة النزيل بنجاح!' : 'Guest checked out successfully!');
      await fetchReservation();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل تسجيل مغادرة النزيل' : 'Failed to check out guest'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  async function handleCancel() {
    if (!reservation) return;
    const reasonMsg = isRtl ? 'سبب الإلغاء:' : 'Cancellation reason:';
    const reason = prompt(reasonMsg);
    if (!reason) return;

    try {
      await reservationsApi.cancel(reservation.id, reason);
      setSuccessMessage(isRtl ? 'تم إلغاء الحجز بنجاح!' : 'Reservation cancelled successfully!');
      await fetchReservation();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل إلغاء الحجز' : 'Failed to cancel reservation'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  async function handleSaveInternalNotes() {
    if (!reservation) return;
    setUpdatingNotes(true);
    try {
      await reservationsApi.update(reservation.id, { internal_notes: internalNotesValue });
      setSuccessMessage(isRtl ? 'تم تحديث الملاحظات الداخلية بنجاح!' : 'Internal notes updated successfully!');
      await fetchReservation();
      setEditingInternalNotes(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || (isRtl ? 'فشل تحديث الملاحظات الداخلية' : 'Failed to update internal notes'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } finally {
      setUpdatingNotes(false);
    }
  }

  function handleEditInternalNotes() {
    setInternalNotesValue(reservation?.internal_notes || '');
    setEditingInternalNotes(true);
  }

  function handleCancelEditInternalNotes() {
    setEditingInternalNotes(false);
    setInternalNotesValue('');
  }

  async function fetchBillingData() {
    if (!reservation) return;
    setBillingLoading(true);
    try {
      const foliosResponse = await billingApi.folios.list({
        reservation_id: reservation.id,
        per_page: 50
      });
      setFolios(foliosResponse.data);

      const chargesResponse = await billingApi.charges.list({
        reservation_id: reservation.id,
        per_page: 50
      });
      setCharges(chargesResponse.data);

      const paymentsResponse = await billingApi.payments.list({
        reservation_id: reservation.id,
        per_page: 50
      });
      setPayments(paymentsResponse.data);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setBillingLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>{isRtl ? 'جاري تحميل تفاصيل الحجز...' : 'Loading reservation details...'}</div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>{isRtl ? 'الحجز غير موجود' : 'Reservation not found'}</div>
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
            {isRtl ? `حجز رقم ${reservation.reservation_number}` : `Reservation ${reservation.reservation_number}`}
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

      {/* Primary Action bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-end' }}>
        {reservation.status === 'confirmed' && (
          <button
            onClick={handleCheckIn}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              background: '#22c55e',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {isRtl ? 'تسجيل الوصول' : 'Check In'}
          </button>
        )}
        {reservation.status === 'checked_in' && (
          <button
            onClick={handleCheckOut}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              background: '#3b82f6',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {isRtl ? 'تسجيل المغادرة' : 'Check Out'}
          </button>
        )}
        {(reservation.status === 'confirmed' || reservation.status === 'pending') && (
          <button
            onClick={handleCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              background: 'var(--color-surface)',
              color: '#ef4444',
              cursor: 'pointer',
            }}
          >
            {tCommon('cancel')}
          </button>
        )}
      </div>

      {/* Main content tabs */}
      <div style={{
        display: 'flex',
        gap: '2px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '24px',
        flexDirection: isRtl ? 'row-reverse' : 'row',
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
          }}
        >
          {isRtl ? 'تفاصيل الحجز' : 'Details'}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'payments' ? '2px solid #6366f1' : 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'payments' ? '600' : '400',
            background: activeTab === 'payments' ? 'rgba(99,102,241,0.05)' : 'transparent',
            color: activeTab === 'payments' ? '#6366f1' : 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          {isRtl ? 'الفواتير والمدفوعات' : 'Billing & Payments'}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {/* Guest Information */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {isRtl ? 'معلومات النزيل' : 'Guest Information'}
            </h3>
            {reservation.guest ? (
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {reservation.guest.first_name} {reservation.guest.last_name}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  {reservation.guest.email}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {reservation.guest.phone}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                {isRtl ? 'لا يوجد ملف نزيل مرتبط' : 'No guest attached'}
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              {isRtl ? 'ملخص الحجز' : 'Stay Summary'}
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{isRtl ? 'تاريخ الوصول' : 'Check-in'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                {reservation.check_in_date}
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{isRtl ? 'تاريخ المغادرة' : 'Check-out'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                {reservation.check_out_date}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{isRtl ? 'الغرفة' : 'Room'}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                {reservation.room ? `${isRtl ? 'غرفة' : 'Room'} ${reservation.room.room_number}` : (isRtl ? 'غير محددة' : 'Unassigned')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
