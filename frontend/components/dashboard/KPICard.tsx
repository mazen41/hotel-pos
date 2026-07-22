'use client';

import type { KPI } from '@/types';

interface KPICardProps {
  kpi: KPI;
}

const ICONS: Record<string, React.ReactNode> = {
  total_reservations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  occupancy_rate: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  todays_checkins: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  todays_checkouts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  total_revenue: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const COLORS: Record<string, { icon: string; bg: string }> = {
  total_reservations: { icon: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  occupancy_rate:     { icon: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  todays_checkins:    { icon: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  todays_checkouts:   { icon: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  total_revenue:      { icon: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

export default function KPICard({ kpi }: KPICardProps) {
  const colors = COLORS[kpi.key] ?? { icon: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
  const icon = ICONS[kpi.key];
  const isUp = kpi.trend === 'up';
  const isDown = kpi.trend === 'down';

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
        transition: 'border-color 0.15s, transform 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border-light)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Header: label + icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{
          fontSize: '12px',
          fontWeight: '500',
          color: 'var(--color-text-secondary)',
          letterSpacing: '0.01em',
        }}>{kpi.label}</span>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: colors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.icon,
          flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div style={{
        fontSize: '26px',
        fontWeight: '700',
        color: 'var(--color-text-primary)',
        letterSpacing: '-0.8px',
        lineHeight: 1,
        marginBottom: '10px',
      }}>
        {kpi.value}
      </div>

      {/* Change badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '11.5px',
          fontWeight: '600',
          color: isUp ? 'var(--color-success)' : isDown ? '#f87171' : 'var(--color-text-muted)',
          background: isUp ? 'rgba(16,185,129,0.1)' : isDown ? 'rgba(239,68,68,0.1)' : 'transparent',
          borderRadius: '4px',
          padding: '2px 6px',
        }}>
          {isUp && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <polyline points="18 15 12 9 6 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {isDown && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {kpi.change}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{kpi.period}</span>
      </div>
    </div>
  );
}
