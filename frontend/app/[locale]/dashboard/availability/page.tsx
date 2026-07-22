'use client';

import { useState, useEffect } from 'react';
import { roomTypesApi } from '@/lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

interface AvailabilityCalendarData {
  [date: string]: any[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://hotel-sys.loop-pr.com/api';

async function fetchAvailabilityCalendar(params: {
  start_date: string;
  end_date: string;
  room_type_id?: number;
}): Promise<{ calendar: AvailabilityCalendarData }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const queryString = new URLSearchParams();
  queryString.append('start_date', params.start_date);
  queryString.append('end_date', params.end_date);
  if (params.room_type_id) queryString.append('room_type_id', String(params.room_type_id));

  const response = await fetch(`${API_BASE}/availability/calendar?${queryString.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) throw new Error('Failed to fetch availability calendar');
  return response.json();
}

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<AvailabilityCalendarData>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomType, setSelectedRoomType] = useState<number | null>(null);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  const locale = useLocale();
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';
  const dateLocale = isRtl ? ar : enUS;

  useEffect(() => {
    setMounted(true);
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, selectedRoomType]);

  const fetchRoomTypes = async () => {
    try {
      const response = await roomTypesApi.list();
      setRoomTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch room types:', error);
    }
  };

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      const params: { start_date: string; end_date: string; room_type_id?: number } = {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      };
      if (selectedRoomType) params.room_type_id = selectedRoomType;
      const data = await fetchAvailabilityCalendar(params);
      setCalendarData(data.calendar || {});
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const totalEntries = Object.values(calendarData).flat().length;
  const totalAvailable = Object.values(calendarData).flat().filter((a: any) => a.status === 'available').length;
  const totalBooked = Object.values(calendarData).flat().filter((a: any) => a.status === 'booked').length;
  const occupancyRate = totalEntries > 0 ? Math.round((totalBooked / totalEntries) * 100) : 0;

  if (!mounted) return null;

  const weekDays = isRtl
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ minHeight: '100vh', color: 'var(--color-text-primary)', direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <div style={{
                width: '40px', height: '40px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(99,102,241,0.4)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="1.8"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="8"  y1="2" x2="8"  y2="6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="2.5" fill="white"/>
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>
                  {isRtl ? 'تقويم التوفر' : 'Availability Calendar'}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '2px' }}>
                  {isRtl ? 'توفر الغرف المباشر عبر جميع التواريخ' : 'Real-time room availability across all dates'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <Link href={`/${locale}/dashboard/availability/daily`} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              color: 'var(--color-text-secondary)',
              fontSize: '13px', fontWeight: '500',
              textDecoration: 'none',
              flexDirection: isRtl ? 'row-reverse' : 'row',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
              </svg>
              <span>{isRtl ? 'العرض اليومي' : 'Daily View'}</span>
            </Link>

            {/* Month nav */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '4px',
              flexDirection: isRtl ? 'row-reverse' : 'row',
            }}>
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-secondary)', padding: '6px 10px', borderRadius: '7px',
                display: 'flex', alignItems: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <span style={{ fontSize: '14px', fontWeight: '600', padding: '0 12px', minWidth: '130px', textAlign: 'center', color: 'var(--color-text-primary)' }}>
                {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
              </span>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-secondary)', padding: '6px 10px', borderRadius: '7px',
                display: 'flex', alignItems: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <button onClick={() => setCurrentDate(new Date())} style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: '10px',
              color: 'white', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(99,102,241,0.3)',
            }}>
              {tCommon('today')}
            </button>
          </div>
        </div>
      </div>

      {/* Filter and stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{isRtl ? 'نوع الغرفة' : 'Room Type'}</div>
          <select
            value={selectedRoomType || ''}
            onChange={(e) => setSelectedRoomType(e.target.value ? Number(e.target.value) : null)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)', fontSize: '13px', direction: isRtl ? 'rtl' : 'ltr'
            }}
          >
            <option value="">{isRtl ? 'جميع الأنواع' : 'All Room Types'}</option>
            {roomTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.name}</option>
            ))}
          </select>
        </div>

        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{isRtl ? 'إجمالي السجلات' : 'Total Entries'}</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#6366f1' }}>{totalEntries}</div>
        </div>

        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{isRtl ? 'الغرف المتاحة' : 'Available Rooms'}</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>{totalAvailable}</div>
        </div>

        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{isRtl ? 'نسبة الإشغال المتوقعة' : 'Expected Occupancy'}</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#ec4899' }}>{occupancyRate}%</div>
        </div>
      </div>

      {/* Month Grid */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '18px',
        padding: '24px',
      }}>
        {/* Days of week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
          {weekDays.map(d => (
            <div key={d} style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
            {tCommon('loading')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {daysInMonth.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayItems = calendarData[dateKey] || [];
              const availCount = dayItems.filter((i: any) => i.status === 'available').length;
              const isTod = isToday(day);

              return (
                <div key={dateKey} style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  padding: '10px',
                  minHeight: '80px',
                  background: isTod ? 'rgba(99,102,241,0.08)' : 'var(--color-background)',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: isTod ? '700' : '500', color: isTod ? '#6366f1' : 'var(--color-text-primary)', marginBottom: '6px' }}>
                    {format(day, 'd')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '500' }}>
                    {availCount} {isRtl ? 'متاح' : 'available'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
