'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { cashShiftsApi } from '@/lib/api';
import type { CashShift } from '@/types';
import { DollarSign, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export default function CashShiftsPage() {
  const t = useTranslations();
  const { can } = usePermissions();
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [shiftHistory, setShiftHistory] = useState<CashShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingData, setClosingData] = useState({
    counted_cash: 0,
    notes: ''
  });

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const [currentRes, historyRes] = await Promise.all([
        cashShiftsApi.getCurrent(),
        cashShiftsApi.list()
      ]);
      
      setCurrentShift(currentRes.data);
      setShiftHistory(historyRes.data);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openShift = async () => {
    try {
      const { data } = await cashShiftsApi.open({ opening_cash: 0 });
      setCurrentShift(data);
      setShiftHistory([data, ...shiftHistory]);
    } catch (error) {
      console.error('Failed to open shift:', error);
    }
  };

  const closeShift = async () => {
    if (!currentShift) return;

    try {
      const { data } = await cashShiftsApi.close(currentShift.id, closingData);
      setCurrentShift(null);
      setShiftHistory([data, ...shiftHistory.filter(s => s.id !== currentShift.id)]);
      setShowCloseDialog(false);
      setClosingData({ counted_cash: 0, notes: '' });
    } catch (error) {
      console.error('Failed to close shift:', error);
    }
  };

  if (!can('pos.manage_shifts')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">{t('errors.noPermission')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-muted">{t('common.loading')}</div>
      </div>
    );
  }

  const variance = currentShift ? (closingData.counted_cash - currentShift.expected_cash) : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
            {t('shifts.title')}
          </h1>
          <p className="text-text-muted">
            {t('shifts.currentShift')}
          </p>
        </div>

        {/* Current Shift Card */}
        <div className="glass rounded-2xl p-6 mb-8">
          {currentShift ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-success bg-opacity-10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-text-primary">
                      {t('shifts.openShift')}
                    </h2>
                    <p className="text-sm text-text-muted">
                      {new Date(currentShift.opened_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCloseDialog(true)}
                  className="px-6 py-3 rounded-lg bg-error text-white font-medium hover:bg-error-600 transition-colors"
                >
                  {t('shifts.closeShift')}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-elevated rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">{t('shifts.openingCash')}</span>
                  </div>
                  <p className="font-display text-2xl font-bold text-text-primary">
                    ${currentShift.opening_cash.toFixed(2)}
                  </p>
                </div>

                <div className="bg-surface-elevated rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">{t('shifts.totalSales')}</span>
                  </div>
                  <p className="font-display text-2xl font-bold text-success">
                    ${currentShift.total_sales.toFixed(2)}
                  </p>
                </div>

                <div className="bg-surface-elevated rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">{t('shifts.totalOrders')}</span>
                  </div>
                  <p className="font-display text-2xl font-bold text-text-primary">
                    {currentShift.total_orders}
                  </p>
                </div>

                <div className="bg-surface-elevated rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">{t('shifts.variance')}</span>
                  </div>
                  <p className={`font-display text-2xl font-bold ${Math.abs(variance) > 1 ? 'text-error' : 'text-success'}`}>
                    ${variance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="font-display text-xl font-bold text-text-primary mb-2">
                {t('shifts.noActiveShift')}
              </h3>
              <p className="text-text-muted mb-6">
                Start your shift to begin taking orders
              </p>
              <button
                onClick={openShift}
                className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors"
              >
                {t('shifts.openShift')}
              </button>
            </div>
          )}
        </div>

        {/* Shift History */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl font-bold text-text-primary mb-4">
            {t('shifts.shiftHistory')}
          </h2>
          
          <div className="space-y-3">
            {shiftHistory.map((shift) => (
              <div
                key={shift.id}
                className="bg-surface-elevated rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    shift.status === 'open' ? 'bg-success bg-opacity-10' : 'bg-surface-hover'
                  }`}>
                    <DollarSign className={`w-5 h-5 ${
                      shift.status === 'open' ? 'text-success' : 'text-text-muted'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      {new Date(shift.opened_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-text-muted">
                      {shift.user?.name || 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-display font-bold text-text-primary">
                    ${shift.total_sales.toFixed(2)}
                  </p>
                  <p className="text-sm text-text-muted">
                    {shift.total_orders} {t('shifts.totalOrders')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Close Shift Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">
              {t('shifts.closeShift')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('shifts.countedCash')}
                </label>
                <input
                  type="number"
                  value={closingData.counted_cash}
                  onChange={(e) => setClosingData({ ...closingData, counted_cash: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('shifts.closingNotes')}
                </label>
                <textarea
                  value={closingData.notes}
                  onChange={(e) => setClosingData({ ...closingData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent resize-none"
                  rows={3}
                  placeholder={t('common.notes')}
                />
              </div>

              <div className="bg-surface-elevated rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">{t('shifts.variance')}</span>
                  <span className={`font-display font-bold ${Math.abs(variance) > 1 ? 'text-error' : 'text-success'}`}>
                    ${variance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCloseDialog(false)}
                className="flex-1 py-3 rounded-lg bg-surface text-text-secondary hover:bg-surface-hover transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={closeShift}
                className="flex-1 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors"
              >
                {t('shifts.closeShift')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}