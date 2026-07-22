'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/lib/api';
import type { KPI, ActivityItem, OccupancyDataPoint } from '@/types';
import KPICard from '@/components/dashboard/KPICard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import OccupancyChart from '@/components/dashboard/OccupancyChart';
import { useLocale, useTranslations } from 'next-intl';

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [trend, setTrend] = useState<OccupancyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  useEffect(() => {
    async function fetchAll() {
      try {
        const [kpiRes, actRes, trendRes] = await Promise.all([
          dashboardApi.kpis(),
          dashboardApi.recentActivity(),
          dashboardApi.occupancyTrend(),
        ]);
        setKpis(kpiRes.data);
        setActivity(actRes.data);
        setTrend(trendRes.data);
      } catch {
        // silently fail — mock data available
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const getKpiLabel = (key: string, defaultLabel: string) => {
    switch (key) {
      case 'total_reservations': return t('totalReservations');
      case 'occupancy_rate': return t('occupancyRate');
      case 'todays_checkins': return t('todaysCheckins');
      case 'todays_checkouts': return t('todaysCheckouts');
      case 'total_revenue': return t('totalRevenue');
      default: return defaultLabel;
    }
  };

  const getPeriodLabel = (period: string) => {
    if (period.includes('last month')) return t('vsLastMonth');
    if (period.includes('yesterday')) return t('vsYesterday');
    return period;
  };

  const kpiData: KPI[] = (kpis.length > 0 ? kpis : [
    { key: 'total_reservations', label: 'Total Reservations', value: 1284, change: '+12.5%', trend: 'up' as const, period: 'vs last month' },
    { key: 'occupancy_rate',     label: 'Occupancy Rate',     value: '78.4%', change: '+3.2%', trend: 'up' as const, period: 'vs last month' },
    { key: 'todays_checkins',    label: "Today's Check-ins",  value: 24, change: '-2', trend: 'down' as const, period: 'vs yesterday' },
    { key: 'todays_checkouts',   label: "Today's Check-outs", value: 18, change: '+4', trend: 'up' as const, period: 'vs yesterday' },
    { key: 'total_revenue',      label: 'Total Revenue',      value: '$284,750', change: '+8.1%', trend: 'up' as const, period: 'vs last month' },
  ]).map(item => ({
    ...item,
    label: getKpiLabel(item.key, item.label),
    period: getPeriodLabel(item.period)
  }));

  const getActivityDesc = (desc: string) => {
    if (desc.includes('Checked in to Deluxe Suite')) return locale === 'ar' ? 'سجل الوصول إلى الجناح الفاخر' : 'Checked in to Deluxe Suite';
    if (desc.includes('New reservation for 3 nights')) return locale === 'ar' ? 'حجز جديد لمدة 3 ليالٍ' : 'New reservation for 3 nights';
    if (desc.includes('Checked out from Standard Room')) return locale === 'ar' ? 'سجل المغادرة من الغرفة القياسية' : 'Checked out from Standard Room';
    if (desc.includes('New reservation via Booking.com')) return locale === 'ar' ? 'حجز جديد عبر Booking.com' : 'New reservation via Booking.com';
    if (desc.includes('Checked in to Executive Room')) return locale === 'ar' ? 'سجل الوصول إلى الغرفة التنفيذية' : 'Checked in to Executive Room';
    return desc;
  };

  const getActivityTime = (time: string) => {
    if (time.includes('minutes ago')) {
      const num = parseInt(time);
      return locale === 'ar' ? `قبل ${num} دقائق` : `${num} minutes ago`;
    }
    if (time.includes('hour ago')) return locale === 'ar' ? 'قبل ساعة' : '1 hour ago';
    if (time.includes('hours ago')) {
      const num = parseInt(time);
      return locale === 'ar' ? `قبل ${num} ساعات` : `${num} hours ago`;
    }
    return time;
  };

  const activityData: ActivityItem[] = (activity.length > 0 ? activity : ([
    { id: 1, type: 'check_in',   guest: 'Amira Hassan',  room: '304', description: 'Checked in to Deluxe Suite',       time: '2 minutes ago' },
    { id: 2, type: 'reservation', guest: 'Karim Mansour', room: '512', description: 'New reservation for 3 nights',     time: '18 minutes ago' },
    { id: 3, type: 'check_out',  guest: 'Nadia Saleh',   room: '208', description: 'Checked out from Standard Room',   time: '1 hour ago' },
    { id: 4, type: 'reservation', guest: 'Omar Fathy',    room: '101', description: 'New reservation via Booking.com', time: '2 hours ago' },
    { id: 5, type: 'check_in',   guest: 'Layla Ibrahim',  room: '406', description: 'Checked in to Executive Room',    time: '3 hours ago' },
  ] as ActivityItem[])).map(item => ({
    ...item,
    description: getActivityDesc(item.description),
    time: getActivityTime(item.time)
  }));

  const getTrendDay = (date: string) => {
    const days: Record<string, string> = {
      'Mon': locale === 'ar' ? 'الإثنين' : 'Mon',
      'Tue': locale === 'ar' ? 'الثلاثاء' : 'Tue',
      'Wed': locale === 'ar' ? 'الأربعاء' : 'Wed',
      'Thu': locale === 'ar' ? 'الخميس' : 'Thu',
      'Fri': locale === 'ar' ? 'الجمعة' : 'Fri',
      'Sat': locale === 'ar' ? 'السبت' : 'Sat',
      'Sun': locale === 'ar' ? 'الأحد' : 'Sun',
    };
    return days[date] || date;
  };

  const trendData: OccupancyDataPoint[] = (trend.length > 0 ? trend : [
    { date: 'Mon', rate: 72 },
    { date: 'Tue', rate: 68 },
    { date: 'Wed', rate: 81 },
    { date: 'Thu', rate: 75 },
    { date: 'Fri', rate: 89 },
    { date: 'Sat', rate: 94 },
    { date: 'Sun', rate: 78 },
  ]).map(item => ({
    ...item,
    date: getTrendDay(item.date)
  }));

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
            <h1 style={{
              fontSize: '22px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.5px',
              marginBottom: '4px',
            }}>
              {t('greeting', { greeting: t(getGreeting()), name: user?.name?.split(' ')[0] ?? (isRtl ? 'المسؤول' : 'Admin') })}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>
              {t('subheading')}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            flexDirection: isRtl ? 'row-reverse' : 'row',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <KPICardSkeleton key={i} />)
          : kpiData.map(kpi => <KPICard key={kpi.key} kpi={kpi} />)
        }
      </div>

      {/* Second row: Activity + Chart */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isRtl ? '340px 1fr' : '1fr 340px',
        gap: '16px',
      }}>
        {isRtl ? (
          <>
            <ActivityFeed items={activityData} loading={loading} />
            <OccupancyChart data={trendData} loading={loading} />
          </>
        ) : (
          <>
            <OccupancyChart data={trendData} loading={loading} />
            <ActivityFeed items={activityData} loading={loading} />
          </>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function KPICardSkeleton() {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '20px',
      animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: '12px', background: 'var(--color-border)', borderRadius: '4px', width: '60%', marginBottom: '16px' }} />
      <div style={{ height: '28px', background: 'var(--color-border)', borderRadius: '4px', width: '40%', marginBottom: '10px' }} />
      <div style={{ height: '11px', background: 'var(--color-border)', borderRadius: '4px', width: '50%' }} />
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
