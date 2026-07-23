'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Users, Clock, DollarSign, Armchair } from 'lucide-react';
import type { Table } from '@/types';

interface TableGridProps {
  tables: Table[];
  loading: boolean;
  error: string | null;
  onTableSelect: (table: Table) => void;
}

function formatMoney(value: number | string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
}

function getStatusColor(status: Table['status']) {
  switch (status) {
    case 'available':
      return 'bg-success/10 border-success/30 text-success hover:bg-success/20';
    case 'occupied':
      return 'bg-warning/10 border-warning/30 text-warning hover:bg-warning/20';
    case 'pending_payment':
      return 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20';
    case 'reserved':
      return 'bg-info/10 border-info/30 text-info hover:bg-info/20';
    case 'needs_cleaning':
      return 'bg-text-muted/10 border-text-muted/30 text-text-muted hover:bg-text-muted/20';
    default:
      return 'bg-surface border-border text-text-primary hover:bg-surface-hover';
  }
}

function getStatusLabel(status: Table['status']) {
  switch (status) {
    case 'available':
      return 'Available';
    case 'occupied':
      return 'Occupied';
    case 'pending_payment':
      return 'Pending Payment';
    case 'reserved':
      return 'Reserved';
    case 'needs_cleaning':
      return 'Needs Cleaning';
    default:
      return status;
  }
}

export const TableGrid = memo(function TableGrid({
  tables,
  loading,
  error,
  onTableSelect,
}: TableGridProps) {
  const t = useTranslations();

  const stats = useMemo(() => {
    return {
      available: tables.filter((t) => t.status === 'available').length,
      occupied: tables.filter((t) => t.status === 'occupied').length,
      pendingPayment: tables.filter((t) => t.status === 'pending_payment').length,
    };
  }, [tables]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
        {error}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-success/30 bg-success/10 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/20 text-success">
              <Armchair className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-success">Available</p>
              <p className="text-lg font-bold text-success">{stats.available}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/20 text-warning">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-warning">Occupied</p>
              <p className="text-lg font-bold text-warning">{stats.occupied}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent/10 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-accent">Pending Payment</p>
              <p className="text-lg font-bold text-accent">{stats.pendingPayment}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {tables.map((table) => {
            const statusColor = getStatusColor(table.status);
            const statusLabel = getStatusLabel(table.status);
            const hasActiveOrder = table.activeOrder !== undefined;
            const orderTotal = table.activeOrder?.total ?? 0;
            const itemCount = table.activeOrder?.order_items?.length ?? 0;

            return (
              <button
                key={table.id}
                onClick={() => onTableSelect(table)}
                className={`group relative flex min-h-32 flex-col justify-between rounded-lg border p-4 text-left shadow-sm transition-all duration-200 active:scale-[0.98] hover:shadow-md ${statusColor}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold">{table.name ?? table.number}</h3>
                    <p className="text-xs opacity-80">{table.location ?? 'Main Hall'}</p>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background/50">
                    <Users className="h-3 w-3" />
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium opacity-80">{statusLabel}</span>
                    <span className="opacity-60">{table.capacity} seats</span>
                  </div>

                  {hasActiveOrder && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 opacity-80">
                          <Clock className="h-3 w-3" />
                          {itemCount} items
                        </span>
                        <span className="font-semibold">
                          ${formatMoney(orderTotal)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Table number badge */}
                <div className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-xs font-bold">
                  {table.number}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
