'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { format, addDays, subDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

interface DailySummary {
  room_type_name: string;
  total_rooms: number;
  available: number;
  booked: number;
  blocked: number;
  maintenance: number;
  cleaning: number;
}

export default function DailyAvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summary, setSummary] = useState<DailySummary[]>([]);
  const [mounted, setMounted] = useState(false);

  const locale = useLocale();
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';
  const dateLocale = isRtl ? ar : enUS;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetchDailySummary();
  }, [currentDate]);

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      const response = await api.get('/availability/daily', {
        params: { date: format(currentDate, 'yyyy-MM-dd') },
      });
      setSummary(response.data.summary || []);
    } catch (error) {
      console.error('Failed to fetch daily summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRooms      = summary.reduce((s, i) => s + i.total_rooms,  0);
  const totalAvailable  = summary.reduce((s, i) => s + i.available,    0);
  const totalBooked     = summary.reduce((s, i) => s + i.booked,       0);
  const totalMaint      = summary.reduce((s, i) => s + i.maintenance,  0);
  const totalBlocked    = summary.reduce((s, i) => s + i.blocked,      0);
  const occupancy       = totalRooms > 0 ? Math.round(((totalRooms - totalAvailable) / totalRooms) * 100) : 0;

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', color: 'var(--color-text-primary)', direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <div style={{
              width: '40px', height: '40px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16,185,129,0.35)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="1.8"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="8" cy="16" r="1.5" fill="white"/>
                <circle cx="12" cy="16" r="1.5" fill="white"/>
                <circle cx="16" cy="16" r="1.5" fill="white"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>
                {isRtl ? 'التوفر اليومي' : 'Daily Availability'}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '2px' }}>
                {isRtl ? 'ملخص توفر الغرف حسب نوع الغرفة' : 'Room availability snapshot by room type'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <Link href={`/${locale}/dashboard/availability`} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              color: 'var(--color-text-secondary)',
              fontSize: '13px', fontWeight: '500',
              textDecoration: 'none',
              flexDirection: isRtl ? 'row-reverse' : 'row',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }}>
                <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{isRtl ? 'عرض التقويم' : 'Calendar View'}</span>
            </Link>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '4px',
              flexDirection: isRtl ? 'row-reverse' : 'row',
            }}>
              <button onClick={() => setCurrentDate(subDays(currentDate, 1))} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-secondary)', padding: '6px 10px', borderRadius: '7px',
                display: 'flex', alignItems: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <span style={{ fontSize: '13px', fontWeight: '600', padding: '0 10px', minWidth: '180px', textAlign: 'center', color: 'var(--color-text-primary)' }}>
                {format(currentDate, 'EEEE, MMM d, yyyy', { locale: dateLocale })}
              </span>
              <button onClick={() => setCurrentDate(addDays(currentDate, 1))} style={{
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
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', borderRadius: '10px',
              color: 'white', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(16,185,129,0.3)',
            }}>
              {tCommon('today')}
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: isRtl ? 'إجمالي الغرف' : 'Total Rooms',  value: loading ? '…' : String(totalRooms),     accent: '#6366f1', icon: '🏨' },
          { label: isRtl ? 'المتاحة' : 'Available',    value: loading ? '…' : String(totalAvailable),  accent: '#10b981', icon: '✅' },
          { label: isRtl ? 'المحجوزة' : 'Booked',       value: loading ? '…' : String(totalBooked),     accent: '#8b5cf6', icon: '📅' },
          { label: isRtl ? 'الصيانة' : 'Maintenance',  value: loading ? '…' : String(totalMaint),      accent: '#f59e0b', icon: '🔧' },
          { label: isRtl ? 'المحظورة' : 'Blocked',      value: loading ? '…' : String(totalBlocked),    accent: '#ef4444', icon: '🚫' },
          { label: isRtl ? 'نسبة الإشغال' : 'Occupancy',    value: loading ? '…' : `${occupancy}%`,         accent: '#ec4899', icon: '📊' },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '18px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: s.accent }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'var(--color-surface-2)',
          flexDirection: isRtl ? 'row-reverse' : 'row',
        }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
            {isRtl ? 'تفاصيل أنواع الغرف' : 'Room Type Breakdown'}
          </span>
          <span style={{ marginLeft: isRtl ? '0' : 'auto', marginRight: isRtl ? 'auto' : '0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {loading ? tCommon('loading') : `${summary.length} ${isRtl ? 'أنواع' : 'types'}`}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.15)' }}>
                {[
                  isRtl ? 'نوع الغرفة' : 'Room Type',
                  isRtl ? 'الإجمالي' : 'Total',
                  isRtl ? 'المتاح' : 'Available',
                  isRtl ? 'المحجوز' : 'Booked',
                  isRtl ? 'المحظور' : 'Blocked',
                  isRtl ? 'الصيانة' : 'Maintenance',
                  isRtl ? 'التنظيف' : 'Cleaning',
                  isRtl ? 'الإشغال' : 'Occupancy'
                ].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    fontSize: '10px', fontWeight: '700',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    borderBottom: '1px solid var(--color-border)',
                    whiteSpace: 'nowrap',
                    textAlign: isRtl ? 'right' : 'left',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                    {tCommon('loading')}
                  </td>
                </tr>
              ) : summary.map((row, i) => {
                const rowOcc = row.total_rooms > 0 ? Math.round(((row.total_rooms - row.available) / row.total_rooms) * 100) : 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{row.room_type_name}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>{row.total_rooms}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#10b981' }}>{row.available}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#8b5cf6' }}>{row.booked}</td>
                    <td style={{ padding: '14px 16px', color: '#ef4444' }}>{row.blocked}</td>
                    <td style={{ padding: '14px 16px', color: '#f59e0b' }}>{row.maintenance}</td>
                    <td style={{ padding: '14px 16px', color: '#06b6d4' }}>{row.cleaning}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#ec4899' }}>{rowOcc}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
