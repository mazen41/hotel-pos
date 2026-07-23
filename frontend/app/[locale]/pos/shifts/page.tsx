'use client';

import type { ReactNode } from 'react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { ApiError, cashShiftsApi, tablesApi } from '@/lib/api';
import type { CashShift, Table } from '@/types';
import { AlertCircle, Clock, DollarSign, TrendingUp, X } from 'lucide-react';
import { formatCurrency, toMoneyNumber } from '@/lib/money';

interface OpenShiftForm {
  shift_name: string;
  shift_taker: string;
  opening_cash: string;
}

export default function CashShiftsPage() {
  const t = useTranslations();
  const { can, user } = usePermissions();
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [shiftHistory, setShiftHistory] = useState<CashShift[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [openForm, setOpenForm] = useState<OpenShiftForm>({
    shift_name: 'Morning Shift',
    shift_taker: user?.name ?? '',
    opening_cash: '500',
  });
  const [closingData, setClosingData] = useState({ counted_cash: '0', notes: '' });

  const loadShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentRes, historyRes, tableRes] = await Promise.all([
        cashShiftsApi.getCurrent(),
        cashShiftsApi.list(),
        tablesApi.list(),
      ]);
      setCurrentShift(currentRes.data);
      setShiftHistory(historyRes.data);
      setTables(tableRes.data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to load shifts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const blockingTables = useMemo(
    () => tables.filter((table) => table.status === 'occupied' || table.status === 'pending_payment' || Boolean(table.activeOrder)),
    [tables],
  );
  const variance = toMoneyNumber(closingData.counted_cash) - toMoneyNumber(currentShift?.expected_cash);

  const openShift = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const openingCash = toMoneyNumber(openForm.opening_cash);
    const shiftTaker = openForm.shift_taker.trim();
    if (!shiftTaker) {
      setError('Shift taker name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { data } = await cashShiftsApi.open({
        opening_cash: openingCash,
        name: openForm.shift_name.trim(),
        shift_name: openForm.shift_name.trim(),
        shift_taker: shiftTaker,
      });
      setCurrentShift(data);
      setShiftHistory((previous) => [data, ...previous.filter((shift) => shift.id !== data.id)]);
      setShowOpenDialog(false);
      setNotice('Shift opened successfully.');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to open shift.');
    } finally {
      setSaving(false);
    }
  };

  const closeShift = async () => {
    if (!currentShift) return;
    const latestTables = await tablesApi.list();
    const openTables = latestTables.data.filter((table) => table.status === 'occupied' || table.status === 'pending_payment' || Boolean(table.activeOrder));
    setTables(latestTables.data);
    if (openTables.length > 0) {
      setError('You cannot close this shift. Some tables still have active orders. Please close all tables before ending the shift.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { data } = await cashShiftsApi.close(currentShift.id, {
        counted_cash: toMoneyNumber(closingData.counted_cash),
        closing_notes: closingData.notes.trim() || undefined,
      });
      setCurrentShift(null);
      setShiftHistory((previous) => [data, ...previous.filter((shift) => shift.id !== currentShift.id)]);
      setShowCloseDialog(false);
      setClosingData({ counted_cash: '0', notes: '' });
      setNotice('Shift closed successfully.');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to close shift.');
    } finally {
      setSaving(false);
    }
  };

  if (!can('pos.manage_shifts')) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-text-muted">{t('errors.noPermission')}</p></div>;
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="text-text-muted">{t('common.loading')}</div></div>;
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">{t('shifts.title')}</h1>
            <p className="text-text-muted">Manage cashier shifts and closing controls.</p>
          </div>
          {!currentShift && can('pos.open_shift') && (
            <button onClick={() => setShowOpenDialog(true)} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-medium transition hover:bg-primary/90">Open Shift</button>
          )}
        </div>

        {(error || notice) && (
          <div className={`rounded-xl border p-4 text-sm ${error ? 'border-error/30 bg-error/10 text-error' : 'border-success/30 bg-success/10 text-success'}`}>{error ?? notice}</div>
        )}

        <div className="glass rounded-2xl p-4 sm:p-6">
          {currentShift ? (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"><DollarSign className="h-6 w-6 text-success" /></div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-text-primary">{currentShift.shift_name ?? currentShift.name ?? t('shifts.openShift')}</h2>
                    <p className="text-sm text-text-muted">{currentShift.shift_taker ?? currentShift.user?.name ?? 'Unknown'} • {new Date(currentShift.opened_at).toLocaleString()}</p>
                  </div>
                </div>
                {can('pos.close_shift') && (
                  <button onClick={() => setShowCloseDialog(true)} className="rounded-xl bg-error px-5 py-3 font-semibold text-white transition hover:bg-error/90">{t('shifts.closeShift')}</button>
                )}
              </div>

              {blockingTables.length > 0 && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-text-primary">
                  <strong>Close shift blocked:</strong> {blockingTables.length} table(s) still have active or unpaid orders.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric icon={<DollarSign className="h-4 w-4" />} label={t('shifts.openingCash')} value={formatCurrency(currentShift.opening_cash)} />
                <Metric icon={<TrendingUp className="h-4 w-4" />} label={t('shifts.totalSales')} value={formatCurrency(currentShift.total_sales)} positive />
                <Metric icon={<Clock className="h-4 w-4" />} label={t('shifts.totalOrders')} value={String(currentShift.total_orders)} />
                <Metric icon={<AlertCircle className="h-4 w-4" />} label={t('shifts.variance')} value={formatCurrency(variance)} warning={Math.abs(variance) > 1} />
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover"><DollarSign className="h-8 w-8 text-text-muted" /></div>
              <h3 className="font-display text-xl font-bold text-text-primary">{t('shifts.noActiveShift')}</h3>
              <p className="mb-6 mt-2 text-text-muted">Open a shift before taking POS orders.</p>
              {can('pos.open_shift') && <button onClick={() => setShowOpenDialog(true)} className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-medium transition hover:bg-primary/90">Open Shift</button>}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-4 sm:p-6">
          <h2 className="mb-4 font-display text-xl font-bold text-text-primary">{t('shifts.shiftHistory')}</h2>
          <div className="grid gap-3">
            {shiftHistory.map((shift) => (
              <div key={shift.id} className="flex flex-col justify-between gap-3 rounded-xl bg-surface-elevated p-4 sm:flex-row sm:items-center">
                <div><p className="font-semibold text-text-primary">{shift.shift_name ?? shift.name ?? new Date(shift.opened_at).toLocaleString()}</p><p className="text-sm text-text-muted">{shift.shift_taker ?? shift.user?.name ?? 'Unknown'} • {shift.status}</p></div>
                <div className="text-left sm:text-right"><p className="font-display font-bold text-text-primary">{formatCurrency(shift.total_sales)}</p><p className="text-sm text-text-muted">{shift.total_orders} orders</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showOpenDialog && (
        <Dialog title="Open Shift" onClose={() => setShowOpenDialog(false)}>
          <form onSubmit={openShift} className="space-y-4">
            <Field label="Shift Name"><input value={openForm.shift_name} onChange={(e) => setOpenForm({ ...openForm, shift_name: e.target.value })} className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none transition focus:border-text-accent" placeholder="Morning Shift" /></Field>
            <Field label="Shift Taker Name"><input required value={openForm.shift_taker} onChange={(e) => setOpenForm({ ...openForm, shift_taker: e.target.value })} className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none transition focus:border-text-accent" placeholder="Ahmed Mohamed" /></Field>
            <Field label="Opening Cash"><input required type="number" min="0" step="0.01" value={openForm.opening_cash} onChange={(e) => setOpenForm({ ...openForm, opening_cash: e.target.value })} className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none transition focus:border-text-accent" placeholder="500 EGP" /></Field>
            <button disabled={saving} className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60">{saving ? 'Opening...' : 'Open Shift'}</button>
          </form>
        </Dialog>
      )}

      {showCloseDialog && (
        <Dialog title={t('shifts.closeShift')} onClose={() => setShowCloseDialog(false)}>
          <div className="space-y-4">
            <Field label={t('shifts.countedCash')}><input type="number" min="0" step="0.01" value={closingData.counted_cash} onChange={(e) => setClosingData({ ...closingData, counted_cash: e.target.value })} className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none transition focus:border-text-accent" /></Field>
            <Field label={t('shifts.closingNotes')}><textarea value={closingData.notes} onChange={(e) => setClosingData({ ...closingData, notes: e.target.value })} className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none transition focus:border-text-accent min-h-24 resize-none" /></Field>
            <div className="rounded-lg bg-surface-elevated p-4"><div className="flex justify-between"><span className="text-text-secondary">{t('shifts.variance')}</span><span className={`font-bold ${Math.abs(variance) > 1 ? 'text-error' : 'text-success'}`}>{formatCurrency(variance)}</span></div></div>
            <button onClick={closeShift} disabled={saving || blockingTables.length > 0} className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Closing...' : t('shifts.closeShift')}</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Metric({ icon, label, value, positive, warning }: { icon: ReactNode; label: string; value: string; positive?: boolean; warning?: boolean }) {
  return <div className="rounded-xl bg-surface-elevated p-4"><div className="mb-2 flex items-center gap-2 text-sm text-text-secondary">{icon}<span>{label}</span></div><p className={`font-display text-2xl font-bold ${warning ? 'text-error' : positive ? 'text-success' : 'text-text-primary'}`}>{value}</p></div>;
}

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h3 className="font-display text-xl font-bold text-text-primary">{title}</h3><button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-surface-hover"><X className="h-5 w-5" /></button></div>{children}</div></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-text-secondary">{label}</span>{children}</label>;
}
