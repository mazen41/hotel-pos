'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reservationsApi, ApiError } from '@/lib/api';
import type { Reservation } from '@/types';

interface TodayArrivalsProps {
  limit?: number;
  showHeader?: boolean;
}

export default function TodayArrivals({ limit = 10, showHeader = true }: TodayArrivalsProps) {
  const router = useRouter();
  const [arrivals, setArrivals] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayArrivals();
  }, []);

  async function fetchTodayArrivals() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await reservationsApi.list({
        date_from: today,
        date_to: today,
        status: 'confirmed',
        per_page: limit
      });
      setArrivals(response.data);
    } catch (error) {
      console.error('Error fetching today arrivals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExpressCheckIn(reservation: Reservation) {
    try {
      await reservationsApi.expressCheckIn(reservation.id);
      setSuccessMessage('Express check-in completed successfully!');
      await fetchTodayArrivals();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSuccessMessage(error.message || 'Failed to complete express check-in');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading arrivals...
      </div>
    );
  }

  if (arrivals.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        No arrivals today
      </div>
    );
  }

  return (
    <div>
      {showHeader && (
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
            Today's Arrivals
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {new Date().toLocaleDateString()}
          </span>
        </div>
      )}

      {successMessage && (
        <div style={{
          background: successMessage.includes('Failed') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          border: `1px solid ${successMessage.includes('Failed') ? '#ef4444' : '#22c55e'}`,
          color: successMessage.includes('Failed') ? '#ef4444' : '#22c55e',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
        }}>
          {successMessage}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {arrivals.map((reservation) => (
          <div
            key={reservation.id}
            onClick={() => router.push(`/dashboard/reservations/${reservation.id}`)}
            style={{
              padding: '16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  {reservation.reservation_number}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  {reservation.guest?.full_name || 'Unknown'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  {reservation.room?.room_number || 'TBD'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {reservation.room_type?.name || ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {reservation.adults} adult{reservation.adults !== 1 ? 's' : ''}, {reservation.children} child{reservation.children !== 1 ? 'ren' : ''}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#6366f1' }}>
                ${reservation.total_amount.toFixed(2)}
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpressCheckIn(reservation);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                ⚡ Express Check-In
              </button>
            </div>
          </div>
        ))}
      </div>

      {arrivals.length >= limit && (
        <button
          onClick={() => router.push('/dashboard/reservations')}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          View All Reservations
        </button>
      )}
    </div>
  );
}