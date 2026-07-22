'use client';

import { useEffect, useState } from 'react';
import { reservationsApi, roomsApi } from '@/lib/api';
import type { Reservation, Room } from '@/types';

interface ReservationTimelineProps {
  startDate?: Date;
  days?: number;
}

interface TimelineReservation extends Reservation {
  roomNumber: string;
  roomFloor: number;
}

export default function ReservationTimeline({ startDate: initialStartDate, days = 14 }: ReservationTimelineProps) {
  const [reservations, setReservations] = useState<TimelineReservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(initialStartDate || new Date());
  const [hoveredReservation, setHoveredReservation] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [startDate, days]);

  async function fetchData() {
    setLoading(true);
    try {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days);

      const [reservationsResponse, roomsResponse] = await Promise.all([
        reservationsApi.list({
          date_from: startDate.toISOString().split('T')[0],
          date_to: endDate.toISOString().split('T')[0],
          per_page: 100
        }),
        roomsApi.list({ active: true })
      ]);

      const timelineReservations: TimelineReservation[] = reservationsResponse.data.map(res => ({
        ...res,
        roomNumber: res.room?.room_number || 'TBD',
        roomFloor: Number(res.room?.floor) || 0
      }));

      setReservations(timelineReservations);
      setRooms(roomsResponse.data);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDatesInRange(start: Date, days: number): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    for (let i = 0; i < days; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  function getReservationColor(status: string): string {
    const colors: Record<string, string> = {
      confirmed: '#22c55e',
      pending: '#eab308',
      checked_in: '#3b82f6',
      checked_out: '#6b7280',
      cancelled: '#ef4444',
      no_show: '#7f1d1d',
    };
    return colors[status] || '#6b7280';
  }

  function getReservationPosition(reservation: TimelineReservation, dates: Date[]) {
    const checkIn = new Date(reservation.check_in_date);
    const checkOut = new Date(reservation.check_out_date);
    
    const startIndex = dates.findIndex(d => d.toDateString() === checkIn.toDateString());
    const endIndex = dates.findIndex(d => d.toDateString() === checkOut.toDateString());
    
    if (startIndex === -1) return null;
    
    const dayWidth = 40; // pixels per day
    const left = startIndex * dayWidth;
    const width = Math.max((endIndex - startIndex) * dayWidth, dayWidth);
    
    return { left, width };
  }

  function handlePreviousWeek() {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() - 7);
    setStartDate(newDate);
  }

  function handleNextWeek() {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + 7);
    setStartDate(newDate);
  }

  function handleToday() {
    setStartDate(new Date());
  }

  const dates = getDatesInRange(startDate, days);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
        Loading timeline...
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handlePreviousWeek}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ← Previous
          </button>
          <button
            onClick={handleToday}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Today
          </button>
          <button
            onClick={handleNextWeek}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Next →
          </button>
        </div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
          {startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ overflowX: 'auto', padding: '20px' }}>
        <div style={{ minWidth: `${dates.length * 40 + 200}px` }}>
          {/* Date headers */}
          <div style={{ display: 'flex', marginBottom: '12px', marginLeft: '150px' }}>
            {dates.map((date, index) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              return (
                <div
                  key={index}
                  style={{
                    width: '40px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: isToday ? '#6366f1' : 'var(--color-text-secondary)',
                    fontWeight: isToday ? '600' : '400',
                    background: isToday ? 'rgba(99, 102, 241, 0.1)' : isWeekend ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                    padding: '4px 0',
                    borderRadius: '4px',
                  }}
                >
                  <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div>{date.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Room rows */}
          {rooms.map((room) => (
            <div key={room.id} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
              {/* Room label */}
              <div style={{ width: '150px', flexShrink: 0, paddingRight: '12px', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                {room.room_number}
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  {room.room_type?.name || ''}
                </div>
              </div>

              {/* Timeline track */}
              <div style={{ flex: 1, position: 'relative', height: '32px', background: 'var(--color-bg)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                {/* Grid lines */}
                {dates.map((date, index) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        left: `${index * 40}px`,
                        width: '40px',
                        height: '100%',
                        borderRight: index < dates.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                        background: isToday ? 'rgba(99, 102, 241, 0.05)' : isWeekend ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      }}
                    />
                  );
                })}

                {/* Reservations */}
                {reservations
                  .filter(res => res.room_id === room.id)
                  .map((reservation) => {
                    const position = getReservationPosition(reservation, dates);
                    if (!position) return null;

                    return (
                      <div
                        key={reservation.id}
                        onMouseEnter={() => setHoveredReservation(reservation.id)}
                        onMouseLeave={() => setHoveredReservation(null)}
                        onClick={() => window.location.href = `/dashboard/reservations/${reservation.id}`}
                        style={{
                          position: 'absolute',
                          left: `${position.left}px`,
                          width: `${position.width}px`,
                          top: '4px',
                          height: '24px',
                          background: getReservationColor(reservation.status),
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          opacity: hoveredReservation === reservation.id ? 0.9 : 0.7,
                          boxShadow: hoveredReservation === reservation.id ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        <span style={{ color: 'white', fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px' }}>
                          {reservation.guest?.full_name || reservation.reservation_number}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {Object.entries({
              confirmed: 'Confirmed',
              pending: 'Pending',
              checked_in: 'Checked In',
              checked_out: 'Checked Out',
              cancelled: 'Cancelled',
              no_show: 'No Show',
            }).map(([status, label]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: getReservationColor(status) }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
