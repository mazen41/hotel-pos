'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  labelKey: string;
  href: string;
  icon: React.ReactNode;
}

function LayoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AuditLogsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      {direction === 'left' ? (
        <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      ) : (
        <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      )}
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { label: 'POS', labelKey: 'pos', href: '/pos', icon: <LayoutIcon /> },
  { label: 'Orders', labelKey: 'orders', href: '/pos/orders', icon: <ReportsIcon /> },
  { label: 'Inventory', labelKey: 'inventory', href: '/pos/inventory', icon: <SettingsIcon /> },
  { label: 'Cash Shifts', labelKey: 'cashShifts', href: '/pos/shifts', icon: <LayoutIcon /> },
  { label: 'Returns', labelKey: 'returns', href: '/pos/returns', icon: <ReportsIcon /> },
  { label: 'Reports', labelKey: 'reports', href: '/pos/reports', icon: <ReportsIcon /> },
  { label: 'Payment Methods', labelKey: 'paymentMethods', href: '/pos/settings#payment-methods', icon: <SettingsIcon /> },
  { label: 'Roles/Permissions', labelKey: 'rolesPermissions', href: '/pos/roles', icon: <UsersIcon /> },
  { label: 'Users', labelKey: 'users', href: '/pos/users', icon: <UsersIcon /> },
  { label: 'Notifications', labelKey: 'notifications', href: '/pos/notifications', icon: <AuditLogsIcon /> },
  { label: 'Audit Log', labelKey: 'auditLogs', href: '/pos/audit-logs', icon: <AuditLogsIcon /> },
  { label: 'Settings', labelKey: 'settings', href: '/pos/settings', icon: <SettingsIcon /> },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const t = useTranslations('layout');

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const width = collapsed ? '64px' : '240px';

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: isRtl ? 'auto' : 0,
      right: isRtl ? 0 : 'auto',
      bottom: 0,
      width,
      background: 'var(--color-sidebar)',
      borderRight: isRtl ? 'none' : '1px solid var(--color-border)',
      borderLeft: isRtl ? '1px solid var(--color-border)' : 'none',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflow: 'hidden',
    }}>
      {/* Logo area */}
      <div style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0' : '0 16px',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(99,102,241,0.35)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16v10H4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 17h10v3H7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!collapsed && (
            <span style={{
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.4px',
            }}>{t('posOS')}</span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title={t('collapse')}
          >
            <ChevronIcon direction={isRtl ? "right" : "left"} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            style={{
              position: 'absolute',
              top: '14px',
              right: isRtl ? 'auto' : '8px',
              left: isRtl ? '8px' : 'auto',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={t('expand')}
          >
            <ChevronIcon direction={isRtl ? "left" : "right"} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: '600',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: collapsed ? '0' : '0 8px',
          marginBottom: '6px',
          marginTop: '4px',
          textAlign: collapsed ? 'center' : (isRtl ? 'right' : 'left'),
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}>
          {collapsed ? '•' : t('main')}
        </div>

        {NAV_ITEMS.map(item => {
          if (item.label === 'Users' && user?.role !== 'Admin') {
            return null;
          }

          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? t(item.labelKey) : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px 0' : '9px 10px',
                borderRadius: '8px',
                marginBottom: '2px',
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontWeight: isActive ? '500' : '400',
                transition: 'background 0.15s, color 0.15s',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: isRtl ? 'auto' : 0,
                  right: isRtl ? 0 : 'auto',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '18px',
                  background: 'var(--color-accent)',
                  borderRadius: isRtl ? '2px 0 0 2px' : '0 2px 2px 0',
                }} />
              )}
              <span style={{
                flexShrink: 0,
                color: isActive ? 'var(--color-accent)' : 'currentColor',
                display: 'flex',
              }}>
                {item.icon}
              </span>
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: User + Logout */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        {/* User profile mini */}
        {!collapsed && user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            marginBottom: '4px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)',
            direction: isRtl ? 'rtl' : 'ltr',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white',
              flexShrink: 0,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', textAlign: isRtl ? 'right' : 'left' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>{user.name}</div>
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>{user.email}</div>
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? t('logout') : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '10px 0' : '9px 10px',
            borderRadius: '8px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-secondary)',
            fontSize: '13.5px',
            fontWeight: '400',
            cursor: loggingOut ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s, color 0.15s',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
          }}
        >
          <LogoutIcon />
          {!collapsed && <span>{loggingOut ? t('loggingOut') : t('logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
