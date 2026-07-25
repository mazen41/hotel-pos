'use client';

import type { ReactNode } from 'react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { ApiError, cashShiftsApi, tablesApi } from '@/lib/api';
import type { CashShift, Table } from '@/types';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  MinusCircle,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  X,
} from 'lucide-react';
import { formatCurrency, toMoneyNumber } from '@/lib/money';

interface OpenShiftForm {
  shift_name: string;
  shift_taker: string;
  opening_cash: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  sub,
  color = 'default',
  bold,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: 'default' | 'green' | 'red' | 'muted' | 'blue';
  bold?: boolean;
}) {
  const colorClass =
    color === 'green'
      ? 'text-success'
      : color === 'red'
        ? 'text-error'
        : color === 'blue'
          ? 'text-primary'
          : color === 'muted'
            ? 'text-text-muted'
            : 'text-text-primary';

  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-sm ${bold ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{label}</span>
      <div className="text-right">
        <span className={`text-sm font-medium ${colorClass} ${bold ? 'text-base font-bold' : ''}`}>{value}</span>
        {sub && <p className="text-xs text-text-muted">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 mb-1 text-xs font-semibold uppercase tracking-widest text-text-muted first:mt-0">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="my-2 border-t border-border" />;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CashShiftsPage() {
  const t = useTranslations();
  const { can, user } = usePermissions();
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [shiftHistory, setShiftHistory] = useState<CashShift[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingClose, setLoadingClose] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [openForm, setOpenForm] = useState<OpenShiftForm>({
    shift_name: 'Morning Shift',
    shift_taker: user?.name ?? '',
    opening_cash: '500',
  });
  const [countedCash, setCountedCash] = useState('0');
  const [closingNotes, setClosingNotes] = useState('');

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
    () =>
      tables.filter(
        (table) =>
          table.status === 'occupied' ||
          table.status === 'pending_payment' ||
          Boolean(table.activeOrder),
      ),
    [tables],
  );

  const summary = currentShift?.summary;

  // ── Derived values from live-calculated summary ───────────────────────────
  const expectedCash = summary
    ? toMoneyNumber(summary.expected_cash)
    : toMoneyNumber(currentShift?.expected_cash);

  const counted = toMoneyNumber(countedCash);
  const variance = counted - expectedCash;

  // ── Variance status ───────────────────────────────────────────────────────
  const varianceStatus: 'balanced' | 'over' | 'short' =
    Math.abs(variance) < 0.005 ? 'balanced' : variance > 0 ? 'over' : 'short';

  // ── Open shift ────────────────────────────────────────────────────────────
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

  // ── Open close dialog — fetch fresh summary first ─────────────────────────
  const openCloseDialog = async () => {
    if (!currentShift) return;
    setLoadingClose(true);
    setError(null);
    try {
      const freshRes = await cashShiftsApi.getCurrent();
      if (freshRes.data) {
        setCurrentShift(freshRes.data);
      }
    } catch {
      // non-fatal — dialog opens with whatever state we have
    } finally {
      setCountedCash('0');
      setClosingNotes('');
      setLoadingClose(false);
      setShowCloseDialog(true);
    }
  };

  // ── Close shift ───────────────────────────────────────────────────────────
  const closeShift = async () => {
    if (!currentShift) return;

    const latestTables = await tablesApi.list();
    const openTables = latestTables.data.filter(
      (table) =>
        table.status === 'occupied' ||
        table.status === 'pending_payment' ||
        Boolean(table.activeOrder),
    );
    setTables(latestTables.data);
    if (openTables.length > 0) {
      setError(
        'You cannot close this shift. Some tables still have active orders. Please close all tables before ending the shift.',
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { data } = await cashShiftsApi.close(currentShift.id, {
        counted_cash: counted,
        notes: closingNotes.trim() || undefined,
      });
      setCurrentShift(null);
      setShiftHistory((previous) => [
        data,
        ...previous.filter((shift) => shift.id !== currentShift.id),
      ]);
      setShowCloseDialog(false);
      setCountedCash('0');
      setClosingNotes('');
      setNotice('Shift closed successfully.');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to close shift.');
    } finally {
      setSaving(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!can('pos.manage_shifts')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-muted">{t('errors.noPermission')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-text-muted">{t('common.loading')}</div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
              {t('shifts.title')}
            </h1>
            <p className="text-text-muted">Manage cashier shifts and closing controls.</p>
          </div>
          {!currentShift && can('pos.manage_shifts') && (
            <button
              onClick={() => setShowOpenDialog(true)}
              className="rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-medium transition hover:bg-primary/90"
            >
              Open Shift
            </button>
          )}
        </div>

        {/* Notices */}
        {(error || notice) && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              error
                ? 'border-error/30 bg-error/10 text-error'
                : 'border-success/30 bg-success/10 text-success'
            }`}
          >
            {error ?? notice}
          </div>
        )}

        {/* Active Shift Card */}
        <div className="glass rounded-2xl p-4 sm:p-6">
          {currentShift ? (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                    <DollarSign className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-text-primary">
                      {currentShift.shift_name ?? currentShift.name ?? t('shifts.openShift')}
                    </h2>
                    <p className="text-sm text-text-muted">
                      {currentShift.shift_taker ?? currentShift.user?.name ?? 'Unknown'} •{' '}
                      {new Date(currentShift.opened_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {can('pos.manage_shifts') && (
                  <button
                    onClick={openCloseDialog}
                    disabled={loadingClose}
                    className="flex items-center gap-2 rounded-xl bg-error px-5 py-3 font-semibold text-white transition hover:bg-error/90 disabled:opacity-70"
                  >
                    {loadingClose ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading Summary…
                      </>
                    ) : (
                      t('shifts.closeShift')
                    )}
                  </button>
                )}
              </div>

              {blockingTables.length > 0 && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-text-primary">
                  <strong>Close shift blocked:</strong> {blockingTables.length} table(s) still have
                  active or unpaid orders.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t('shifts.openingCash')}
                  value={formatCurrency(currentShift.opening_cash)}
                />
                <Metric
                  icon={<TrendingUp className="h-4 w-4" />}
                  label={t('shifts.totalSales')}
                  value={formatCurrency(summary ? summary.total_sales : currentShift.total_sales)}
                  positive
                />
                <Metric
                  icon={<Clock className="h-4 w-4" />}
                  label={t('shifts.totalOrders')}
                  value={String(summary ? summary.total_orders : currentShift.total_orders)}
                />
                <Metric
                  icon={<AlertCircle className="h-4 w-4" />}
                  label="Expected Cash"
                  value={formatCurrency(expectedCash)}
                />
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover">
                <DollarSign className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="font-display text-xl font-bold text-text-primary">
                {t('shifts.noActiveShift')}
              </h3>
              <p className="mb-6 mt-2 text-text-muted">Open a shift before taking POS orders.</p>
              {can('pos.manage_shifts') && (
                <button
                  onClick={() => setShowOpenDialog(true)}
                  className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-medium transition hover:bg-primary/90"
                >
                  Open Shift
                </button>
              )}
            </div>
          )}
        </div>

        {/* Shift History */}
        <div className="glass rounded-2xl p-4 sm:p-6">
          <h2 className="mb-4 font-display text-xl font-bold text-text-primary">
            {t('shifts.shiftHistory')}
          </h2>
          <div className="grid gap-3">
            {shiftHistory.length === 0 && (
              <p className="py-6 text-center text-sm text-text-muted">No shift history yet.</p>
            )}
            {shiftHistory.map((shift) => (
              <div
                key={shift.id}
                className="flex flex-col justify-between gap-3 rounded-xl bg-surface-elevated p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold text-text-primary">
                    {shift.shift_name ?? shift.name ?? new Date(shift.opened_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-text-muted">
                    {shift.shift_taker ?? shift.user?.name ?? 'Unknown'} • {shift.status}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-display font-bold text-text-primary">
                    {formatCurrency(shift.total_sales)}
                  </p>
                  <p className="text-sm text-text-muted">{shift.total_orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Open Shift Dialog ──────────────────────────────────────────────── */}
      {showOpenDialog && (
        <Dialog title="Open Shift" onClose={() => setShowOpenDialog(false)}>
          <form onSubmit={openShift} className="space-y-4">
            <Field label="Shift Name">
              <input
                value={openForm.shift_name}
                onChange={(e) => setOpenForm({ ...openForm, shift_name: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none transition focus:border-text-accent"
                placeholder="Morning Shift"
              />
            </Field>
            <Field label="Shift Taker Name">
              <input
                required
                value={openForm.shift_taker}
                onChange={(e) => setOpenForm({ ...openForm, shift_taker: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none transition focus:border-text-accent"
                placeholder="Ahmed Mohamed"
              />
            </Field>
            <Field label="Opening Cash (EGP)">
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={openForm.opening_cash}
                onChange={(e) => setOpenForm({ ...openForm, opening_cash: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none transition focus:border-text-accent"
                placeholder="500.00"
              />
            </Field>
            <button
              disabled={saving}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Opening…' : 'Open Shift'}
            </button>
          </form>
        </Dialog>
      )}

      {/* ── Close Shift Dialog — Full Reconciliation Screen ───────────────── */}
      {showCloseDialog && (
        <Dialog
          title="Close Shift — Cash Reconciliation"
          onClose={() => setShowCloseDialog(false)}
          wide
        >
          <div className="space-y-0 max-h-[78vh] overflow-y-auto pr-1">

            {/* ── Sales Summary ─────────────────────────────────────────────── */}
            <SectionTitle>Sales Summary</SectionTitle>
            <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3 space-y-0.5">
              <SummaryRow
                label="Total Orders"
                value={`${summary?.total_orders ?? 0} orders`}
                color="default"
              />
              <Divider />
              <SummaryRow
                label="Gross Sales (before tax & service)"
                value={formatCurrency(summary?.gross_sales ?? 0)}
                color="default"
              />
              <SummaryRow
                label="Tax Amount"
                value={`+${formatCurrency(summary?.total_tax ?? 0)}`}
                color="muted"
              />
              <SummaryRow
                label="Service Charge"
                value={`+${formatCurrency(summary?.total_service_charge ?? 0)}`}
                color="muted"
              />
              <SummaryRow
                label="Discounts"
                value={`-${formatCurrency(summary?.total_discounts ?? 0)}`}
                color="red"
              />
              <Divider />
              <SummaryRow
                label="Net Sales Total"
                value={formatCurrency(summary?.total_sales ?? 0)}
                bold
                color="default"
              />
            </div>

            {/* ── Payment Breakdown ─────────────────────────────────────────── */}
            <SectionTitle>Payment Methods</SectionTitle>
            <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3 space-y-0.5">
              <SummaryRow
                label="Cash Sales"
                value={formatCurrency(summary?.cash_sales ?? 0)}
                color="green"
              />
              <SummaryRow
                label="Card / Visa Sales"
                value={formatCurrency(summary?.card_sales ?? 0)}
                color="blue"
              />
              {/* Render any other payment methods from the breakdown */}
              {summary?.payment_breakdown &&
                Object.entries(summary.payment_breakdown)
                  .filter(([key]) => key !== 'cash' && key !== 'visa/card')
                  .map(([key, value]) => (
                    <SummaryRow
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      value={formatCurrency(value)}
                      color="default"
                    />
                  ))}
            </div>

            {/* ── Refunds ───────────────────────────────────────────────────── */}
            <SectionTitle>Refunds</SectionTitle>
            <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3 space-y-0.5">
              <SummaryRow
                label="Total Refunds Issued"
                value={`-${formatCurrency(summary?.total_refunds ?? 0)}`}
                color="red"
              />
              <SummaryRow
                label="of which Cash Refunds"
                value={`-${formatCurrency(summary?.cash_refunds ?? 0)}`}
                color="red"
                sub="reduces cash in drawer"
              />
            </div>

            {/* ── Voided / Cancelled Orders ─────────────────────────────────── */}
            <SectionTitle>Voided / Cancelled Orders</SectionTitle>
            <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3 space-y-0.5">
              <SummaryRow
                label="Voided Orders Count"
                value={`${summary?.deleted_orders_count ?? 0} orders`}
                color="muted"
              />
              <SummaryRow
                label="Voided Orders Total Value"
                value={formatCurrency(summary?.deleted_orders_total ?? 0)}
                color="muted"
              />
              <SummaryRow
                label="Cash Collected for Voids"
                value={`-${formatCurrency(summary?.cash_voids ?? 0)}`}
                color="red"
                sub="cash returned to customer"
              />
            </div>

            {/* ── Cash Reconciliation Formula ───────────────────────────────── */}
            <SectionTitle>Cash Drawer Calculation</SectionTitle>
            <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3 space-y-0.5">
              <SummaryRow
                label="Opening Cash"
                value={formatCurrency(summary?.opening_cash ?? currentShift?.opening_cash ?? 0)}
                color="default"
              />
              <SummaryRow
                label="+ Cash Sales"
                value={`+${formatCurrency(summary?.cash_sales ?? 0)}`}
                color="green"
              />
              <SummaryRow
                label="− Cash Refunds"
                value={`-${formatCurrency(summary?.cash_refunds ?? 0)}`}
                color="red"
              />
              <SummaryRow
                label="− Cash Voids"
                value={`-${formatCurrency(summary?.cash_voids ?? 0)}`}
                color="red"
              />
              <Divider />
              <SummaryRow
                label="Expected Cash in Drawer"
                value={formatCurrency(expectedCash)}
                bold
                color="default"
              />
            </div>

            {/* ── Refresh button ────────────────────────────────────────────── */}
            <div className="flex justify-end pt-1 pb-2">
              <button
                onClick={openCloseDialog}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover hover:text-text-primary transition"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh Summary
              </button>
            </div>

            {/* ── Counted Cash Input ────────────────────────────────────────── */}
            <Field label="Counted Cash (EGP) — physically count the drawer">
              <input
                type="number"
                min="0"
                step="0.01"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none transition focus:border-primary text-lg font-semibold"
                placeholder="0.00"
                autoFocus
              />
            </Field>

            {/* ── Variance Display ──────────────────────────────────────────── */}
            <div
              className={`rounded-xl border p-4 transition-all ${
                varianceStatus === 'balanced'
                  ? 'border-success/40 bg-success/10'
                  : varianceStatus === 'over'
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-error/40 bg-error/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {varianceStatus === 'balanced' && (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                  {varianceStatus === 'over' && (
                    <ArrowUpCircle className="h-5 w-5 text-primary" />
                  )}
                  {varianceStatus === 'short' && (
                    <ArrowDownCircle className="h-5 w-5 text-error" />
                  )}
                  <span
                    className={`font-bold text-lg ${
                      varianceStatus === 'balanced'
                        ? 'text-success'
                        : varianceStatus === 'over'
                          ? 'text-primary'
                          : 'text-error'
                    }`}
                  >
                    {varianceStatus === 'balanced' && 'BALANCED'}
                    {varianceStatus === 'over' && `OVER: +${formatCurrency(Math.abs(variance))}`}
                    {varianceStatus === 'short' && `SHORT: -${formatCurrency(Math.abs(variance))}`}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Expected</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {formatCurrency(expectedCash)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Closing Notes ─────────────────────────────────────────────── */}
            <Field label="Closing Notes (optional)">
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none transition focus:border-primary min-h-20 resize-none"
                placeholder="Any notes about this shift…"
              />
            </Field>

            {/* ── Submit ────────────────────────────────────────────────────── */}
            <button
              onClick={closeShift}
              disabled={saving || blockingTables.length > 0}
              className="w-full rounded-xl bg-error py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 transition hover:bg-error/90 text-base"
            >
              {saving ? 'Closing Shift…' : 'Confirm & Close Shift'}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Metric({
  icon,
  label,
  value,
  positive,
  warning,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  positive?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-elevated p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-text-secondary">
        {icon}
        <span>{label}</span>
      </div>
      <p
        className={`font-display text-2xl font-bold ${
          warning ? 'text-error' : positive ? 'text-success' : 'text-text-primary'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Dialog({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={`w-full rounded-2xl bg-surface p-6 shadow-2xl ${wide ? 'max-w-lg' : 'max-w-md'}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-surface-hover">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  );
}
