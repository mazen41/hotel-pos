'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { posReportsApi as reportsApi } from '@/lib/api';
import { TrendingUp, DollarSign, ShoppingCart, Users, Download, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const t = useTranslations();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    taxCollected: 0,
    serviceChargeCollected: 0,
    discountsGiven: 0,
    refundsProcessed: 0,
    netRevenue: 0,
    revenueByCategory: [] as Array<{ category: string; amount: number }>,
    bestSellers: [] as Array<{ name: string; quantity: number; revenue: number }>,
    cashierPerformance: [] as Array<{ cashier: string; orders: number; revenue: number }>
  });

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    try {
      const [salesRes, categoryRes, bestSellersRes, cashierRes] = await Promise.all([
        reportsApi.sales({ dateRange }),
        reportsApi.revenueByCategory({ dateRange }),
        reportsApi.bestSellers({ dateRange }),
        reportsApi.cashierPerformance({ dateRange })
      ]);

      setReportData({
        totalSales: salesRes.data.totalSales || 0,
        totalOrders: salesRes.data.totalOrders || 0,
        averageOrderValue: salesRes.data.averageOrderValue || 0,
        taxCollected: salesRes.data.taxCollected || 0,
        serviceChargeCollected: salesRes.data.serviceChargeCollected || 0,
        discountsGiven: salesRes.data.discountsGiven || 0,
        refundsProcessed: salesRes.data.refundsProcessed || 0,
        netRevenue: salesRes.data.netRevenue || 0,
        revenueByCategory: (categoryRes.data || []).map(item => ({ category: item.category, amount: item.revenue })),
        bestSellers: bestSellersRes.data || [],
        cashierPerformance: cashierRes.data || []
      });
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      await reportsApi.export({ dateRange });
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  if (!can('pos.view_reports')) {
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-3xl font-bold text-text-primary">
              {t('reports.posTitle')}
            </h1>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('reports.export')}
            </button>
          </div>
          <p className="text-text-muted">
            Financial performance and sales analytics
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2 mb-6">
          {(['daily', 'weekly', 'monthly'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === range
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {t(`reports.${range}`)}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-success bg-opacity-10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t('reports.totalSales')}</p>
                <p className="font-display text-2xl font-bold text-success">
                  ${reportData.totalSales.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <TrendingUp className="w-4 h-4" />
              <span>+12.5% from last period</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t('reports.totalOrders')}</p>
                <p className="font-display text-2xl font-bold text-text-primary">
                  {reportData.totalOrders}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <TrendingUp className="w-4 h-4" />
              <span>+8.2% from last period</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-text-accent bg-opacity-10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-text-accent" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t('reports.averageOrderValue')}</p>
                <p className="font-display text-2xl font-bold text-text-accent">
                  ${reportData.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <TrendingUp className="w-4 h-4" />
              <span>+4.1% from last period</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-error bg-opacity-10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-error" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t('reports.netRevenue')}</p>
                <p className="font-display text-2xl font-bold text-error">
                  ${reportData.netRevenue.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <TrendingUp className="w-4 h-4" />
              <span>+15.3% from last period</span>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-text-primary">
                {t('reports.taxCollected')}
              </h3>
              <Calendar className="w-5 h-5 text-text-muted" />
            </div>
            <p className="font-display text-3xl font-bold text-text-primary">
              ${reportData.taxCollected.toFixed(2)}
            </p>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-text-primary">
                {t('reports.serviceChargeCollected')}
              </h3>
              <DollarSign className="w-5 h-5 text-text-muted" />
            </div>
            <p className="font-display text-3xl font-bold text-text-primary">
              ${reportData.serviceChargeCollected.toFixed(2)}
            </p>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-text-primary">
                {t('reports.discountsGiven')}
              </h3>
              <TrendingUp className="w-5 h-5 text-text-muted" />
            </div>
            <p className="font-display text-3xl font-bold text-warning">
              ${reportData.discountsGiven.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Category */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">
              {t('reports.revenueByCategory')}
            </h3>
            
            <div className="space-y-4">
              {reportData.revenueByCategory.map((item, index) => {
                const maxAmount = Math.max(...reportData.revenueByCategory.map(i => i.amount));
                const percentage = (item.amount / maxAmount) * 100;
                
                return (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-text-primary font-medium">{item.category}</span>
                      <span className="text-text-accent font-display font-bold">
                        ${item.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best Sellers */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">
              {t('reports.bestSellers')}
            </h3>
            
            <div className="space-y-3">
              {reportData.bestSellers.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-surface-elevated rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{item.name}</p>
                      <p className="text-sm text-text-muted">{item.quantity} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-text-accent">
                      ${item.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cashier Performance */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-bold text-text-primary mb-4">
            {t('reports.cashierPerformance')}
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Cashier
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Orders
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Revenue
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Avg. Order Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.cashierPerformance.map((cashier, index) => (
                  <tr key={index} className="border-b border-border hover:bg-surface-hover">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center">
                          <Users className="w-4 h-4 text-text-muted" />
                        </div>
                        <span className="font-medium text-text-primary">{cashier.cashier}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-primary">{cashier.orders}</td>
                    <td className="py-3 px-4 text-text-accent font-display font-bold">
                      ${cashier.revenue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      ${(cashier.revenue / cashier.orders).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}