'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { notificationsApi } from '@/lib/api';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useLocale, useTranslations } from 'next-intl';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

interface SearchResult {
  type: 'guest' | 'reservation' | 'room';
  id: number;
  title: string;
  subtitle: string;
  url: string;
  meta: any;
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

export default function Topbar({ sidebarCollapsed: _ }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations('layout');
  
  const page = getBreadcrumb(pathname);
  const pageKey = page.toLowerCase();
  const isId = !isNaN(Number(page)) || page.startsWith('res_') || page.startsWith('g_');
  const translatedPage = isId ? page : (t.has(pageKey) ? t(pageKey) : page);

  const now = new Date();
  const dateStr = now.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ guests: SearchResult[], reservations: SearchResult[], rooms: SearchResult[] }>({
    guests: [],
    reservations: [],
    rooms: []
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults({ guests: [], reservations: [], rooms: [] });
        return;
      }

      try {
        const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data.data);
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearchClick = (result: SearchResult) => {
    router.push(result.url);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationsApi.list({ per_page: 10 });
        setNotifications(response.data);
        setUnreadCount(response.unread_count);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Fetch unread count periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationsApi.unreadCount();
        setUnreadCount(response.unread_count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'ar' : 'en';
    router.replace(pathname, { locale: nextLocale });
  };

  const isRtl = locale === 'ar';

  return (
    <header style={{
      height: '60px',
      background: 'var(--color-sidebar)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isRtl ? '0 24px 0 28px' : '0 28px 0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      flexShrink: 0,
    }}>
      {/* Left/Right breadcrumb based on direction */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '13px',
          color: 'var(--color-text-muted)',
          fontWeight: '400',
        }}>{t('hotelOS')}</span>
        <span style={{ color: 'var(--color-border-light)', fontSize: '13px' }}>/</span>
        <span style={{
          fontSize: '13px',
          color: 'var(--color-text-primary)',
          fontWeight: '500',
        }}>{translatedPage}</span>
      </div>

      {/* Center: search bar */}
      <div ref={searchRef} style={{ position: 'relative', width: '400px' }}>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => setIsSearchOpen(true)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text-primary)',
            fontSize: '13px',
            outline: 'none',
            textAlign: isRtl ? 'right' : 'left',
          }}
        />
        {isSearchOpen && (searchResults.guests.length > 0 || searchResults.reservations.length > 0 || searchResults.rooms.length > 0) && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: isRtl ? 'auto' : 0,
            right: isRtl ? 0 : 'auto',
            width: '100%',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            marginTop: '4px',
            maxHeight: '400px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 100,
          }}>
            {searchResults.guests.length > 0 && (
              <div>
                <div style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textAlign: isRtl ? 'right' : 'left',
                }}>{t('guests')}</div>
                {searchResults.guests.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleSearchClick(result)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border-light)',
                      transition: 'background 0.2s',
                      textAlign: isRtl ? 'right' : 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                      {result.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {result.subtitle}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchResults.reservations.length > 0 && (
              <div>
                <div style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textAlign: isRtl ? 'right' : 'left',
                }}>{t('reservations')}</div>
                {searchResults.reservations.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleSearchClick(result)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border-light)',
                      transition: 'background 0.2s',
                      textAlign: isRtl ? 'right' : 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                      {result.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {result.subtitle}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchResults.rooms.length > 0 && (
              <div>
                <div style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textAlign: isRtl ? 'right' : 'left',
                }}>{t('rooms')}</div>
                {searchResults.rooms.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleSearchClick(result)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      textAlign: isRtl ? 'right' : 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                      {result.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {result.subtitle}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: date + language switcher + notifications + theme + user badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{
          fontSize: '12px',
          color: 'var(--color-text-muted)',
        }}>{dateStr}</span>

        {/* Premium Language Switcher Toggle */}
        <button
          onClick={toggleLanguage}
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 0.15s, transform 0.1s',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
        >
          <span>🌐</span>
          <span>{locale === 'en' ? 'العربية' : 'English'}</span>
        </button>

        {/* Notification bell */}
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-primary)' }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: isRtl ? 'auto' : '4px',
                left: isRtl ? '4px' : 'auto',
                background: 'var(--color-danger)',
                color: 'white',
                fontSize: '10px',
                fontWeight: '600',
                minWidth: '16px',
                height: '16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {isNotificationOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: isRtl ? 'auto' : 0,
              left: isRtl ? 0 : 'auto',
              width: '320px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              marginTop: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 100,
              maxHeight: '400px',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                direction: isRtl ? 'rtl' : 'ltr',
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  {t('notifications')}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-dim)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {t('markAllRead')}
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto', direction: isRtl ? 'rtl' : 'ltr' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                    {t('noNotifications')}
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--color-border-light)',
                        cursor: 'pointer',
                        background: notification.is_read ? 'transparent' : 'var(--color-primary-dim)',
                        transition: 'background 0.2s',
                        textAlign: isRtl ? 'right' : 'left',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = notification.is_read ? 'transparent' : 'var(--color-primary-dim)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        {!notification.is_read && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--color-primary)',
                            marginTop: '6px',
                            flexShrink: 0,
                          }} />
                        )}
                        <div style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>
                          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                            {notification.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                            {notification.message}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            {new Date(notification.created_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Live badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--color-success-dim)',
          border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: '20px',
          padding: '4px 10px',
          flexDirection: isRtl ? 'row-reverse' : 'row',
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--color-success)',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '500' }}>{t('live')}</span>
        </div>

        {/* User avatar */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexDirection: isRtl ? 'row-reverse' : 'row',
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 0 10px rgba(99,102,241,0.3)',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.3, textAlign: isRtl ? 'right' : 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {t('admin')}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </header>
  );
}
