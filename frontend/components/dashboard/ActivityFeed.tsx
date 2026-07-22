'use client';

import type { ActivityItem } from '@/types';

interface ActivityFeedProps {
  items: ActivityItem[];
  loading: boolean;
}

const TYPE_CONFIG = {
  check_in: {
    label: 'Check-in',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  check_out: {
    label: 'Check-out',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  reservation: {
    label: 'Reservation',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
};

export default function ActivityFeed({ items, loading }: ActivityFeedProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px',
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.2px',
        }}>Recent Activity</h2>
        <span style={{
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          padding: '2px 8px',
        }}>Live</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--color-border)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: '11px', background: 'var(--color-border)', borderRadius: '3px', width: '70%', marginBottom: '6px' }} />
                <div style={{ height: '10px', background: 'var(--color-border)', borderRadius: '3px', width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {items.map((item, idx) => {
            const config = TYPE_CONFIG[item.type];
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  padding: '10px 8px',
                  borderRadius: '8px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                {/* Timeline connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: config.bg,
                    color: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {config.icon}
                  </div>
                  {idx < items.length - 1 && (
                    <div style={{
                      width: '1px',
                      height: '16px',
                      background: 'var(--color-border)',
                      marginTop: '4px',
                    }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{
                      fontSize: '12.5px',
                      fontWeight: '500',
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.guest}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: config.color,
                      background: config.bg,
                      borderRadius: '4px',
                      padding: '1px 5px',
                      fontWeight: '500',
                      flexShrink: 0,
                    }}>
                      #{item.room}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '11.5px',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '2px',
                  }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {item.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
