'use client';

import type { ReactNode } from 'react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { ApiError, tablesApi } from '@/lib/api';
import type { Table } from '@/types';
import { Edit3, Plus, RefreshCw, Trash2, X } from 'lucide-react';

type TableStatus = 'available' | 'occupied' | 'reserved' | 'disabled';
interface TableForm { id?: number; name: string; number: string; capacity: string; status: TableStatus; }
const emptyForm: TableForm = { name: '', number: '', capacity: '2', status: 'available' };
const statuses: TableStatus[] = ['available', 'occupied', 'reserved', 'disabled'];

export default function TablesPage() {
  const locale = useLocale();
  const { can } = usePermissions();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TableForm | null>(null);
  const [deleteTable, setDeleteTable] = useState<Table | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRtl = locale.startsWith('ar');

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tablesApi.list();
      setTables(response.data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load tables.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (can('pos.manage_tables') || can('pos.view')) loadTables(); }, [can, loadTables]);

  const stats = useMemo(() => statuses.map((status) => ({ status, count: tables.filter((table) => table.status === status).length })), [tables]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;
    const capacity = Number.parseInt(form.capacity, 10);
    if (!form.number.trim() || !Number.isInteger(capacity) || capacity < 1) {
      setError('Table number and a valid capacity are required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = { number: form.number.trim(), name: form.name.trim() || undefined, capacity, status: form.status };
      if (form.id) await tablesApi.update(form.id, payload);
      else await tablesApi.create(payload);
      setNotice(form.id ? 'Table updated successfully.' : 'Table added successfully.');
      setForm(null);
      await loadTables();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not save table.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTable) return;
    setSaving(true);
    try {
      await tablesApi.delete(deleteTable.id);
      setNotice('Table deleted successfully.');
      setDeleteTable(null);
      await loadTables();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not delete table.');
    } finally {
      setSaving(false);
    }
  };

  if (!can('pos.manage_tables') && !can('pos.view')) return <div className="flex min-h-screen items-center justify-center text-text-muted">You do not have permission to manage tables.</div>;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Tables</h1><p className="text-text-muted">Manage dining room tables and availability.</p></div><div className="flex gap-2">{can('pos.manage_tables') && <button onClick={() => setForm(emptyForm)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-medium hover:bg-primary/90"><Plus className="h-4 w-4" />Add Table</button>}<button onClick={loadTables} className="rounded-xl border border-border px-4 py-3 text-text-secondary hover:bg-surface-hover"><RefreshCw className="h-4 w-4" /></button></div></div>
        {(notice || error) && <div className={`rounded-xl border p-4 text-sm ${error ? 'border-error/30 bg-error/10 text-error' : 'border-success/30 bg-success/10 text-success'}`}>{error ?? notice}</div>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map((item) => <div key={item.status} className="rounded-2xl border border-border bg-surface p-4 shadow-sm"><p className="text-sm capitalize text-text-muted">{item.status}</p><p className="mt-1 text-3xl font-bold text-text-primary">{item.count}</p></div>)}</div>
        {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-surface" />)}</div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tables.map((table) => <article key={table.id} className="rounded-2xl border border-border bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-medium"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-text-muted">Table #{table.number}</p><h2 className="mt-1 text-xl font-bold text-text-primary">{table.name || `Table ${table.number}`}</h2></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">{table.status.replace('_', ' ')}</span></div><p className="mt-4 text-text-secondary">Capacity: <strong>{table.capacity}</strong></p>{can('pos.manage_tables') && <div className="mt-5 flex gap-2"><button onClick={() => setForm({ id: table.id, name: table.name ?? '', number: table.number, capacity: String(table.capacity), status: (statuses.includes(table.status as TableStatus) ? table.status : 'available') as TableStatus })} className="action flex-1 justify-center"><Edit3 className="h-4 w-4" />Edit</button><button onClick={() => setDeleteTable(table)} className="action-danger flex-1 justify-center"><Trash2 className="h-4 w-4" />Delete</button></div>}</article>)}</div>}
      </div>
      {form && <Modal title={form.id ? 'Edit Table' : 'Add Table'} onClose={() => setForm(null)}><form onSubmit={submit} className="space-y-4"><Field label="Name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field" placeholder="Patio 1" /></Field><Field label="Number"><input required value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} className="field" /></Field><Field label="Capacity"><input required type="number" min="1" step="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} className="field" /></Field><Field label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TableStatus })} className="field">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field><button disabled={saving} className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save Table'}</button></form></Modal>}
      {deleteTable && <Modal title="Delete Table" onClose={() => setDeleteTable(null)}><p className="text-text-secondary">Delete {deleteTable.name || `Table ${deleteTable.number}`}?</p><div className="mt-6 flex gap-3"><button onClick={() => setDeleteTable(null)} className="btn-secondary">Cancel</button><button onClick={remove} disabled={saving} className="btn-danger">Delete</button></div></Modal>}
    </div>
  );
}
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-text-primary">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-surface-hover"><X className="h-5 w-5" /></button></div>{children}</div></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-medium text-text-secondary">{label}</span>{children}</label>; }
