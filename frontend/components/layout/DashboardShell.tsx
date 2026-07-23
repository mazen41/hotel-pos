'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useLocale, useTranslations } from 'next-intl';

interface DashboardShellProps {
  children: React.ReactNode;
  /** When true, the sidebar starts collapsed (icon-only). User can still expand it. */
  defaultCollapsed?: boolean;
}

export default function DashboardShell({ children, defaultCollapsed = false }: DashboardShellProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultCollapsed);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const t = useTranslations('common');

  // Sync defaultCollapsed on initial mount only
  useEffect(() => {
    setSidebarCollapsed(defaultCollapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 1.5s ease-in-out infinite',
            boxShadow: '0 0 20px rgba(99,102,241,0.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{t('loading')}</span>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.95); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const SIDEBAR_WIDTH = sidebarCollapsed ? '64px' : '240px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Mobile sidebar overlay backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar — always rendered; mobile slides in as overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: isRtl ? 'auto' : 0,
        right: isRtl ? 0 : 'auto',
        bottom: 0,
        zIndex: 100,
        // On mobile: translate off-screen unless mobileSidebarOpen
        transform: `translateX(${
          typeof window !== 'undefined' && window.innerWidth < 1024
            ? mobileSidebarOpen
              ? '0'
              : isRtl ? '100%' : '-100%'
            : '0'
        })`,
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
        />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        marginLeft: isRtl ? 0 : `max(64px, ${SIDEBAR_WIDTH})`,
        marginRight: isRtl ? `max(64px, ${SIDEBAR_WIDTH})` : 0,
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1), margin-right 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
        // On mobile, take full width
      }}>
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          onMobileMenuToggle={() => setMobileSidebarOpen(o => !o)}
        />
        <main style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          /* On mobile, sidebar floats over content */
          .sidebar-wrapper {
            transform: translateX(-100%) !important;
          }
          .sidebar-wrapper.open {
            transform: translateX(0) !important;
          }
          .main-content {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
