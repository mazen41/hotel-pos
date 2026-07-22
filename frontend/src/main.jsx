import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BedDouble, CalendarCheck, Crown, DoorOpen, Filter, Hotel, LayoutDashboard, LogOut, Menu, PanelLeftClose, Plus, Search, Settings, UserRound, UsersRound, X } from 'lucide-react';
import { guestsApi } from './api/guests';
import { reservationsApi } from './api/reservations';
import { roomsApi } from './api/rooms';
import './styles/app.css';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'KPIs, occupancy, and recent activity' },
  { path: '/room-types', label: 'Room Types', icon: Hotel, description: 'Rates, occupancy, and channel mapping' },
  { path: '/rooms', label: 'Rooms', icon: BedDouble, description: 'Physical inventory and availability status' },
  { path: '/guests', label: 'Guests', icon: UsersRound, description: 'Guest CRM and repeat-stay profiles' },
  { path: '/reservations', label: 'Reservations', icon: CalendarCheck, description: 'Booking lifecycle and front-desk workflow' },
  { path: '/settings', label: 'Settings', icon: Settings, description: 'Hotel profile and operating preferences' },
];

const emptyGuest = { first_name: '', last_name: '', email: '', phone: '', country: '', city: '', address: '', passport_number: '', national_id: '', date_of_birth: '', notes: '', vip_status: false, marketing_consent: false };
const emptyReservation = { guest_id: '', room_id: '', room_type_id: '', source: 'direct', check_in_date: '', check_out_date: '', adults: 1, children: 0, status: 'pending', payment_status: 'unpaid', taxes: 0, fees: 0, paid_amount: 0, special_requests: '', internal_notes: '', external_reservation_id: '', channel_manager_reference: '' };

function normalizePath(pathname) {
  if (pathname === '/' || pathname === '') return '/dashboard';
  return NAV_ITEMS.some((item) => item.path === pathname) ? pathname : '/dashboard';
}

function useDashboardRouter() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    if (window.location.pathname !== path) window.history.replaceState({}, '', path);
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function navigate(nextPath) {
    const normalized = normalizePath(nextPath);
    window.history.pushState({}, '', normalized);
    setPath(normalized);
  }

  return { path, navigate };
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://hotel-sys.loop-pr.com/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Invalid credentials. Please try again.');
        return;
      }
      localStorage.setItem('auth_token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError('Unable to reach the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginPage">
      <div className="loginCard">
        <div className="loginBrand">
          <Hotel size={36} />
          <span>NoBeds Hotel OS</span>
        </div>
        <p className="eyebrow" style={{ textAlign: 'center' }}>Welcome back</p>
        <h1 className="loginTitle">Sign in to your dashboard</h1>
        <p className="loginSub">Enter your credentials to access the hotel management system.</p>
        <form className="loginForm" onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              placeholder="admin@yourhotel.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
              autoFocus
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="loginBtn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
function DashboardShell({ children, path, navigate, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = NAV_ITEMS.find((item) => item.path === path) || NAV_ITEMS[0];

  function go(nextPath) {
    navigate(nextPath);
    setMobileOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem('auth_token');
    onLogout();
  }

  return (
    <div className={`app ${collapsed ? 'sidebarCollapsed' : ''} ${mobileOpen ? 'mobileNavOpen' : ''}`}>
      <aside className="sidebar" aria-label="Dashboard navigation">
        <div className="brand"><Hotel size={24} /><span>NoBeds Hotel OS</span></div>
        <nav>
          {NAV_ITEMS.map(({ path: itemPath, label, icon: Icon }) => (
            <button key={itemPath} className={path === itemPath ? 'active' : ''} onClick={() => go(itemPath)} aria-current={path === itemPath ? 'page' : undefined}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
          <button className="logout" onClick={handleLogout}><LogOut size={18} /><span>Logout</span></button>
        </nav>
      </aside>
      <button className="mobileScrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      <main className="main">
        <header className="topbar">
          <div className="topbarLeft">
            <button className="mobileMenu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <button className="collapseButton" onClick={() => setCollapsed((v) => !v)} aria-label="Toggle collapsed sidebar"><PanelLeftClose size={18} /></button>
            <div><p className="eyebrow">{current.label}</p><h2>{current.description}</h2></div>
          </div>
          <div className="topbarRight"><span className="systemBadge">Protected admin</span><span className="dateBadge">Hotel operations</span></div>
        </header>
        {children}
      </main>
    </div>
  );
}

// ─── Misc shared components ───────────────────────────────────────────────────
function PlaceholderPage({ title, description, actions = [] }) {
  return <section className="placeholder"><p className="eyebrow">Connected dashboard route</p><h1>{title}</h1><p>{description}</p><div className="placeholderGrid">{actions.map((action) => <div key={action}><strong>{action}</strong><span>Ready for module-specific components and future workflow expansion.</span></div>)}</div></section>;
}

function Badge({ value, type = 'status' }) { return <span className={`badge ${type}-${String(value).replace('_', '-')}`}>{String(value || '—').replace('_', ' ')}</span>; }
function Pager({ meta, load }) { return <div className="pagination"><button disabled={(meta.current_page || 1) <= 1} onClick={() => load((meta.current_page || 1) - 1)}>Previous</button><span>Page {meta.current_page || 1} of {meta.last_page || 1}</span><button disabled={(meta.current_page || 1) >= (meta.last_page || 1)} onClick={() => load((meta.current_page || 1) + 1)}>Next</button></div>; }
function nightsBetween(checkIn, checkOut) { if (!checkIn || !checkOut) return 0; return Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)); }

// ─── Guest components ─────────────────────────────────────────────────────────
function GuestForm({ guest, onCancel, onSaved }) {
  const [form, setForm] = useState(guest || emptyGuest);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, vip_status: Boolean(form.vip_status), marketing_consent: Boolean(form.marketing_consent) };
      const response = form.id ? await guestsApi.update(form.id, payload) : await guestsApi.create(payload);
      onSaved(response.data.data);
    } catch (err) { setError(err.response?.data?.message || 'Unable to save guest profile.'); }
    finally { setSaving(false); }
  }
  return <div className="modalBackdrop"><form className="guestForm modal" onSubmit={submit}><div className="modalHeader"><div><p className="eyebrow">Guest CRM</p><h2>{form.id ? 'Edit guest' : 'Create guest'}</h2></div><button type="button" onClick={onCancel}><X size={22}/></button></div>{error && <div className="error">{error}</div>}<div className="grid two"><label>First name<input required value={form.first_name} onChange={(e) => update('first_name', e.target.value)} /></label><label>Last name<input required value={form.last_name} onChange={(e) => update('last_name', e.target.value)} /></label></div><div className="grid two"><label>Email<input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} /></label><label>Phone<input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} /></label></div><div className="grid three"><label>Country<input value={form.country || ''} onChange={(e) => update('country', e.target.value)} /></label><label>City<input value={form.city || ''} onChange={(e) => update('city', e.target.value)} /></label><label>Date of birth<input type="date" value={form.date_of_birth || ''} onChange={(e) => update('date_of_birth', e.target.value)} /></label></div><div className="grid two"><label>Passport number<input value={form.passport_number || ''} onChange={(e) => update('passport_number', e.target.value)} /></label><label>National ID<input value={form.national_id || ''} onChange={(e) => update('national_id', e.target.value)} /></label></div><label>Address<textarea value={form.address || ''} onChange={(e) => update('address', e.target.value)} /></label><label>Internal notes<textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} /></label><div className="switches"><label><input type="checkbox" checked={Boolean(form.vip_status)} onChange={(e) => update('vip_status', e.target.checked)} /> VIP guest</label><label><input type="checkbox" checked={Boolean(form.marketing_consent)} onChange={(e) => update('marketing_consent', e.target.checked)} /> Marketing consent</label></div><div className="actions"><button type="button" className="ghost" onClick={onCancel}>Cancel</button><button disabled={saving}>{saving ? 'Saving…' : 'Save guest'}</button></div></form></div>;
}

function GuestProfile({ guest, onEdit }) {
  if (!guest) return <section className="profile empty"><UserRound /><h3>Select a guest</h3><p>Open a profile to view identity, contact preferences, VIP status, and future reservation history.</p></section>;
  return <section className="profile"><div className="profileTop"><div className="avatar">{guest.first_name?.[0]}{guest.last_name?.[0]}</div><div><p className="eyebrow">Guest profile</p><h2>{guest.full_name}</h2><p>{guest.email || 'No email'} · {guest.phone || 'No phone'}</p></div>{guest.vip_status && <span className="vip"><Crown size={14}/>VIP</span>}</div><div className="profileGrid"><div><span>Location</span><strong>{[guest.city, guest.country].filter(Boolean).join(', ') || '—'}</strong></div><div><span>Passport</span><strong>{guest.passport_number || '—'}</strong></div><div><span>National ID</span><strong>{guest.national_id || '—'}</strong></div><div><span>Marketing</span><strong>{guest.marketing_consent ? 'Consented' : 'Not opted in'}</strong></div></div><button className="wide" onClick={() => onEdit(guest)}>Edit profile</button><div className="history"><div><p className="eyebrow">Reservation history</p><h3>Ready for reservations</h3></div><p>Direct bookings, NoBeds OTA imports, billing activity, and repeat-guest analytics appear here as reservations are created.</p></div></section>;
}

function GuestsPage() {
  const [guests, setGuests] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', country: '', vip_status: '' });

  async function load(page = 1) {
    setLoading(true);
    try {
      const res = await guestsApi.list({ ...filters, vip_status: filters.vip_status || undefined, page, per_page: 10 });
      setGuests(res.data.data); setMeta(res.data.meta || {});
    } catch (err) { console.error('Failed to load guests:', err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(1); }, [filters.search, filters.country, filters.vip_status]);

  async function openGuest(guest) {
    try { const res = await guestsApi.show(guest.id); setSelected(res.data.data); }
    catch (err) { console.error('Failed to show guest:', err); }
  }

  function saved(guest) { setEditing(null); load(meta.current_page || 1); openGuest(guest); }

  return <><header className="hero"><div><p className="eyebrow">Phase 2</p><h1>Guest Management</h1><p>Scalable CRM profiles for direct guests, NoBeds OTA imports, loyalty, billing, and repeat-stay analytics.</p></div><button onClick={() => setEditing(emptyGuest)}><Plus size={16}/>New guest</button></header><section className="toolbar"><div className="search"><Search size={18}/><input placeholder="Search name, email, phone, passport…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}/></div><div className="filter"><Filter size={16}/><input placeholder="Country" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })}/><select value={filters.vip_status} onChange={(e) => setFilters({ ...filters, vip_status: e.target.value })}><option value="">All guests</option><option value="true">VIP only</option><option value="false">Non-VIP</option></select></div></section><div className="content"><section className="tableCard"><div className="tableHeader"><h2>Guest list</h2><span>{meta.total || 0} profiles</span></div>{loading ? <div className="loading">Loading guests…</div> : <table><thead><tr><th>Guest</th><th>Contact</th><th>Location</th><th>Status</th></tr></thead><tbody>{guests.map((guest) => <tr key={guest.id} onClick={() => openGuest(guest)} className={selected?.id === guest.id ? 'selected' : ''}><td><strong>{guest.full_name}</strong><small>{guest.passport_number || guest.national_id || 'No ID on file'}</small></td><td>{guest.email || '—'}<small>{guest.phone || '—'}</small></td><td>{[guest.city, guest.country].filter(Boolean).join(', ') || '—'}</td><td>{guest.vip_status ? <span className="vip"><Crown size={14}/>VIP</span> : <span className="standard">Standard</span>}</td></tr>)}</tbody></table>}<Pager meta={meta} load={load}/></section><GuestProfile guest={selected} onEdit={setEditing}/></div>{editing && <GuestForm guest={editing} onCancel={() => setEditing(null)} onSaved={saved}/>}</>;
}

// ─── Reservation components ───────────────────────────────────────────────────
function ReservationForm({ reservation, guests, rooms, onCancel, onSaved }) {
  const [form, setForm] = useState(reservation || emptyReservation);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectedRoom = rooms.find((room) => Number(room.id) === Number(form.room_id));
  const selectedRoomType = selectedRoom?.room_type;
  const nights = nightsBetween(form.check_in_date, form.check_out_date);
  const subtotal = Number(selectedRoomType?.base_price || 0) * nights;
  const total = subtotal + Number(form.taxes || 0) + Number(form.fees || 0);
  const balance = Math.max(total - Number(form.paid_amount || 0), 0);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  async function checkAvailability() {
    if (!form.check_in_date || !form.check_out_date) return;
    setChecking(true); setError('');
    try {
      const res = await roomsApi.availability({ check_in: form.check_in_date, check_out: form.check_out_date, adults: form.adults, children: form.children });
      setAvailableRooms(res.data.data);
    } catch (err) { setError(err.response?.data?.message || 'Unable to check availability.'); }
    finally { setChecking(false); }
  }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, guest_id: Number(form.guest_id), room_id: Number(form.room_id), room_type_id: Number(form.room_type_id || selectedRoom?.room_type_id), adults: Number(form.adults), children: Number(form.children || 0), taxes: Number(form.taxes || 0), fees: Number(form.fees || 0), paid_amount: Number(form.paid_amount || 0) };
      const response = form.id ? await reservationsApi.update(form.id, payload) : await reservationsApi.create(payload);
      onSaved(response.data.data);
    } catch (err) { setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {})?.[0]?.[0] || 'Unable to save reservation.'); }
    finally { setSaving(false); }
  }
  const roomOptions = availableRooms.length ? availableRooms : rooms;
  return <div className="modalBackdrop"><form className="guestForm modal" onSubmit={submit}><div className="modalHeader"><div><p className="eyebrow">Reservation workflow</p><h2>{form.id ? 'Edit reservation' : 'Create reservation'}</h2></div><button type="button" onClick={onCancel}><X size={22}/></button></div>{error && <div className="error">{error}</div>}<div className="grid two"><label>Guest<select required value={form.guest_id} onChange={(e) => update('guest_id', e.target.value)}><option value="">Select guest</option>{guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}</select></label><label>Source<input value={form.source} onChange={(e) => update('source', e.target.value)} placeholder="direct, walk_in, nobeds…" /></label></div><div className="grid four"><label>Check in<input required type="date" value={form.check_in_date} onChange={(e) => update('check_in_date', e.target.value)} /></label><label>Check out<input required type="date" value={form.check_out_date} onChange={(e) => update('check_out_date', e.target.value)} /></label><label>Adults<input required type="number" min="1" value={form.adults} onChange={(e) => update('adults', e.target.value)} /></label><label>Children<input type="number" min="0" value={form.children} onChange={(e) => update('children', e.target.value)} /></label></div><button type="button" className="ghost availability" onClick={checkAvailability}>{checking ? 'Checking…' : 'Check room availability'}</button><label>Room<select required value={form.room_id} onChange={(e) => { const room = rooms.find((item) => Number(item.id) === Number(e.target.value)); update('room_id', e.target.value); update('room_type_id', room?.room_type_id || ''); }}><option value="">Select available room</option>{roomOptions.map((room) => <option key={room.id} value={room.id}>Room {room.room_number} — {room.room_type?.name || 'Room type'} (${room.room_type?.base_price || 0}/night)</option>)}</select></label><div className="grid two"><label>Status<select value={form.status} onChange={(e) => update('status', e.target.value)}>{['pending','confirmed','checked_in','checked_out','cancelled','no_show'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Payment status<select value={form.payment_status} onChange={(e) => update('payment_status', e.target.value)}>{['unpaid','partially_paid','paid','refunded'].map((value) => <option key={value}>{value}</option>)}</select></label></div><div className="grid three"><label>Taxes<input type="number" min="0" step="0.01" value={form.taxes} onChange={(e) => update('taxes', e.target.value)} /></label><label>Fees<input type="number" min="0" step="0.01" value={form.fees} onChange={(e) => update('fees', e.target.value)} /></label><label>Paid amount<input type="number" min="0" step="0.01" value={form.paid_amount} onChange={(e) => update('paid_amount', e.target.value)} /></label></div><div className="summaryStrip"><div><span>Nights</span><strong>{nights}</strong></div><div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><div><span>Total</span><strong>${total.toFixed(2)}</strong></div><div><span>Balance</span><strong>${balance.toFixed(2)}</strong></div></div><label>Special requests<textarea value={form.special_requests || ''} onChange={(e) => update('special_requests', e.target.value)} /></label><label>Internal notes<textarea value={form.internal_notes || ''} onChange={(e) => update('internal_notes', e.target.value)} /></label><div className="grid two"><label>NoBeds / external reservation ID<input value={form.external_reservation_id || ''} onChange={(e) => update('external_reservation_id', e.target.value)} /></label><label>Channel manager reference<input value={form.channel_manager_reference || ''} onChange={(e) => update('channel_manager_reference', e.target.value)} /></label></div><div className="actions"><button type="button" className="ghost" onClick={onCancel}>Cancel</button><button disabled={saving}>{saving ? 'Saving…' : 'Save reservation'}</button></div></form></div>;
}

function ReservationProfile({ reservation, onEdit }) {
  if (!reservation) return <section className="profile empty"><CalendarCheck /><h3>Select a reservation</h3><p>Open a reservation to manage status, payments, front-desk notes, and NoBeds references.</p></section>;
  return <section className="profile"><div className="profileTop"><div className="avatar">{reservation.reservation_number?.slice(-2)}</div><div><p className="eyebrow">Reservation</p><h2>{reservation.reservation_number}</h2><p>{reservation.guest?.full_name || 'Guest'} · Room {reservation.room?.room_number || '—'}</p></div></div><div className="profileGrid"><div><span>Status</span><strong><Badge value={reservation.status}/></strong></div><div><span>Payment</span><strong><Badge value={reservation.payment_status} type="pay"/></strong></div><div><span>Dates</span><strong>{reservation.check_in_date} → {reservation.check_out_date}</strong></div><div><span>Total / Balance</span><strong>${reservation.total_amount} / ${reservation.balance_due}</strong></div></div><button className="wide" onClick={() => onEdit(reservation)}>Manage reservation</button><div className="history"><p className="eyebrow">Channel manager readiness</p><h3>NoBeds sync prepared</h3><p>External reservation ID and channel manager reference fields are stored for future NoBeds OTA import and calendar synchronization workflows.</p></div></section>;
}

function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', payment_status: '', source: '' });
  const [loading, setLoading] = useState(false);

  async function load(page = 1) {
    setLoading(true);
    try {
      const res = await reservationsApi.list({ ...filters, status: filters.status || undefined, payment_status: filters.payment_status || undefined, source: filters.source || undefined, page, per_page: 10 });
      setReservations(res.data.data); setMeta(res.data.meta || {});
    } catch (err) { console.error('Failed to load reservations:', err); }
    finally { setLoading(false); }
  }

  async function loadLookups() {
    try {
      const [guestRes, roomRes] = await Promise.all([guestsApi.list({ per_page: 100 }), roomsApi.list({ active: true })]);
      setGuests(guestRes.data.data || []); setRooms(roomRes.data.data || []);
    } catch (err) { console.error('Failed to load lookups:', err); }
  }

  useEffect(() => { load(1); }, [filters.search, filters.status, filters.payment_status, filters.source]);
  useEffect(() => { loadLookups(); }, []);

  async function openReservation(reservation) {
    try { const res = await reservationsApi.show(reservation.id); setSelected(res.data.data); }
    catch (err) { console.error('Failed to load reservation:', err); }
  }

  function saved(reservation) { setEditing(null); load(meta.current_page || 1); openReservation(reservation); }

  return <><header className="hero"><div><p className="eyebrow">Phase 3</p><h1>Reservation Management</h1><p>Create direct reservations, validate room availability, calculate totals, manage statuses, and prepare NoBeds OTA synchronization.</p></div><button onClick={() => setEditing(emptyReservation)}><Plus size={16}/>New reservation</button></header><section className="toolbar"><div className="search"><Search size={18}/><input placeholder="Search reservation, guest, phone, email, NoBeds reference…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}/></div><div className="filter reservationFilters"><Filter size={16}/><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{['pending','confirmed','checked_in','checked_out','cancelled','no_show'].map((value) => <option key={value}>{value}</option>)}</select><select value={filters.payment_status} onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}><option value="">All payments</option>{['unpaid','partially_paid','paid','refunded'].map((value) => <option key={value}>{value}</option>)}</select><input placeholder="Source" value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}/></div></section><div className="content"><section className="tableCard"><div className="tableHeader"><h2>Reservations</h2><span>{meta.total || 0} bookings</span></div>{loading ? <div className="loading">Loading reservations…</div> : <table><thead><tr><th>Reservation</th><th>Guest / Room</th><th>Dates</th><th>Status</th><th>Total</th></tr></thead><tbody>{reservations.map((reservation) => <tr key={reservation.id} onClick={() => openReservation(reservation)} className={selected?.id === reservation.id ? 'selected' : ''}><td><strong>{reservation.reservation_number}</strong><small>{reservation.source}</small></td><td>{reservation.guest?.full_name || '—'}<small>Room {reservation.room?.room_number || '—'}</small></td><td>{reservation.check_in_date} → {reservation.check_out_date}<small>{reservation.nights} nights</small></td><td><Badge value={reservation.status}/><small><Badge value={reservation.payment_status} type="pay"/></small></td><td><strong>${reservation.total_amount}</strong><small>Balance ${reservation.balance_due}</small></td></tr>)}</tbody></table>}<Pager meta={meta} load={load}/></section><ReservationProfile reservation={selected} onEdit={setEditing}/></div>{editing && <ReservationForm reservation={editing} guests={guests} rooms={rooms} onCancel={() => setEditing(null)} onSaved={saved}/>}</>;
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('auth_token')));
  const { path, navigate } = useDashboardRouter();

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const pages = {
    '/dashboard': <PlaceholderPage title="Dashboard" description="KPI, recent activity, occupancy, and revenue widgets share the same protected dashboard shell." actions={['Occupancy snapshot', 'Recent activity', 'Revenue overview']}/>,
    '/room-types': <PlaceholderPage title="Room Types" description="Manage inventory products, pricing, occupancy limits, amenities, and channel-manager mapping codes." actions={['Room type list', 'Create/edit rates', 'NoBeds mapping codes']}/>,
    '/rooms': <PlaceholderPage title="Rooms" description="Manage physical room inventory, operational status, and availability checks from the shared admin layout." actions={['Room list', 'Maintenance status', 'Availability endpoint']}/>,
    '/guests': <GuestsPage/>,
    '/reservations': <ReservationsPage/>,
    '/settings': <PlaceholderPage title="Settings" description="Maintain hotel profile, operating preferences, authentication context, and future NoBeds configuration." actions={['Hotel profile', 'Operational settings', 'Integration readiness']}/>,
  };

  return (
    <DashboardShell path={path} navigate={navigate} onLogout={() => setIsAuthenticated(false)}>
      {pages[path] || pages['/dashboard']}
    </DashboardShell>
  );
}

createRoot(document.getElementById('root')).render(<App />);
