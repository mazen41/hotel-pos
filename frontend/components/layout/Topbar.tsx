'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { notificationsApi, cashShiftsApi, tablesApi, ordersApi } from '@/lib/api';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useLocale, useTranslations } from 'next-intl';
import type { CashShift } from '@/types';

interface TopbarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle?: () => void;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

function getBreadcrumb(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Home';
  const last = segments[segments.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1);
}

// ─── Close Shift Dialog ───────────────────────────────────────────────────────
function CloseShiftDialog({
  shift,
  onClose,
  onSuccess,
  isRtl,
}: {
  shift: CashShift;
  onClose: () => void;
  onSuccess: () => void;
  isRtl: boolean;
}) {
  const [countedCash, setCountedCash] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockedItems, setBlockedItems] = useState<string[]>([]);

  const doClose = async () => {
    setSaving(true);
    setBlockError(null);
    try {
      // Fresh validation from backend — it will reject if active orders exist
      await cashShiftsApi.close(shift.id, {
        counted_cash: parseFloat(countedCash) || 0,
        closing_notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to close shift.';
      setBlockError(msg);
      if (err?.active_orders) setBlockedItems(err.active_orders);
    } finally {
      setSaving(false);
    }
  };

  // Pre-validate: check tables + orders before showing form
  useEffect(() => {
    let mounted = true;
    setValidating(true);
    Promise.all([
      tablesApi.list(),
      ordersApi.list({ status: 'pending' }),
    ]).then(([tablesRes, ordersRes]) => {
      if (!mounted) return;
      const blockedTables = tablesRes.data.filter(
        t => t.status === 'occupied' || t.status === 'pending_payment'
      );
      // Also check active orders from the API
      const activeOrderNums = ordersRes.data.map(o => o.order_number);
      const items: string[] = [
        ...blockedTables.map(t => `Table ${t.number} (${t.status})`),
        ...activeOrderNums,
      ];
      if (items.length > 0) {
        setBlockError(`Cannot close shift — ${items.length} active item(s) must be resolved first.`);
        setBlockedItems(items);
      }
    }).catch(() => {}).finally(() => {
      if (mounted) setValidating(false);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '16px',
        padding: '28px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        direction: isRtl ? 'rtl' : 'ltr',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            Close Shift
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', padding: '4px', borderRadius: '6px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Shift info */}
        <div style={{
          background: 'var(--color-surface-elevated)',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
          fontSize: '13px', color: 'var(--color-text-secondary)',
        }}>
          <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            {shift.shift_name ?? shift.name ?? 'Current Shift'}
          </div>
          <div>{shift.shift_taker ?? 'Cashier'} • Opened {new Date(shift.opened_at).toLocaleString()}</div>
        </div>

        {/* Blocking warning */}
        {blockError && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
            fontSize: '13px', color: '#f87171',
          }}>
            <div style={{ fontWeight: '600', marginBottom: blockedItems.length > 0 ? '8px' : 0 }}>{blockError}</div>
            {blockedItems.length > 0 && (
              <ul style={{ margin: 0, padding: isRtl ? '0 16px 0 0' : '0 0 0 16px', lineHeight: 1.8 }}>
                {blockedItems.slice(0, 5).map((item, i) => <li key={i}>{item}</li>)}
                {blockedItems.length > 5 && <li>...and {blockedItems.length - 5} more</li>}
              </ul>
            )}
          </div>
        )}

        {!blockError && !validating && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Counted Cash (EGP)
              </label>
              <input
                type="number" min="0" step="0.01"
                value={countedCash}
                onChange={e => setCountedCash(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)',
                  fontSize: '15px', outline: 'none',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Closing Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px', outline: 'none', resize: 'none',
                }}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', borderRadius: '10px',
            border: '1px solid var(--color-border)',
            background: 'transparent', color: 'var(--color-text-secondary)',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          }}>
            Cancel
          </button>
          {!blockError && !validating && (
            <button
              onClick={doClose}
              disabled={saving}
              style={{
                flex: 1, padding: '11px', borderRadius: '10px',
                background: '#ef4444', color: 'white',
                border: 'none', fontSize: '14px', fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {saving ? 'Closing...' : 'Close Shift'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
export default function Topbar({ sidebarCollapsed: _, onMobileMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations('layout');
  const isRtl = locale === 'ar';

  const isPosPage = pathname.startsWith('/pos');

  const page = getBreadcrumb(pathname);
  const pageKey = page.toLowerCase();
  const isId = !isNaN(Number(page)) || page.startsWith('res_') || page.startsWith('g_');
  const translatedPage = isId ? page : (t.has(pageKey) ? t(pageKey) : page);

  // Current shift state (only on POS pages)
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [showCloseShiftDialog, setShowCloseShiftDialog] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Date
  const now = new Date();
  const dateStr = now.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Load shift for POS pages
  useEffect(() => {
    if (!isPosPage) return;
    setShiftLoading(true);
    cashShiftsApi.getCurrent()
      .then(({ data }) => setCurrentShift(data))
      .catch(() => setCurrentShift(null))
      .finally(() => setShiftLoading(false));
  }, [isPosPage, pathname]);

  // Outside click for notification dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch notifications
  useEffect(() => {
    notificationsApi.list({ per_page: 10 })
      .then(res => { setNotifications(res.data); setUnreadCount(res.unread_count); })
      .catch(() => {});
    const interval = setInterval(() => {
      notificationsApi.unreadCount()
        .then(res => setUnreadCount(res.unread_count))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'ar' : 'en';
    router.replace(pathname, { locale: nextLocale });
  };

  const handleShiftClosed = useCallback(() => {
    setCurrentShift(null);
    setShowCloseShiftDialog(false);
    // Reload the page so the POS resets to "Open Shift" state
    window.location.reload();
  }, []);

  // Check permission for closing shift
  // We do a simple check: if user is set, we assume they can close (backend enforces actual permission)
  const canCloseShift = !!user;

  return (
    <>
      <header style={{
        height: '60px',
        background: 'var(--color-sidebar)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isRtl ? '0 16px 0 20px' : '0 20px 0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
        gap: '12px',
      }}>
        {/* ── Left: hamburger (mobile) + breadcrumb + shift badge ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexShrink: 1 }}>
          {/* Mobile hamburger */}
          <button
            onClick={onMobileMenuToggle}
            className="lg-hidden"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px', borderRadius: '6px',
              color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{t('hotelOS')}</span>
            <span style={{ color: 'var(--color-border-light)', fontSize: '12px' }}>/</span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {translatedPage}
            </span>
          </div>

          {/* Shift badge — POS pages only */}
          {isPosPage && !shiftLoading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: currentShift ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              border: `1px solid ${currentShift ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
              borderRadius: '20px',
              padding: '3px 10px',
              flexShrink: 0,
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: currentShift ? 'var(--color-success)' : '#f59e0b',
                animation: currentShift ? 'pulse-dot 2s ease-in-out infinite' : 'none',
              }} />
              <span style={{
                fontSize: '11px', fontWeight: '600',
                color: currentShift ? 'var(--color-success)' : '#f59e0b',
                whiteSpace: 'nowrap',
              }}>
                {currentShift
                  ? (currentShift.shift_name ?? currentShift.name ?? 'Shift Open')
                  : 'No Shift'}
              </span>
            </div>
          )}
        </div>

        {/* ── Right: controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Date — hidden on small screens */}
          <span style={{
            fontSize: '12px', color: 'var(--color-text-muted)',
            whiteSpace: 'nowrap',
          }} className="hide-on-mobile">
            {dateStr}
          </span>

          {/* Close Shift button — POS pages, active shift only */}
          {isPosPage && currentShift && canCloseShift && (
            <button
              onClick={() => setShowCloseShiftDialog(true)}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#f87171',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                e.currentTarget.style.color = '#f87171';
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span className="hide-on-mobile">Close Shift</span>
            </button>
          )}

          {/* Language switcher */}
          <button
            onClick={toggleLanguage}
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
          >
            <span>🌐</span>
            <span className="hide-on-mobile">{locale === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Notification bell */}
          <div ref={notificationRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px', borderRadius: '6px',
                display: 'flex', alignItems: 'center',
                transition: 'background 0.2s', position: 'relative',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-primary)' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '4px',
                  right: isRtl ? 'auto' : '4px', left: isRtl ? '4px' : 'auto',
                  background: 'var(--color-danger)', color: 'white',
                  fontSize: '10px', fontWeight: '600',
                  minWidth: '16px', height: '16px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div style={{
                position: 'absolute', top: '100%',
                right: isRtl ? 'auto' : 0, left: isRtl ? 0 : 'auto',
                width: '300px', background: 'var(--color-bg)',
                border: '1px solid var(--color-border)', borderRadius: '10px',
                marginTop: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                zIndex: 100, maxHeight: '380px', overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  direction: isRtl ? 'rtl' : 'ltr',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                    {t('notifications')}
                  </span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} style={{
                      background: 'none', border: 'none',
                      color: 'var(--color-primary)', fontSize: '11px',
                      cursor: 'pointer', padding: '4px 8px', borderRadius: '4px',
                    }}>
                      {t('markAllRead')}
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', direction: isRtl ? 'rtl' : 'ltr' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      {t('noNotifications')}
                    </div>
                  ) : notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '10px 16px', borderBottom: '1px solid var(--color-border-light)',
                      cursor: 'pointer',
                      background: n.is_read ? 'transparent' : 'var(--color-primary-dim)',
                      textAlign: isRtl ? 'right' : 'left',
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {new Date(n.created_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User avatar */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '600', color: 'white',
                flexShrink: 0, boxShadow: '0 0 10px rgba(99,102,241,0.3)',
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ lineHeight: 1.3, textAlign: isRtl ? 'right' : 'left' }} className="hide-on-mobile">
                <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-primary)' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{t('admin')}</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Close Shift Dialog */}
      {showCloseShiftDialog && currentShift && (
        <CloseShiftDialog
          shift={currentShift}
          isRtl={isRtl}
          onClose={() => setShowCloseShiftDialog(false)}
          onSuccess={handleShiftClosed}
        />
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .hide-on-mobile { display: flex; }
        .lg-hidden { display: none; }
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          .lg-hidden { display: flex !important; }
        }
      `}</style>
    </>
  );
}
