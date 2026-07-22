'use client';

import type { OccupancyDataPoint } from '@/types';

interface OccupancyChartProps {
  data: OccupancyDataPoint[];
  loading: boolean;
}

export default function OccupancyChart({ data, loading }: OccupancyChartProps) {
  const maxRate = Math.max(...data.map(d => d.rate), 100);
  const avgRate = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length)
    : 0;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.2px',
            marginBottom: '4px',
          }}>Occupancy Rate</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Last 7 days</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.6px',
            lineHeight: 1,
          }}>
            {loading ? '—' : `${avgRate}%`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px', fontWeight: '500' }}>
            7-day average
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{
          height: '140px',
          background: 'var(--color-surface-2)',
          borderRadius: '8px',
          animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        }} />
      ) : (
        <div>
          {/* Bar chart */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            height: '140px',
          }}>
            {data.map((point, i) => {
              const pct = (point.rate / maxRate) * 100;
              const isHigh = point.rate >= 85;
              const color = isHigh ? '#10b981' : '#6366f1';
              const bgColor = isHigh ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)';

              return (
                <div
                  key={point.date}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                  title={`${point.date}: ${point.rate}%`}
                >
                  {/* Value label on hover */}
                  <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${pct}%`,
                        background: bgColor,
                        borderRadius: '5px 5px 3px 3px',
                        border: `1px solid ${color}30`,
                        position: 'relative',
                        minHeight: '8px',
                        transition: 'background 0.2s',
                        cursor: 'default',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '6px',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.background = bgColor.replace('0.12', '0.22');
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.background = bgColor;
                      }}
                    >
                      {/* Top accent line */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: color,
                        borderRadius: '2px 2px 0 0',
                        opacity: 0.8,
                      }} />
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '600',
                        color,
                        opacity: pct > 30 ? 1 : 0,
                      }}>
                        {point.rate}%
                      </span>
                    </div>
                  </div>

                  {/* Day label */}
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    fontWeight: '500',
                  }}>{point.date}</span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid var(--color-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#6366f1' }} />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Normal (&lt;85%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }} />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>High (≥85%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
