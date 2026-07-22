'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { reservationsApi, roomsApi, ApiError } from '@/lib/api';
import type { Reservation, Room } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_WIDTH = 48;
const ROW_HEIGHT = 56;
const ROOM_LABEL_WIDTH = 180;
const HEADER_HEIGHT = 64;

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  confirmed:   { bg: '#eef2ff', border: '#818cf8', text: '#3730a3', dot: '#6366f1' },
  pending:     { bg: '#fefce8', border: '#fbbf24', text: '#92400e', dot: '#f59e0b' },
  checked_in:  { bg: '#eff6ff', border: '#60a5fa', text: '#1e40af', dot: '#3b82f6' },
  checked_out: { bg: '#f9fafb', border: '#d1d5db', text: '#374151', dot: '#9ca3af' },
  cancelled:   { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', dot: '#ef4444' },
  no_show:     { bg: '#fdf4ff', border: '#d8b4fe', text: '#6b21a8', dot: '#a855f7' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function diffDays(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DragState {
  reservationId: number;
  originalRoomId: number;
  offsetDays: number;
}

interface DropPreview {
  roomId: number;
  checkIn: Date;
  checkOut: Date;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalendarPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [today] = useState(() => startOfDay(new Date()));

  const locale = useLocale();
  const t = useTranslations('reservations');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  function fmt(d: Date, opts: Intl.DateTimeFormatOptions) {
    return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', opts);
  }

  // View window: 60 days starting from viewStart
  const [viewStart, setViewStart] = useState(() => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - 7);
    return d;
  });
  const VIEW_DAYS = 60;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Filters
  const [filterFloor, setFilterFloor] = useState('');
  const [filterType, setFilterType] = useState('');

  // Drag & drop
  const dragRef = useRef<DragState | null>(null);
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Detail popup
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  // ─── Data Fetching ───────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, resRes] = await Promise.all([
        roomsApi.list({ active: true, sort: 'room_number', direction: 'asc' }),
        reservationsApi.list({
          date_from: toISO(viewStart),
          date_to: toISO(addDays(viewStart, VIEW_DAYS)),
          per_page: 500,
        }),
      ]);
      setRooms(roomsRes.data);
      setReservations(resRes.data);
    } catch {
      showToast(isRtl ? 'فشل تحميل بيانات التقويم' : 'Failed to load calendar data', false);
    } finally {
      setLoading(false);
    }
  }, [viewStart, isRtl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Scroll to today on mount
  useEffect(() => {
    if (!scrollRef.current || loading) return;
    const todayOffset = diffDays(viewStart, today);
    if (todayOffset >= 0) {
      scrollRef.current.scrollLeft = todayOffset * DAY_WIDTH - 120;
    }
  }, [loading]);

  // ─── Toast ───────────────────────────────────────────────────────────────────

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ─── Derived Data ────────────────────────────────────────────────────────────

  const floors = [...new Set(rooms.map(r => r.floor).filter(Boolean))].sort() as string[];
  const roomTypes = [...new Set(rooms.map(r => r.room_type?.name).filter(Boolean))].sort() as string[];

  const filteredRooms = rooms.filter(r => {
    if (filterFloor && r.floor !== filterFloor) return false;
    if (filterType && r.room_type?.name !== filterType) return false;
    return true;
  });

  const days = Array.from({ length: VIEW_DAYS }, (_, i) => addDays(viewStart, i));

  // Render UI
  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: isRtl ? 'auto' : '24px', left: isRtl ? '24px' : 'auto', zIndex: 9999,
          background: toast.ok ? '#10b981' : '#ef4444', color: '#fff',
          padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-text-primary)', letterSpacing: '-0.4px', marginBottom: '2px' }}>
            {isRtl ? 'تقويم الحجوزات (المخطط الزمني)' : 'Reservations Timeline'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {isRtl ? 'عرض بصري للحجوزات وإدارتها بالسحب والإفلات' : 'Visual room timeline — drag to move or reassign bookings'}
          </p>
        </div>

        {/* Date Navigation & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <button
            onClick={() => setViewStart(d => addDays(d, -14))}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '12px', cursor: 'pointer' }}
          >
            ← {isRtl ? 'أسبوعان قبل' : '2 wks'}
          </button>
          <button
            onClick={() => {
              const d = startOfDay(new Date());
              d.setDate(d.getDate() - 7);
              setViewStart(d);
            }}
            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            {tCommon('today')}
          </button>
          <button
            onClick={() => setViewStart(d => addDays(d, 14))}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '12px', cursor: 'pointer' }}
          >
            {isRtl ? 'أسبوعان بعد' : '2 wks'} →
          </button>

          {/* Filters */}
          <select
            value={filterFloor}
            onChange={e => setFilterFloor(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '12px', direction: isRtl ? 'rtl' : 'ltr' }}
          >
            <option value="">{isRtl ? 'جميع الطوابق' : 'All Floors'}</option>
            {floors.map(f => <option key={f} value={f}>{isRtl ? `الطابق ${f}` : `Floor ${f}`}</option>)}
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '12px', direction: isRtl ? 'rtl' : 'ltr' }}
          >
            <option value="">{isRtl ? 'جميع الأنواع' : 'All Types'}</option>
            {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '12px', color: 'var(--color-text-muted)', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        {Object.entries(STATUS_STYLES).map(([st, style]) => (
          <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: style.dot }} />
            <span>{st.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Timeline view */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {tCommon('loading')}
        </div>
      ) : (
        <div style={{
          position: 'relative',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'var(--color-surface)',
        }}>
          <div ref={scrollRef} style={{ overflowX: 'auto', position: 'relative' }}>
            <div style={{ minWidth: `${ROOM_LABEL_WIDTH + VIEW_DAYS * DAY_WIDTH}px` }}>
              {/* Header dates */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-background)', height: `${HEADER_HEIGHT}px`, position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ width: `${ROOM_LABEL_WIDTH}px`, minWidth: `${ROOM_LABEL_WIDTH}px`, padding: '12px', fontWeight: '600', fontSize: '12px', color: 'var(--color-text-secondary)', borderRight: isRtl ? 'none' : '1px solid var(--color-border)', borderLeft: isRtl ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center' }}>
                  {tCommon('room')}
                </div>
                <div style={{ display: 'flex' }}>
                  {days.map((d, i) => {
                    const isTod = diffDays(today, d) === 0;
                    return (
                      <div key={i} style={{
                        width: `${DAY_WIDTH}px`,
                        minWidth: `${DAY_WIDTH}px`,
                        borderRight: '1px solid var(--color-border)',
                        textAlign: 'center',
                        padding: '6px 2px',
                        background: isTod ? 'rgba(99,102,241,0.1)' : 'transparent',
                      }}>
                        <div style={{ fontSize: '10px', color: isTod ? '#6366f1' : 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                          {fmt(d, { weekday: 'short' })}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: isTod ? '700' : '500', color: isTod ? '#6366f1' : 'var(--color-text-primary)' }}>
                          {d.getDate()}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                          {fmt(d, { month: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room rows */}
              {filteredRooms.map((room) => {
                const roomRes = reservations.filter(r => r.room_id === room.id);
                return (
                  <div key={room.id} style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', height: `${ROW_HEIGHT}px`, position: 'relative' }}>
                    <div style={{ width: `${ROOM_LABEL_WIDTH}px`, minWidth: `${ROOM_LABEL_WIDTH}px`, padding: '10px 12px', borderRight: isRtl ? 'none' : '1px solid var(--color-border)', borderLeft: isRtl ? '1px solid var(--color-border)' : 'none', background: 'var(--color-surface)', zIndex: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                        {isRtl ? `غرفة ${room.room_number}` : `Room ${room.room_number}`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {room.room_type?.name || 'Standard'}
                      </div>
                    </div>

                    {/* Timeline grid for room */}
                    <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
                      {days.map((d, i) => (
                        <div key={i} style={{ width: `${DAY_WIDTH}px`, minWidth: `${DAY_WIDTH}px`, borderRight: '1px solid var(--color-border)', height: '100%' }} />
                      ))}

                      {/* Render reservations */}
                      {roomRes.map(res => {
                        const inDate = new Date(res.check_in_date);
                        const outDate = new Date(res.check_out_date);
                        const leftDays = diffDays(viewStart, inDate);
                        const durDays = Math.max(1, diffDays(inDate, outDate));

                        if (leftDays + durDays < 0 || leftDays >= VIEW_DAYS) return null;

                        const style = STATUS_STYLES[res.status] || STATUS_STYLES.confirmed;

                        return (
                          <div
                            key={res.id}
                            onClick={(e) => {
                              setSelected(res);
                              setPopupPos({ x: e.clientX, y: e.clientY });
                            }}
                            style={{
                              position: 'absolute',
                              left: `${Math.max(0, leftDays * DAY_WIDTH)}px`,
                              width: `${durDays * DAY_WIDTH - 4}px`,
                              top: '8px',
                              height: '40px',
                              background: style.bg,
                              border: `1px solid ${style.border}`,
                              borderRadius: '6px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              zIndex: 2,
                              overflow: 'hidden',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: '600', color: style.text, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {res.guest ? `${res.guest.first_name} ${res.guest.last_name}` : res.reservation_number}
                            </div>
                            <div style={{ fontSize: '9px', color: style.text, opacity: 0.8 }}>
                              {res.reservation_number}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Selected Reservation Modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => setSelected(null)}>
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: isRtl ? 'right' : 'left'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
              {isRtl ? `حجز رقم: ${selected.reservation_number}` : `Reservation: ${selected.reservation_number}`}
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              <strong>{tCommon('guest')}:</strong> {selected.guest ? `${selected.guest.first_name} ${selected.guest.last_name}` : '-'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              <strong>{tCommon('room')}:</strong> {selected.room ? `${isRtl ? 'غرفة' : 'Room'} ${selected.room.room_number}` : '-'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              <strong>{isRtl ? 'الفترة' : 'Dates'}:</strong> {selected.check_in_date} → {selected.check_out_date}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              <strong>{tCommon('total')}:</strong> ${selected.total_amount.toFixed(2)}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: isRtl ? 'flex-start' : 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <button
                onClick={() => router.push(`/${locale}/dashboard/reservations/${selected.id}`)}
                style={{ padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                {tCommon('viewDetails')}
              </button>
              <button
                onClick={() => setSelected(null)}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px', color: 'var(--color-text-primary)', cursor: 'pointer' }}
              >
                {tCommon('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
