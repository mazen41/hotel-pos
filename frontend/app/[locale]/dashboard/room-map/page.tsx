'use client';

import { useState, useEffect, useCallback } from 'react';
import { roomsApi, reservationsApi, ApiError } from '@/lib/api';
import type { Room, Reservation } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

const STATUS: Record<string, { labelAr: string; labelEn: string; bg: string; border: string; text: string; dot: string; icon: string }> = {
  available:      { labelAr: 'متاحة',      labelEn: 'Available',      bg: 'rgba(16,185,129,0.1)',  border: '#10b981', text: '#10b981', dot: '#10b981', icon: '✓' },
  occupied:       { labelAr: 'مشغولة',      labelEn: 'Occupied',       bg: 'rgba(59,130,246,0.1)',  border: '#3b82f6', text: '#60a5fa', dot: '#3b82f6', icon: '●' },
  cleaning:       { labelAr: 'تنظيف',       labelEn: 'Cleaning',       bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', text: '#fbbf24', dot: '#f59e0b', icon: '◎' },
  maintenance:    { labelAr: 'صيانة',       labelEn: 'Maintenance',    bg: 'rgba(249,115,22,0.1)', border: '#f97316', text: '#fb923c', dot: '#f97316', icon: '⚙' },
  out_of_order:   { labelAr: 'خارج الخدمة', labelEn: 'Out of Order',   bg: 'rgba(239,68,68,0.1)',  border: '#ef4444', text: '#f87171', dot: '#ef4444', icon: '✕' },
  out_of_service: { labelAr: 'معطلة',       labelEn: 'Out of Service', bg: 'rgba(168,85,247,0.1)', border: '#a855f7', text: '#c084fc', dot: '#a855f7', icon: '⊘' },
};

const ALL_STATUSES = Object.keys(STATUS) as (keyof typeof STATUS)[];

interface RoomWithRes extends Room {
  activeReservation?: Reservation;
}

export default function RoomMapPage() {
  const [rooms, setRooms] = useState<RoomWithRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<RoomWithRes | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [updatingRoom, setUpdatingRoom] = useState<number | null>(null);

  const locale = useLocale();
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  function toISO(d: Date) { return d.toISOString().split('T')[0]; }

  function addDays(d: Date, n: number) {
    const c = new Date(d); c.setDate(c.getDate() + n); return c;
  }

  function fmtDate(d: Date) {
    return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function isToday(d: Date) { return toISO(d) === toISO(new Date()); }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = toISO(currentDate);

      const [roomsRes, resRes] = await Promise.all([
        roomsApi.list({ active: true, sort: 'room_number', direction: 'asc' }),
        reservationsApi.list({
          status: 'checked_in',
          date_from: dateStr,
          date_to: dateStr,
          per_page: 500,
        }),
      ]);

      const confirmedRes = await reservationsApi.list({
        status: 'confirmed',
        date_from: dateStr,
        date_to: dateStr,
        per_page: 500,
      });

      const activeMap = new Map<number, Reservation>();
      for (const r of [...resRes.data, ...confirmedRes.data]) {
        const ci = new Date(r.check_in_date);
        const co = new Date(r.check_out_date);
        const today = new Date(dateStr);
        if (ci <= today && co > today) {
          activeMap.set(r.room_id, r);
        }
      }

      const enriched: RoomWithRes[] = roomsRes.data.map(room => ({
        ...room,
        activeReservation: activeMap.get(room.id),
      }));

      setRooms(enriched);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : (isRtl ? 'فشل تحميل الغرف' : 'Failed to load rooms'), false);
    } finally {
      setLoading(false);
    }
  }, [currentDate, isRtl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const floors = [...new Set(rooms.map(r => r.floor).filter(Boolean))].sort() as string[];
  const types  = [...new Set(rooms.map(r => r.room_type?.name).filter(Boolean))].sort() as string[];

  const filtered = rooms.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterFloor  && r.floor  !== filterFloor)  return false;
    if (filterType   && r.room_type?.name !== filterType) return false;
    return true;
  });

  const byFloor = filtered.reduce<Record<string, RoomWithRes[]>>((acc, r) => {
    const f = r.floor || (isRtl ? 'الأرضي' : 'Ground');
    if (!acc[f]) acc[f] = [];
    acc[f].push(r);
    return acc;
  }, {});

  const floorKeys = Object.keys(byFloor).sort();

  const counts = rooms.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    acc._total = (acc._total || 0) + 1;
    return acc;
  }, {});

  async function changeStatus(roomId: number, status: string) {
    setUpdatingRoom(roomId);
    try {
      await roomsApi.update(roomId, { status: status as any });
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: status as any } : r));
      if (selectedRoom?.id === roomId) setSelectedRoom(prev => prev ? { ...prev, status: status as any } : null);
      showToast(isRtl ? `تم تحديث الغرفة إلى ${STATUS[status]?.labelAr || status}` : `Room updated to ${STATUS[status]?.labelEn || status}`, true);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : (isRtl ? 'فشل التحديث' : 'Update failed'), false);
    } finally {
      setUpdatingRoom(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: isRtl ? 'auto' : '24px', left: isRtl ? '24px' : 'auto', zIndex: 9999,
          background: toast.ok ? '#10b981' : '#ef4444', color: '#fff',
          padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-text-primary)', letterSpacing: '-0.4px' }}>
            {isRtl ? 'مخطط الغرف' : 'Room Map'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {isRtl ? `حالة الغرف المباشرة لـ ${fmtDate(currentDate)}` : `Live status overview for ${fmtDate(currentDate)}`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <button onClick={() => setCurrentDate(d => addDays(d, -1))} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '12px', cursor: 'pointer' }}>
            ‹ {isRtl ? 'السابق' : 'Prev'}
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
              ...(isToday(currentDate) ? { background: '#6366f1', color: 'white', border: 'none' } : { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' })
            }}
          >
            {tCommon('today')}
          </button>
          <button onClick={() => setCurrentDate(d => addDays(d, 1))} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '12px', cursor: 'pointer' }}>
            {isRtl ? 'التالي' : 'Next'} ›
          </button>
        </div>
      </div>

      {/* Grid Floor display */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          {tCommon('loading')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {floorKeys.map(floor => (
            <div key={floor} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px', color: 'var(--color-text-primary)' }}>
                {isRtl ? `الطابق ${floor}` : `Floor ${floor}`}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {byFloor[floor].map(room => {
                  const cfg = STATUS[room.status] || STATUS.available;
                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      style={{
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer',
                        textAlign: isRtl ? 'right' : 'left',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                          {room.room_number}
                        </span>
                        <span style={{ fontSize: '12px', color: cfg.text }}>
                          {cfg.icon}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        {room.room_type?.name}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: cfg.text }}>
                        {isRtl ? cfg.labelAr : cfg.labelEn}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Room Modal */}
      {selectedRoom && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => setSelectedRoom(null)}>
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: isRtl ? 'right' : 'left'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
              {isRtl ? `غرفة ${selectedRoom.room_number}` : `Room ${selectedRoom.room_number}`}
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              <div><strong>{tCommon('type')}:</strong> {selectedRoom.room_type?.name}</div>
              <div><strong>{tCommon('status')}:</strong> {isRtl ? STATUS[selectedRoom.status]?.labelAr : STATUS[selectedRoom.status]?.labelEn}</div>
              <div><strong>{isRtl ? 'الطابق' : 'Floor'}:</strong> {selectedRoom.floor}</div>
            </div>

            {/* Quick Status Change */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                {isRtl ? 'تغيير الحالة السريع' : 'Quick Status Change'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                {ALL_STATUSES.map(s => (
                  <button
                    key={s}
                    disabled={updatingRoom === selectedRoom.id}
                    onClick={() => changeStatus(selectedRoom.id, s)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${STATUS[s].border}`,
                      background: selectedRoom.status === s ? STATUS[s].border : STATUS[s].bg,
                      color: selectedRoom.status === s ? '#fff' : STATUS[s].text,
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {isRtl ? STATUS[s].labelAr : STATUS[s].labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
              <button
                onClick={() => setSelectedRoom(null)}
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
