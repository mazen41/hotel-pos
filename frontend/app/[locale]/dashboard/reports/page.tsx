'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { ApiError } from '@/lib/api';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocale, useTranslations } from 'next-intl';

type ReportType = 'occupancy' | 'revenue' | 'adr' | 'revpar' | 'arrivals' | 'departures' | 'guests' | 'housekeeping';
interface ReportMeta { label: string; icon: string; description: string; color: string; }

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://hotel-sys.loop-pr.com/api';

function toArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (val !== null && typeof val === 'object') return Object.values(val);
  return [];
}

async function apiFetchReport(type: ReportType, startDate: string, endDate: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  const res = await fetch(`${API_BASE}/reports/${type}?${params}`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.message ?? 'Failed to load report', res.status, body.errors);
  return body;
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('occupancy');
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const locale = useLocale();
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  const REPORT_META: Record<ReportType, ReportMeta> = {
    occupancy:    { label: isRtl ? 'نسبة الإشغال' : 'Occupancy',    icon: '🏨', description: isRtl ? 'معدل إشغال الغرف مع مرور الوقت' : 'Room occupancy rate over time',          color: '#6366f1' },
    revenue:      { label: isRtl ? 'الإيرادات' : 'Revenue',      icon: '💰', description: isRtl ? 'الإيرادات اليومية من المقبوضات' : 'Daily revenue from payments',             color: '#10b981' },
    adr:          { label: isRtl ? 'متوسط السعر اليومي (ADR)' : 'ADR',          icon: '📊', description: isRtl ? 'متوسط السعر اليومي لكل غرفة مباعة' : 'Average daily rate per room sold',        color: '#f59e0b' },
    revpar:       { label: isRtl ? 'متوسط الإيراد للغرفة المتاحة (RevPAR)' : 'RevPAR',       icon: '📈', description: isRtl ? 'الإيرادات لكل غرفة متاحة في الليلة' : 'Revenue per available room night',        color: '#8b5cf6' },
    arrivals:     { label: isRtl ? 'الوصول' : 'Arrivals',     icon: '✈️',  description: isRtl ? 'تسجيلات وصول النزلاء في هذه الفترة' : 'Guest check-ins in the period',         color: '#3b82f6' },
    departures:   { label: isRtl ? 'المغادرة' : 'Departures',   icon: '🚪', description: isRtl ? 'تسجيلات مغادرة النزلاء في هذه الفترة' : 'Guest check-outs in the period',         color: '#ef4444' },
    guests:       { label: isRtl ? 'النزلاء' : 'Guests',       icon: '👥', description: isRtl ? 'نشاط النزلاء وتكرار الزيارات' : 'Guest activity and visit frequency',      color: '#06b6d4' },
    housekeeping: { label: isRtl ? 'الخدمة الفندقية' : 'Housekeeping', icon: '🧹', description: isRtl ? 'نظرة عامة على إنجاز المهام والتكليفات' : 'Task completion and assignment overview', color: '#84cc16' },
  };

  const QUICK_RANGES = [
    { label: isRtl ? 'آخر 7 أيام' : 'Last 7 days',    days: 7   },
    { label: isRtl ? 'آخر 30 يوماً' : 'Last 30 days',   days: 30  },
    { label: isRtl ? 'آخر 90 يوماً' : 'Last 90 days',   days: 90  },
    { label: isRtl ? 'آخر 12 شهراً' : 'Last 12 months', days: 365 },
  ];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const body = await apiFetchReport(activeReport, startDate, endDate);
      setData(toArray(body.data ?? body.chart ?? body.rows ?? []));
      setSummary(body.summary ?? body.meta ?? {});
    } catch (e: any) {
      setError(e.message ?? (isRtl ? 'فشل تحميل التقرير' : 'Failed to load report'));
      setData([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }, [activeReport, startDate, endDate, isRtl]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const meta = REPORT_META[activeReport];
  const isBar = ['arrivals', 'departures', 'guests', 'housekeeping'].includes(activeReport);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-text-primary)', letterSpacing: '-0.4px', marginBottom: '4px' }}>
            {t('title')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {t('subtitle')}
          </p>
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          {QUICK_RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => { setStartDate(format(subDays(new Date(), r.days - 1), 'yyyy-MM-dd')); setEndDate(format(new Date(), 'yyyy-MM-dd')); }}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {r.label}
            </button>
          ))}
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '13px' }} />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>→</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '13px' }} />
        </div>
      </div>

      {/* Report type tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        {(Object.keys(REPORT_META) as ReportType[]).map(type => {
          const m = REPORT_META[type];
          const active = type === activeReport;
          return (
            <button
              key={type}
              onClick={() => setActiveReport(type)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                border: `1px solid ${active ? m.color : 'var(--color-border)'}`,
                background: active ? `${m.color}18` : 'var(--color-surface)',
                color: active ? m.color : 'var(--color-text-secondary)',
                transition: 'all 0.15s',
                flexDirection: isRtl ? 'row-reverse' : 'row',
              }}
            >
              <span>{m.icon}</span> {m.label}
            </button>
          );
        })}
      </div>

      {/* Summary cards */}
      {Object.keys(summary).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {Object.entries(summary).map(([key, val]) => (
            <div key={key} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '10px', padding: '16px',
              textAlign: isRtl ? 'right' : 'left',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                {key.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: meta.color, letterSpacing: '-0.5px' }}>
                {typeof val === 'number' ? (val % 1 === 0 ? val.toLocaleString() : val.toFixed(2)) : String(val ?? '—')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '14px', padding: '24px',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            {meta.icon} {meta.label}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{meta.description}</p>
        </div>

        {loading ? (
          <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: meta.color, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{tCommon('loading')}</span>
          </div>
        ) : error ? (
          <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '28px' }}>⚠️</span>
            <span style={{ fontSize: '13px', color: '#f87171' }}>{error}</span>
            <button onClick={fetchReport} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', fontSize: '12px', cursor: 'pointer' }}>
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : data.length === 0 ? (
          <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '28px' }}>📭</span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{isRtl ? 'لا تتوفر بيانات لهذه الفترة' : 'No data for this period'}</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            {isBar ? (
              <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Bar dataKey={data[0] ? Object.keys(data[0]).find(k => k !== 'date') ?? 'value' : 'value'} fill={meta.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={meta.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={meta.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Area type="monotone" dataKey={data[0] ? Object.keys(data[0]).find(k => k !== 'date') ?? 'value' : 'value'}
                  stroke={meta.color} strokeWidth={2} fill="url(#reportGradient)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Data table */}
      {!loading && !error && data.length > 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{isRtl ? 'البيانات التفصيلية' : 'Raw Data'}</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface)' }}>
                  {Object.keys(data[0]).map(col => (
                    <th key={col} style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap', textAlign: isRtl ? 'right' : 'left' }}>
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border-light)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    {Object.entries(row).map(([col, val]) => (
                      <td key={col} style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                        {String(val ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
